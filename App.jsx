import React, { useState, useCallback, useEffect, useRef } from 'react';
import Board from './Board';
import Dice from './Dice';
import {
  createInitialState,
  rollDice,
  getMoveableTokens,
  moveToken,
  PLAYERS,
  PLAYER_LABELS,
  TOKENS_PER_PLAYER,
  TOKEN_STATE,
} from './gameLogic';
import './App.css';

const PLAYER_COLORS = ['#e74c3c', '#2ecc71', '#f1c40f', '#3498db'];
const PLAYER_EMOJIS = ['🔴', '🟢', '🟡', '🔵'];

function App() {
  const [gameState, setGameState] = useState(createInitialState());
  const [rolling, setRolling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const rollSoundRef = useRef(null);

  const { tokens, currentPlayer, diceValue, diceRolled, gamePhase, winner, message, moveableTokens } = gameState;

  const handleRoll = useCallback(() => {
    if (rolling || diceRolled || gamePhase === 'finished') return;

    setRolling(true);

    // Roll animation
    setTimeout(() => {
      const value = rollDice();
      setRolling(false);
      
      setGameState(prev => {
        const newState = { ...prev, diceValue: value, diceRolled: true };
        const moveable = getMoveableTokens(newState);
        
        if (moveable.length === 0) {
          // No moves available - skip turn
          const nextPlayer = (prev.currentPlayer + 1) % 4;
          return {
            ...newState,
            currentPlayer: value === 6 ? prev.currentPlayer : nextPlayer,
            diceValue: null,
            diceRolled: false,
            moveableTokens: [],
            consecutiveSixes: value === 6 ? prev.consecutiveSixes + 1 : 0,
            message: value === 6 
              ? `${PLAYER_LABELS[prev.currentPlayer]} को छक्का मिला! फिर से पासा फेंकें 🎲`
              : `${PLAYER_LABELS[prev.currentPlayer]} कोई चाल नहीं चल सकता! ${PLAYER_LABELS[nextPlayer]} की बारी 🎲`,
          };
        } else if (moveable.length === 1) {
          // Auto-move if only one option
          const moved = moveToken(newState, moveable[0]);
          return { ...moved, moveableTokens: [] };
        }

        return {
          ...newState,
          moveableTokens: moveable,
          message: `${PLAYER_LABELS[prev.currentPlayer]}: ${value} आया! गोटी चुनें 👆`,
        };
      });
    }, 600);
  }, [rolling, diceRolled, gamePhase]);

  const handleTokenClick = useCallback((tokenIndex) => {
    if (!moveableTokens.includes(tokenIndex)) return;

    setGameState(prev => {
      const newState = moveToken(prev, tokenIndex);
      return { ...newState, moveableTokens: [] };
    });
  }, [moveableTokens]);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    setShowConfetti(false);
  }, []);

  useEffect(() => {
    if (gamePhase === 'finished') {
      setShowConfetti(true);
    }
  }, [gamePhase]);

  // Player score info
  const getPlayerInfo = (playerIdx) => {
    const playerTokens = tokens.filter(t => t.player === playerIdx);
    const finished = playerTokens.filter(t => t.state === TOKEN_STATE.FINISHED).length;
    const onBoard = playerTokens.filter(t => t.state === TOKEN_STATE.ON_BOARD || t.state === TOKEN_STATE.HOME_COLUMN).length;
    return { finished, onBoard, total: TOKENS_PER_PLAYER };
  };

  return (
    <div className="app" id="ludo-app">
      {/* Background particles */}
      <div className="bg-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* Header */}
      <header className="game-header" id="game-header">
        <h1 className="game-title">
          <span className="title-emoji">🎲</span>
          लूडो
          <span className="title-emoji">🎲</span>
        </h1>
      </header>

      {/* Game container */}
      <div className="game-container" id="game-container">
        {/* Player panels - Left side */}
        <div className="side-panel left-panel">
          {[0, 3].map(pIdx => {
            const info = getPlayerInfo(pIdx);
            const isActive = currentPlayer === pIdx && gamePhase !== 'finished';
            return (
              <div
                key={pIdx}
                className={`player-card ${isActive ? 'active' : ''}`}
                style={{
                  '--player-color': PLAYER_COLORS[pIdx],
                  borderColor: isActive ? PLAYER_COLORS[pIdx] : 'transparent',
                }}
                id={`player-card-${pIdx}`}
              >
                <div className="player-card-header">
                  <span className="player-emoji">{PLAYER_EMOJIS[pIdx]}</span>
                  <span className="player-name">{PLAYER_LABELS[pIdx]}</span>
                  {isActive && <span className="active-indicator">◀</span>}
                </div>
                <div className="player-progress">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const t = tokens[pIdx * 4 + i];
                    return (
                      <div
                        key={i}
                        className={`progress-token ${t.state === TOKEN_STATE.FINISHED ? 'finished' : ''} ${t.state === TOKEN_STATE.ON_BOARD || t.state === TOKEN_STATE.HOME_COLUMN ? 'on-board' : ''}`}
                        style={{ backgroundColor: PLAYER_COLORS[pIdx] }}
                      />
                    );
                  })}
                </div>
                <div className="player-score">
                  🏠 {info.finished}/{info.total}
                </div>
              </div>
            );
          })}
        </div>

        {/* Board + Dice center */}
        <div className="center-area">
          <Board
            tokens={tokens}
            currentPlayer={currentPlayer}
            moveableTokens={moveableTokens}
            onTokenClick={handleTokenClick}
          />

          {/* Message bar */}
          <div
            className="message-bar"
            style={{ 
              borderColor: PLAYER_COLORS[currentPlayer],
              background: `linear-gradient(135deg, ${PLAYER_COLORS[currentPlayer]}15, ${PLAYER_COLORS[currentPlayer]}05)`,
            }}
            id="message-bar"
          >
            <p className="message-text">{message}</p>
          </div>

          {/* Dice area */}
          <div className="dice-area" id="dice-area">
            <Dice
              value={diceValue}
              rolling={rolling}
              onRoll={handleRoll}
              disabled={diceRolled || rolling || gamePhase === 'finished'}
              currentPlayer={currentPlayer}
            />
          </div>
        </div>

        {/* Player panels - Right side */}
        <div className="side-panel right-panel">
          {[1, 2].map(pIdx => {
            const info = getPlayerInfo(pIdx);
            const isActive = currentPlayer === pIdx && gamePhase !== 'finished';
            return (
              <div
                key={pIdx}
                className={`player-card ${isActive ? 'active' : ''}`}
                style={{
                  '--player-color': PLAYER_COLORS[pIdx],
                  borderColor: isActive ? PLAYER_COLORS[pIdx] : 'transparent',
                }}
                id={`player-card-${pIdx}`}
              >
                <div className="player-card-header">
                  <span className="player-emoji">{PLAYER_EMOJIS[pIdx]}</span>
                  <span className="player-name">{PLAYER_LABELS[pIdx]}</span>
                  {isActive && <span className="active-indicator">▶</span>}
                </div>
                <div className="player-progress">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const t = tokens[pIdx * 4 + i];
                    return (
                      <div
                        key={i}
                        className={`progress-token ${t.state === TOKEN_STATE.FINISHED ? 'finished' : ''} ${t.state === TOKEN_STATE.ON_BOARD || t.state === TOKEN_STATE.HOME_COLUMN ? 'on-board' : ''}`}
                        style={{ backgroundColor: PLAYER_COLORS[pIdx] }}
                      />
                    );
                  })}
                </div>
                <div className="player-score">
                  🏠 {info.finished}/{info.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restart button */}
      <button className="restart-btn" onClick={handleRestart} id="restart-btn">
        🔄 नया गेम
      </button>

      {/* Winner overlay */}
      {gamePhase === 'finished' && (
        <div className="winner-overlay" id="winner-overlay">
          <div className="winner-modal">
            <div className="confetti-burst">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: PLAYER_COLORS[Math.floor(Math.random() * 4)],
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
            <h2 className="winner-title">🏆 बधाई हो! 🏆</h2>
            <div className="winner-name" style={{ color: PLAYER_COLORS[winner] }}>
              {PLAYER_EMOJIS[winner]} {PLAYER_LABELS[winner]} जीत गया!
            </div>
            <button className="play-again-btn" onClick={handleRestart} id="play-again-btn">
              🎮 फिर से खेलें
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
