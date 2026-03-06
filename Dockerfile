FROM python:3.12-slim

# Install Node.js 20, ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# Install birdnet-analyzer + pre-download the 224MB model
RUN pip install --no-cache-dir birdnet-analyzer
RUN ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 3 /tmp/warmup.wav -y 2>/dev/null \
  && python3 -m birdnet_analyzer.analyze /tmp/warmup.wav -o /tmp/warmup_out/ --rtype csv --min_conf 0.5 2>/dev/null || true \
  && rm -rf /tmp/warmup.wav /tmp/warmup_out/

WORKDIR /app

# Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend/ ./backend/

EXPOSE 3001
CMD ["node", "backend/server.js"]
