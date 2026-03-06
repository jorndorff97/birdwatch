import { useState } from 'react';

export default function BirdDetails({ description, pageUrl }) {
  const [open, setOpen] = useState(false);

  if (!description) return null;

  return (
    <div>
      <button className="details-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▲ Hide details' : '▼ More about this bird'}
      </button>

      {open && (
        <div className="details-panel glass-card">
          <p className="details-description">{description}</p>
          {pageUrl && (
            <a
              className="wiki-link"
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read more on Wikipedia →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
