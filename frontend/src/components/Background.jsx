import { useMemo } from 'react';

const FIREFLY_COUNT = 28;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function Background() {
  const fireflies = useMemo(() => {
    return Array.from({ length: FIREFLY_COUNT }, (_, i) => ({
      id: i,
      style: {
        left: `${randomBetween(2, 98)}%`,
        top: `${randomBetween(5, 95)}%`,
        '--dur': `${randomBetween(6, 14)}s`,
        '--dx': `${randomBetween(-80, 80)}px`,
        '--dy': `${randomBetween(-100, -20)}px`,
        '--dx2': `${randomBetween(-60, 60)}px`,
        '--dy2': `${randomBetween(10, 60)}px`,
        animationDelay: `${randomBetween(0, 10)}s`,
        width: `${randomBetween(2, 5)}px`,
        height: `${randomBetween(2, 5)}px`,
      },
    }));
  }, []);

  return (
    <div className="fireflies" aria-hidden="true">
      {fireflies.map((ff) => (
        <div key={ff.id} className="firefly" style={ff.style} />
      ))}
    </div>
  );
}
