import { useState, useCallback, useRef } from 'react';
import { STATES } from './game/constants.js';
import TutorialScreen from './screens/TutorialScreen.jsx';
import ResumePopup from './screens/ResumePopup.jsx';
import VictoryScreen from './screens/VictoryScreen.jsx';
import Game from './game/Game.jsx';

export default function App() {
  const [screen, setScreen] = useState('intro'); // 'intro' | 'game' | 'victory'
  const [gameState, setGameState] = useState(STATES.PLAYING);
  const [revealData, setRevealData] = useState(null); // { enemyIndex, continueCallback }
  const [victoryStats, setVictoryStats] = useState(null);

  const handleStart = useCallback(() => {
    setScreen('game');
    setGameState(STATES.PLAYING);
  }, []);

  const handleEnemyDead = useCallback((enemyIndex, continueCallback) => {
    setGameState(STATES.REVEAL);
    setRevealData({ enemyIndex, continueCallback });
  }, []);

  const handlePopupContinue = useCallback(() => {
    if (revealData?.continueCallback) {
      revealData.continueCallback();
    }
    setRevealData(null);
    setGameState(STATES.PLAYING);
  }, [revealData]);

  const handleVictory = useCallback((stats) => {
    setVictoryStats(stats);
    setGameState(STATES.VICTORY);
    setTimeout(() => setScreen('victory'), 800);
  }, []);

  const handleRestart = useCallback(() => {
    setScreen('intro');
    setGameState(STATES.PLAYING);
    setRevealData(null);
    setVictoryStats(null);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#020710', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {screen === 'intro' && (
        <TutorialScreen onStart={handleStart} />
      )}

      {screen === 'game' && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Game
            gameState={gameState}
            onEnemyDead={handleEnemyDead}
            onVictory={handleVictory}
          />

          {/* Resume popup overlay */}
          {revealData && (
            <ResumePopup
              enemyIndex={revealData.enemyIndex}
              onContinue={handlePopupContinue}
            />
          )}
        </div>
      )}

      {screen === 'victory' && (
        <VictoryScreen
          stats={victoryStats}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
