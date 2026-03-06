import BirdDetails from './BirdDetails.jsx';

export default function BirdResult({ result, onReset }) {
  const { top_result, alternatives } = result;
  const confidencePct = Math.round((top_result.confidence || 0) * 100);

  return (
    <div className="result-card glass-card">
      {/* Bird image */}
      <div className="bird-image-wrap">
        {top_result.thumbnail ? (
          <img src={top_result.thumbnail} alt={top_result.common_name} />
        ) : (
          <span className="bird-image-placeholder" role="img" aria-label="bird silhouette">
            🐦
          </span>
        )}
      </div>

      {/* Name */}
      <h2 className="bird-name">{top_result.common_name}</h2>
      <p className="bird-scientific">{top_result.scientific_name}</p>

      {/* Confidence bar */}
      <p className="confidence-label">Confidence</p>
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${confidencePct}%` }}
        />
      </div>
      <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: 'rgba(245,237,224,0.5)' }}>
        {confidencePct}%
      </p>

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div className="alternatives">
          <h4>Other possibilities</h4>
          {alternatives.map((alt, i) => (
            <div key={i} className="alt-item">
              <span>{alt.common_name}</span>
              <span className="alt-confidence">{Math.round(alt.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Wikipedia details */}
      <BirdDetails
        description={top_result.description}
        pageUrl={top_result.page_url}
      />

      <button className="new-recording-btn" onClick={onReset}>
        Record another
      </button>
    </div>
  );
}
