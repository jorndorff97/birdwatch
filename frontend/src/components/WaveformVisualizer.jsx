import { useEffect, useRef } from 'react';

export default function WaveformVisualizer({ analyserNode }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!analyserNode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(212, 160, 23, 0.85)';
      ctx.shadowColor = 'rgba(212, 160, 23, 0.4)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
      width={440}
      height={70}
    />
  );
}
