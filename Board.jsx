import React, { useMemo } from 'react';
import {
  MAIN_TRACK,
  HOME_COLUMNS,
  HOME_BASE_POSITIONS,
  SAFE_POSITIONS,
  START_POSITIONS,
  PLAYERS,
  getTokenGlobalPosition,
  TOKEN_STATE,
} from './gameLogic';

const CELL_SIZE = 40;
const BOARD_SIZE = 15;
const TOTAL_SIZE = BOARD_SIZE * CELL_SIZE;

const PLAYER_COLORS = ['#e74c3c', '#2ecc71', '#f1c40f', '#3498db'];
const PLAYER_COLORS_LIGHT = ['#fadbd8', '#d5f5e3', '#fef9e7', '#d6eaf8'];
const PLAYER_COLORS_DARK = ['#922b21', '#1e8449', '#b7950b', '#1f618d'];

// Which cells belong to which player's start
const PLAYER_START_CELLS = {};
START_POSITIONS.forEach((pos, idx) => {
  PLAYER_START_CELLS[pos] = idx;
});

// Safe position set for quick lookup
const SAFE_SET = new Set(SAFE_POSITIONS);

function getCellColor(row, col) {
  // Home bases (corners)
  // Red: rows 0-5, cols 0-5
  if (row <= 5 && col <= 5) return { bg: '#fadbd8', border: '#e74c3c', zone: 'red' };
  // Green: rows 0-5, cols 9-14
  if (row <= 5 && col >= 9) return { bg: '#d5f5e3', border: '#2ecc71', zone: 'green' };
  // Yellow: rows 9-14, cols 9-14
  if (row >= 9 && col >= 9) return { bg: '#fef9e7', border: '#f1c40f', zone: 'yellow' };
  // Blue: rows 9-14, cols 0-5
  if (row >= 9 && col <= 5) return { bg: '#d6eaf8', border: '#3498db', zone: 'blue' };
  return null;
}

export default function Board({ tokens, currentPlayer, moveableTokens, onTokenClick }) {
  // Build a map of grid positions to tokens
  const tokenPositionMap = useMemo(() => {
    const map = {};
    tokens.forEach((token, idx) => {
      let pos = null;
      if (token.state === TOKEN_STATE.HOME_BASE) {
        pos = HOME_BASE_POSITIONS[token.player][token.tokenIndex];
      } else if (token.state === TOKEN_STATE.ON_BOARD) {
        const globalPos = getTokenGlobalPosition(token, token.player);
        pos = MAIN_TRACK[globalPos];
      } else if (token.state === TOKEN_STATE.HOME_COLUMN) {
        pos = HOME_COLUMNS[token.player][token.homeColumnPos];
      } else if (token.state === TOKEN_STATE.FINISHED) {
        // Don't show on board
        return;
      }
      if (pos) {
        const key = `${pos[0]},${pos[1]}`;
        if (!map[key]) map[key] = [];
        map[key].push({ ...token, globalIndex: idx });
      }
    });
    return map;
  }, [tokens]);

  // Build track cell set for highlighting
  const trackCellSet = useMemo(() => {
    const set = new Set();
    MAIN_TRACK.forEach(([r, c]) => set.add(`${r},${c}`));
    HOME_COLUMNS.forEach(col => col.forEach(([r, c]) => set.add(`${r},${c}`)));
    return set;
  }, []);

  const renderCell = (row, col) => {
    const key = `${row},${col}`;
    const isTrackCell = trackCellSet.has(key);
    const zoneColor = getCellColor(row, col);
    const tokensHere = tokenPositionMap[key] || [];
    
    // Find if this is a safe position
    const mainTrackIndex = MAIN_TRACK.findIndex(([r, c]) => r === row && c === col);
    const isSafe = mainTrackIndex !== -1 && SAFE_SET.has(mainTrackIndex);
    
    // Find if this is a player's start
    const isStart = mainTrackIndex !== -1 && PLAYER_START_CELLS[mainTrackIndex] !== undefined;
    const startPlayer = isStart ? PLAYER_START_CELLS[mainTrackIndex] : -1;

    // Check if it's a home column cell
    let homeColPlayer = -1;
    HOME_COLUMNS.forEach((cols, pIdx) => {
      cols.forEach(([r, c]) => {
        if (r === row && c === col) homeColPlayer = pIdx;
      });
    });

    // Center home
    const isCenter = row === 7 && col === 7;

    // Home base inner circle positions
    let isHomeBaseCircle = false;
    HOME_BASE_POSITIONS.forEach((positions, pIdx) => {
      positions.forEach(([r, c]) => {
        if (r === row && c === col) isHomeBaseCircle = true;
      });
    });

    let cellClass = 'board-cell';
    let cellStyle = {};

    if (isCenter) {
      cellClass += ' center-home';
    } else if (isTrackCell) {
      cellClass += ' track-cell';
      if (isSafe) {
        cellClass += ' safe-cell';
      }
      if (isStart) {
        cellStyle.backgroundColor = PLAYER_COLORS_LIGHT[startPlayer];
        cellStyle.borderColor = PLAYER_COLORS[startPlayer];
      }
      if (homeColPlayer >= 0) {
        cellStyle.backgroundColor = PLAYER_COLORS[homeColPlayer];
        cellStyle.opacity = 0.6;
      }
    } else if (zoneColor) {
      if (isHomeBaseCircle) {
        cellClass += ' home-base-circle';
      }
    }

    return (
      <div
        key={key}
        className={cellClass}
        style={{
          ...cellStyle,
          gridRow: row + 1,
          gridColumn: col + 1,
        }}
        data-row={row}
        data-col={col}
      >
        {isSafe && !isStart && <span className="safe-star">✦</span>}
        {isStart && <span className="start-arrow">★</span>}
        {isCenter && <span className="center-icon">🏠</span>}
        
        {/* Render tokens */}
        <div className={`token-stack ${tokensHere.length > 1 ? 'stacked' : ''}`}>
          {tokensHere.map((token, tIdx) => {
            const isMoveable = moveableTokens.includes(token.globalIndex);
            return (
              <div
                key={token.globalIndex}
                className={`token ${isMoveable ? 'token-moveable' : ''} ${token.player === currentPlayer ? 'token-current' : ''}`}
                style={{
                  backgroundColor: PLAYER_COLORS[token.player],
                  borderColor: PLAYER_COLORS_DARK[token.player],
                  zIndex: isMoveable ? 10 : 5,
                  transform: tokensHere.length > 1 ? `translate(${(tIdx % 2) * 10 - 5}px, ${Math.floor(tIdx / 2) * 10 - 5}px) scale(${tokensHere.length > 2 ? 0.6 : 0.75})` : 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMoveable) onTokenClick(token.globalIndex);
                }}
                id={`token-${token.player}-${token.tokenIndex}`}
              >
                <div className="token-inner" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const cells = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      cells.push(renderCell(r, c));
    }
  }

  return (
    <div className="board-wrapper" id="ludo-board">
      {/* Corner zones */}
      <div className="corner-zone red-zone" />
      <div className="corner-zone green-zone" />
      <div className="corner-zone yellow-zone" />
      <div className="corner-zone blue-zone" />
      
      {/* Center triangle decorations */}
      <div className="center-triangles">
        <div className="triangle triangle-red" />
        <div className="triangle triangle-green" />
        <div className="triangle triangle-yellow" />
        <div className="triangle triangle-blue" />
      </div>

      <div className="board-grid">
        {cells}
      </div>
    </div>
  );
}
