import { useState, useRef, useEffect, useCallback } from 'react';
import WaveformVisualizer from './WaveformVisualizer.jsx';

const MAX_DURATION = 30; // seconds

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Mic icon SVG
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V22h2v-2.07A8 8 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93z" />
    </svg>
  );
}

// Stop icon SVG
function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

export default function Recorder({ isRecording, onStart, onStop }) {
  const [elapsed, setElapsed] = useState(0);
  const [analyserNode, setAnalyserNode] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setAnalyserNode(null);
    setElapsed(0);
  }, []);

  const startRecording = useCallback(async () => {
    chunksRef.current = [];
    setElapsed(0);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert('Microphone access denied. Please allow microphone permission and try again.');
      return;
    }

    // Web Audio API for waveform
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    setAnalyserNode(analyser);

    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onStop(blob);
    };

    recorder.start();
    onStart();

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= MAX_DURATION) {
          stopRecording();
          return MAX_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
  }, [onStart, onStop, stopRecording]);

  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div className="recorder-container">
      <button
        className={`mic-btn${isRecording ? ' recording' : ''}`}
        onClick={handleClick}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? <StopIcon /> : <MicIcon />}
      </button>

      <span className={`timer${isRecording ? ' recording' : ''}`}>
        {formatTime(elapsed)}
      </span>

      {!isRecording && (
        <p className="rec-hint">Tap the mic and hold your device near the bird song</p>
      )}

      {isRecording && analyserNode && (
        <WaveformVisualizer analyserNode={analyserNode} />
      )}
    </div>
  );
}
