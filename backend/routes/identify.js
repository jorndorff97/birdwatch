import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

// Convert any audio format → WAV (48kHz mono) via ffmpeg
async function toWav(inputPath) {
  const wavPath = inputPath + '.wav';
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -ar 48000 -ac 1 "${wavPath}" 2>/dev/null`
  );
  return wavPath;
}

// Run BirdNET-Analyzer CLI, return top N unique species sorted by confidence
async function runBirdNET(wavPath) {
  const outDir = wavPath + '_out';
  fs.mkdirSync(outDir, { recursive: true });

  try {
    await execAsync(
      `python3.13 -m birdnet_analyzer.analyze "${wavPath}" -o "${outDir}" --rtype csv --min_conf 0.1`,
      { timeout: 120_000 }
    );
  } catch (err) {
    // BirdNET exits non-zero if no detections — still check for CSV output
    if (!fs.existsSync(outDir)) throw err;
  }

  // Find the generated CSV file
  const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.csv'));
  if (files.length === 0) return [];

  const csvText = fs.readFileSync(path.join(outDir, files[0]), 'utf8');
  fs.rmSync(outDir, { recursive: true, force: true });

  // BirdNET CSV has 2 metadata rows then a header row then data rows
  // Find the data header line that starts with "Start"
  const lines = csvText.trim().split('\n');
  const headerIdx = lines.findIndex((l) => l.startsWith('Start'));
  if (headerIdx === -1) return [];

  const dataLines = lines.slice(headerIdx + 1).filter(Boolean);

  // Parse: Start (s), End (s), Scientific name, Common name, Confidence, File
  const rows = dataLines.map((line) => {
    const parts = line.split(',');
    return {
      scientific_name: parts[2]?.trim() || '',
      common_name: parts[3]?.trim() || '',
      confidence: parseFloat(parts[4]) || 0,
    };
  });

  // Deduplicate by species, keep highest confidence per species
  const bySpecies = {};
  for (const row of rows) {
    const key = row.common_name;
    if (!bySpecies[key] || row.confidence > bySpecies[key].confidence) {
      bySpecies[key] = row;
    }
  }

  return Object.values(bySpecies)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

async function getWikipediaData(birdName) {
  const encodedName = encodeURIComponent(birdName.replace(/ /g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedName}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BirdwatchApp/1.0 (educational project)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      description: data.extract || '',
      thumbnail: data.thumbnail?.source || null,
      page_url: data.content_urls?.desktop?.page || null,
    };
  } catch {
    return null;
  }
}

router.post('/identify', upload.single('audio'), async (req, res) => {
  const rawPath = req.file?.path;
  let wavPath = null;

  try {
    if (!rawPath) return res.status(400).json({ error: 'No audio file received' });

    // Convert to WAV
    wavPath = await toWav(rawPath);

    // Run BirdNET
    const birds = await runBirdNET(wavPath);

    if (birds.length === 0) {
      return res.status(200).json({
        top_result: null,
        alternatives: [],
        message: 'No birds detected. Try recording in a quieter spot, closer to the bird.',
      });
    }

    const topBird = birds[0];
    const wikiData = await getWikipediaData(topBird.common_name);

    res.json({
      top_result: { ...topBird, ...wikiData },
      alternatives: birds.slice(1),
    });
  } catch (err) {
    console.error('Identification error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (rawPath) fs.unlink(rawPath, () => {});
    if (wavPath) fs.unlink(wavPath, () => {});
  }
});

export default router;
