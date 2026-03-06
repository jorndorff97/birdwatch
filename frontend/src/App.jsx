import { useState, useCallback } from 'react';
import Background from './components/Background.jsx';
import Recorder from './components/Recorder.jsx';
import LoadingAnimation from './components/LoadingAnimation.jsx';
import BirdResult from './components/BirdResult.jsx';

// UI states
const STATE = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  RESULT: 'result',
};

export default function App() {
  const [uiState, setUiState] = useState(STATE.IDLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRecordingStart = useCallback(() => {
    setUiState(STATE.RECORDING);
    setError(null);
    setResult(null);
  }, []);

  const handleRecordingStop = useCallback(async (audioBlob) => {
    setUiState(STATE.PROCESSING);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Identification failed');
      }

      const data = await response.json();
      if (!data.top_result) {
        setError(data.message || 'No birds detected — try again closer to the sound.');
        setUiState(STATE.IDLE);
        return;
      }
      setResult(data);
      setUiState(STATE.RESULT);
    } catch (err) {
      setError(err.message);
      setUiState(STATE.IDLE);
    }
  }, []);

  const handleReset = useCallback(() => {
    setUiState(STATE.IDLE);
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      <Background />
      <div className="app">
        <header className="app-header">
          <h1>BirdWatch</h1>
          <p>Record a bird call — discover the species</p>
        </header>

        {(uiState === STATE.IDLE || uiState === STATE.RECORDING) && (
          <Recorder
            isRecording={uiState === STATE.RECORDING}
            onStart={handleRecordingStart}
            onStop={handleRecordingStop}
          />
        )}

        {uiState === STATE.PROCESSING && <LoadingAnimation />}

        {uiState === STATE.RESULT && result && (
          <BirdResult result={result} onReset={handleReset} />
        )}

        {error && (
          <p style={{ color: '#e05252', marginTop: '1rem', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}
      </div>
    </>
  );
}
