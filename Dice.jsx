import React, { useState, useCallback, useRef, useEffect } from 'react';

const DICE_FACES = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const PLAYER_COLORS = {
  0: '#e74c3c',
  1: '#2ecc71',
  2: '#f1c40f',
  3: '#3498db',
};

export default function Dice({ value, rolling, onRoll, disabled, currentPlayer }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const diceRef = useRef(null);

  const handleClick = useCallback(() => {
    if (disabled || isAnimating) return;
    setIsAnimating(true);
    onRoll();
    setTimeout(() => setIsAnimating(false), 600);
  }, [disabled, isAnimating, onRoll]);

  const displayValue = rolling ? Math.floor(Math.random() * 6) + 1 : (value || 1);
  const dots = DICE_FACES[displayValue] || DICE_FACES[1];
  const playerColor = PLAYER_COLORS[currentPlayer];

  return (
    <div className="dice-container" id="dice-container">
      <button
        ref={diceRef}
        className={`dice ${rolling ? 'dice-rolling' : ''} ${disabled ? 'dice-disabled' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        id="dice-button"
        style={{
          '--player-glow': playerColor,
        }}
      >
        <div className="dice-face">
          {dots.map(([row, col], i) => (
            <div
              key={i}
              className="dice-dot"
              style={{
                gridRow: row + 1,
                gridColumn: col + 1,
              }}
            />
          ))}
        </div>
        {value && !rolling && (
          <div className="dice-value-badge" style={{ background: playerColor }}>
            {value}
          </div>
        )}
      </button>
      {!disabled && !rolling && (
        <div className="dice-hint" style={{ color: playerColor }}>
          टैप करें ☝️
        </div>
      )}
    </div>
  );
}
