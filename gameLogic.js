// ==========================================
// LUDO GAME LOGIC
// ==========================================

// Board positions: Each player has a path of 57 positions (52 common + 5 home stretch + 1 home)
// Players: 0=Red, 1=Green, 2=Yellow, 3=Blue
// Each player has 4 tokens

export const PLAYERS = ['red', 'green', 'yellow', 'blue'];
export const PLAYER_LABELS = ['लाल', 'हरा', 'पीला', 'नीला'];
export const TOKENS_PER_PLAYER = 4;

// Starting positions on the main track (52 cells, 0-indexed)
export const START_POSITIONS = [0, 13, 26, 39];

// Entry to home column (the cell BEFORE home column)
export const HOME_ENTRY = [50, 11, 24, 37];

// Safe positions on the board (cannot be killed here)
export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

// Token states
export const TOKEN_STATE = {
  HOME_BASE: 'home_base',   // In the starting area
  ON_BOARD: 'on_board',     // On the main track
  HOME_COLUMN: 'home_column', // In the home stretch
  FINISHED: 'finished',     // Reached home
};

// The main track coordinates (15x15 grid)
// Row, Col positions for the 52 cells of the main track
export const MAIN_TRACK = [
  // Bottom center going up (Red's exit path side) - cells 0-4
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Top-left corner going right - cells 5-8  
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6],
  // cells 9-12
  [0, 6], [0, 7], [0, 8],
  // Top-right going down - cells 13-17
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // cells 18-22
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13],
  // Right side going down - cells 23-25
  [6, 14], [7, 14], [8, 14],
  // Bottom-right going left - cells 26-30
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // cells 31-35
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
  // Bottom going left - cells 36-38
  [14, 8], [14, 7], [14, 6],
  // Bottom-left going up - cells 39-43
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // cells 44-48
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1],
  // Left side going up - cells 49-51
  [8, 0], [7, 0], [6, 0],
];

// Home columns for each player (5 cells each + final home)
export const HOME_COLUMNS = [
  // Red: bottom center going up
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  // Green: top going right  
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  // Yellow: right going left
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  // Blue: bottom going up
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
];

// Home base positions for tokens (where they sit before entering board)
export const HOME_BASE_POSITIONS = [
  // Red (bottom-left)
  [[2, 2], [2, 4], [4, 2], [4, 4]],
  // Green (top-left)  
  [[2, 10], [2, 12], [4, 10], [4, 12]],
  // Yellow (top-right)
  [[10, 10], [10, 12], [12, 10], [12, 12]],
  // Blue (bottom-right)
  [[10, 2], [10, 4], [12, 2], [12, 4]],
];

// Center home position
export const CENTER_HOME = [7, 7];

export function createInitialState() {
  const tokens = [];
  for (let p = 0; p < 4; p++) {
    for (let t = 0; t < TOKENS_PER_PLAYER; t++) {
      tokens.push({
        player: p,
        tokenIndex: t,
        state: TOKEN_STATE.HOME_BASE,
        position: -1,         // position on main track (0-51)
        homeColumnPos: -1,    // position in home column (0-4)
      });
    }
  }

  return {
    tokens,
    currentPlayer: 0,
    diceValue: null,
    diceRolled: false,
    consecutiveSixes: 0,
    gamePhase: 'waiting',  // 'waiting', 'rolling', 'moving', 'finished'
    winner: null,
    message: 'लाल की बारी है! पासा फेंकें 🎲',
    moveableTokens: [],
    lastKill: null,
  };
}

export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

export function getTokenGlobalPosition(token, playerIndex) {
  if (token.state === TOKEN_STATE.ON_BOARD) {
    // Convert player-relative position to global position
    return (token.position + START_POSITIONS[playerIndex]) % 52;
  }
  return -1;
}

export function getTokenGridPosition(token, playerIndex) {
  if (token.state === TOKEN_STATE.HOME_BASE) {
    return HOME_BASE_POSITIONS[playerIndex][token.tokenIndex];
  }
  if (token.state === TOKEN_STATE.ON_BOARD) {
    const globalPos = getTokenGlobalPosition(token, playerIndex);
    return MAIN_TRACK[globalPos];
  }
  if (token.state === TOKEN_STATE.HOME_COLUMN) {
    return HOME_COLUMNS[playerIndex][token.homeColumnPos];
  }
  if (token.state === TOKEN_STATE.FINISHED) {
    return CENTER_HOME;
  }
  return null;
}

export function canMoveToken(token, diceValue, playerIndex, allTokens) {
  // Can't move finished tokens
  if (token.state === TOKEN_STATE.FINISHED) return false;

  // From home base, need a 6
  if (token.state === TOKEN_STATE.HOME_BASE) {
    return diceValue === 6;
  }

  // On the board
  if (token.state === TOKEN_STATE.ON_BOARD) {
    const newPos = token.position + diceValue;
    
    // Check if entering home column
    const stepsToHome = 51 - token.position; // steps to reach home entry
    
    if (newPos <= 51) {
      return true; // Normal move on main track
    } else if (newPos <= 56) {
      // Entering or moving in home column  
      return true;
    } else if (newPos === 57) {
      // Exact landing at home
      return true;
    }
    return false; // Overshoot
  }

  // In home column
  if (token.state === TOKEN_STATE.HOME_COLUMN) {
    const newHomePos = token.homeColumnPos + diceValue;
    if (newHomePos <= 4) {
      return true; // Move within home column
    } else if (newHomePos === 5) {
      return true; // Reach home!
    }
    return false; // Overshoot
  }

  return false;
}

