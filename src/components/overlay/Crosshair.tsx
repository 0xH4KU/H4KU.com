import React from 'react';

interface CrosshairProps {
  show: boolean;
  mousePos: {
    x: number;
    y: number;
  };
}

const Crosshair: React.FC<CrosshairProps> = ({ show, mousePos }) => {
  if (!show) {
    return null;
  }

  const hasWindow = typeof window !== 'undefined';
  const maxX = hasWindow ? window.innerWidth - 120 : mousePos.x + 12;
  const maxY = hasWindow ? window.innerHeight - 40 : mousePos.y + 12;
  const labelX = Math.min(mousePos.x + 12, maxX);
  const labelY = Math.min(mousePos.y + 12, maxY);

  return (
    <>
      <div className="crosshair-x" style={{ transform: `translateY(${mousePos.y}px)` }} />
      <div className="crosshair-y" style={{ transform: `translateX(${mousePos.x}px)` }} />
      <div className="crosshair-label" style={{ transform: `translate(${labelX}px, ${labelY}px)` }}>
        {Math.round(mousePos.x)}, {Math.round(mousePos.y)} | col {Math.round(mousePos.x / 24)}, row {Math.round(mousePos.y / 24)}
      </div>
    </>
  );
};

export default Crosshair;