export function getMoveableTokens(state) {
  const { tokens, currentPlayer, diceValue } = state;
  if (diceValue === null) return [];

  const playerTokens = tokens.filter(t => t.player === currentPlayer);
  return playerTokens
    .filter(t => canMoveToken(t, diceValue, currentPlayer, tokens))
    .map(t => t.player * TOKENS_PER_PLAYER + t.tokenIndex);
}

export function moveToken(state, tokenGlobalIndex) {
  const newState = JSON.parse(JSON.stringify(state));
  const token = newState.tokens[tokenGlobalIndex];
  const playerIndex = token.player;
  const diceValue = newState.diceValue;
  let extraTurn = false;
  let killed = false;

  if (token.state === TOKEN_STATE.HOME_BASE && diceValue === 6) {
    // Move out of home base onto starting position
    token.state = TOKEN_STATE.ON_BOARD;
    token.position = 0;
    extraTurn = true; // 6 gives extra turn
  } else if (token.state === TOKEN_STATE.ON_BOARD) {
    const newPos = token.position + diceValue;
    
    if (newPos <= 51) {
      // Normal move on main track
      token.position = newPos;
    } else if (newPos <= 57) {
      // Entering home column
      const homeColPos = newPos - 52;
      if (homeColPos <= 4) {
        token.state = TOKEN_STATE.HOME_COLUMN;
        token.homeColumnPos = homeColPos;
        token.position = -1;
      } else if (homeColPos === 5) {
        token.state = TOKEN_STATE.FINISHED;
        token.position = -1;
        token.homeColumnPos = -1;
      }
    }
  } else if (token.state === TOKEN_STATE.HOME_COLUMN) {
    const newHomePos = token.homeColumnPos + diceValue;
    if (newHomePos <= 4) {
      token.homeColumnPos = newHomePos;
    } else if (newHomePos === 5) {
      token.state = TOKEN_STATE.FINISHED;
      token.homeColumnPos = -1;
    }
  }

  // Check for kills (only on main track)
  if (token.state === TOKEN_STATE.ON_BOARD) {
    const globalPos = getTokenGlobalPosition(token, playerIndex);
    const isSafe = SAFE_POSITIONS.includes(globalPos);
    
    if (!isSafe) {
      newState.tokens.forEach((otherToken, idx) => {
        if (otherToken.player !== playerIndex && otherToken.state === TOKEN_STATE.ON_BOARD) {
          const otherGlobalPos = getTokenGlobalPosition(otherToken, otherToken.player);
          if (otherGlobalPos === globalPos) {
            // Kill! Send back to home base
            otherToken.state = TOKEN_STATE.HOME_BASE;
            otherToken.position = -1;
            killed = true;
            newState.lastKill = { killer: playerIndex, victim: otherToken.player };
          }
        }
      });
    }
  }

  // Check for extra turn
  if (diceValue === 6) {
    newState.consecutiveSixes += 1;
    if (newState.consecutiveSixes >= 3) {
      // 3 consecutive sixes - lose turn
      extraTurn = false;
      newState.consecutiveSixes = 0;
      newState.message = `${PLAYER_LABELS[playerIndex]} को लगातार 3 छक्के! बारी गई! 😤`;
    } else {
      extraTurn = true;
    }
  } else {
    newState.consecutiveSixes = 0;
  }

  if (killed) {
    extraTurn = true; // Killing gives extra turn
  }

  // Check if player has won
  const playerTokens = newState.tokens.filter(t => t.player === playerIndex);
  const allFinished = playerTokens.every(t => t.state === TOKEN_STATE.FINISHED);
  if (allFinished) {
    newState.gamePhase = 'finished';
    newState.winner = playerIndex;
    newState.message = `🎉 ${PLAYER_LABELS[playerIndex]} जीत गया! 🏆`;
    return newState;
  }

  // Next turn
  if (extraTurn) {
    newState.message = killed 
      ? `💥 ${PLAYER_LABELS[playerIndex]} ने मारा! फिर से बारी! 🎲`
      : `${PLAYER_LABELS[playerIndex]} को छक्का! फिर से बारी! 🎲`;
  } else {
    const nextPlayer = (playerIndex + 1) % 4;
    newState.currentPlayer = nextPlayer;
    newState.message = `${PLAYER_LABELS[nextPlayer]} की बारी है! पासा फेंकें 🎲`;
  }

  newState.diceValue = null;
  newState.diceRolled = false;
  newState.moveableTokens = [];

  return newState;
}
