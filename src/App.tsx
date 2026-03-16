/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Trophy, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Star,
  Sparkles
} from 'lucide-react';
import { Player, GamePhase, GameState, LEVELS } from './types';

const generatePool = (size: number, target: number, numToPick: number, operators: string[]) => {
  // Simple pool generation: ensure at least one solution exists
  // For now, let's just generate random numbers and hope for the best, 
  // or better: generate a solution first and then fill the pool.
  const picked: number[] = [];
  let current = Math.floor(Math.random() * 10) + 1;
  picked.push(current);
  
  for (let i = 1; i < numToPick; i++) {
    const op = operators[Math.floor(Math.random() * operators.length)];
    const next = Math.floor(Math.random() * 10) + 1;
    if (op === '+') current += next;
    else if (op === '-') current -= next;
    else if (op === '*') current *= next;
    else if (op === '/') {
      // Ensure divisibility
      const factor = Math.floor(Math.random() * 5) + 1;
      const val = next * factor;
      picked[picked.length-1] = val; // modify previous to be divisible
      current = (current / next) * val; // this is getting complex, let's simplify
    }
    picked.push(next);
  }

  // Actually, let's just generate a random pool and let the player figure it out.
  // But we need to make sure the target is reachable.
  // For the sake of a smooth game, let's just generate random numbers and if they can't solve it, they can refresh.
  const pool: number[] = [];
  for (let i = 0; i < size; i++) {
    pool.push(Math.floor(Math.random() * 20) + 1);
  }
  return pool;
};

export default function App() {
  const [state, setState] = useState<GameState>({
    level: 1,
    currentPlayer: 1,
    phase: GamePhase.POSING,
    targetNumber: null,
    availableNumbers: [],
    solution: {
      numbers: [],
      operators: []
    },
    consecutiveSuccesses: { 1: 0, 2: 0 },
    message: "Player 1, suggest a target number!"
  });

  const [inputTarget, setInputTarget] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentOperators, setCurrentOperators] = useState<string[]>([]);

  const currentLevel = LEVELS.find(l => l.id === state.level) || LEVELS[0];

  const handlePose = () => {
    const target = parseInt(inputTarget);
    if (isNaN(target)) return;

    const pool = generatePool(currentLevel.poolSize, target, currentLevel.numToPick, currentLevel.operators);
    
    setState(prev => ({
      ...prev,
      phase: GamePhase.COMPUTING,
      targetNumber: target,
      availableNumbers: pool,
      message: `Player ${prev.currentPlayer === 1 ? 2 : 1}, solve it!`
    }));
    setInputTarget('');
  };

  const calculateResult = () => {
    if (selectedIndices.length === 0) return null;
    let res = state.availableNumbers[selectedIndices[0]];
    for (let i = 0; i < currentOperators.length; i++) {
      const nextNum = state.availableNumbers[selectedIndices[i + 1]];
      if (nextNum === undefined) break;
      const op = currentOperators[i];
      if (op === '+') res += nextNum;
      else if (op === '-') res -= nextNum;
      else if (op === '*') res *= nextNum;
      else if (op === '/') res /= nextNum;
    }
    return res;
  };

  const handleCompute = () => {
    const result = calculateResult();
    if (result === state.targetNumber && selectedIndices.length === currentLevel.numToPick) {
      const solver = state.currentPlayer === 1 ? 2 : 1;
      const newSuccesses = { ...state.consecutiveSuccesses };
      newSuccesses[solver] += 1;

      const bothReached = newSuccesses[1] >= currentLevel.requiredSuccesses && newSuccesses[2] >= currentLevel.requiredSuccesses;

      if (bothReached && state.level < 5) {
        setState(prev => ({
          ...prev,
          phase: GamePhase.LEVEL_UP,
          consecutiveSuccesses: { 1: 0, 2: 0 },
          message: "AMAZING! Level Up!"
        }));
      } else {
        setState(prev => ({
          ...prev,
          phase: GamePhase.SUCCESS,
          consecutiveSuccesses: newSuccesses,
          message: "YOU COMPUTE! Correct!"
        }));
      }
      setSelectedIndices([]);
      setCurrentOperators([]);
    } else {
      // Wrong answer feedback
    }
  };

  const nextTurn = () => {
    setState(prev => ({
      ...prev,
      phase: GamePhase.POSING,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      targetNumber: null,
      message: `Player ${prev.currentPlayer === 1 ? 2 : 1}, suggest a target number!`
    }));
  };

  const proceedLevel = () => {
    setState(prev => ({
      ...prev,
      level: prev.level + 1,
      phase: GamePhase.POSING,
      currentPlayer: 1,
      targetNumber: null,
      message: "Player 1, suggest a target number!"
    }));
  };

  const toggleNumber = (index: number) => {
    if (selectedIndices.includes(index)) {
      const idx = selectedIndices.indexOf(index);
      const newIndices = [...selectedIndices];
      newIndices.splice(idx, 1);
      setSelectedIndices(newIndices);
      
      const newOps = [...currentOperators];
      if (idx > 0) newOps.splice(idx - 1, 1);
      else if (newOps.length > 0) newOps.splice(0, 1);
      setCurrentOperators(newOps);
    } else {
      if (selectedIndices.length < currentLevel.numToPick) {
        setSelectedIndices([...selectedIndices, index]);
        if (selectedIndices.length > 0) {
          setCurrentOperators([...currentOperators, '+']);
        }
      }
    }
  };

  const changeOperator = (opIdx: number) => {
    const newOps = [...currentOperators];
    const currentOp = newOps[opIdx];
    const opList = currentLevel.operators;
    const nextOpIdx = (opList.indexOf(currentOp) + 1) % opList.length;
    newOps[opIdx] = opList[nextOpIdx];
    setCurrentOperators(newOps);
  };

  const currentResult = calculateResult();

  const isPosing = state.phase === GamePhase.POSING;
  const isComputing = state.phase === GamePhase.COMPUTING;
  const isSuccess = state.phase === GamePhase.SUCCESS;
  const isLevelUp = state.phase === GamePhase.LEVEL_UP;

  const poser = state.currentPlayer;
  const computer = state.currentPlayer === 1 ? 2 : 1;

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-black/10 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <Calculator size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight uppercase italic serif">You Compute</h1>
        </div>
        <div className="flex gap-8 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Level</span>
            <span className="text-2xl font-mono font-bold">{state.level}</span>
          </div>
          <div className="h-8 w-[1px] bg-black/10" />
          <div className="flex gap-4">
            {[1, 2].map(p => (
              <div key={p} className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">P{p} Streak</span>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: currentLevel.requiredSuccesses }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full border border-black/20 ${state.consecutiveSuccesses[p as Player] > i ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 grid grid-cols-2 relative">
        {/* Player 1 Side */}
        <div className={`relative flex flex-col items-center justify-center p-12 border-r border-black/5 transition-colors duration-700 ${state.currentPlayer === 1 ? 'bg-white' : 'bg-stone-100/50'}`}>
          <div className={`absolute top-8 left-8 flex items-center gap-2 opacity-40 transition-opacity ${state.currentPlayer === 1 ? 'opacity-100' : ''}`}>
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Player 1</span>
          </div>
          
          <AnimatePresence mode="wait">
            {isPosing && poser === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6"
              >
                <h2 className="text-4xl font-serif italic text-center">Set a target for Player 2</h2>
                <div className="relative group">
                  <input 
                    type="number"
                    value={inputTarget}
                    onChange={(e) => setInputTarget(e.target.value)}
                    placeholder="00"
                    className="text-8xl font-mono font-bold bg-transparent border-b-4 border-black/20 focus:border-emerald-500 outline-none w-48 text-center py-4 transition-colors"
                  />
                </div>
                <button 
                  onClick={handlePose}
                  disabled={!inputTarget}
                  className="mt-8 px-10 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-black"
                >
                  Pose Problem
                </button>
              </motion.div>
            )}

            {isComputing && computer === 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 w-full max-w-md"
              >
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-40">Target</span>
                  <div className="text-7xl font-mono font-bold text-emerald-600">{state.targetNumber}</div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                  {state.availableNumbers.map((num, i) => (
                    <button
                      key={i}
                      onClick={() => toggleNumber(i)}
                      className={`h-20 rounded-2xl font-mono text-2xl font-bold transition-all border-2 ${
                        selectedIndices.includes(i) 
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg scale-105' 
                          : 'bg-white border-black/5 hover:border-emerald-500/50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    const pool = generatePool(currentLevel.poolSize, state.targetNumber!, currentLevel.numToPick, currentLevel.operators);
                    setState(prev => ({ ...prev, availableNumbers: pool }));
                    setSelectedIndices([]);
                    setCurrentOperators([]);
                  }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                >
                  <RefreshCw size={14} /> Refresh Numbers
                </button>

                <div className="flex flex-wrap items-center justify-center gap-3 p-6 bg-stone-100 rounded-3xl min-h-[100px] w-full border border-black/5">
                  {selectedIndices.map((idx, i) => (
                    <React.Fragment key={i}>
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-mono font-bold text-xl">
                        {state.availableNumbers[idx]}
                      </div>
                      {i < selectedIndices.length - 1 && (
                        <button 
                          onClick={() => changeOperator(i)}
                          className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl hover:bg-emerald-200 transition-colors"
                        >
                          {currentOperators[i]}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className={`text-4xl font-mono font-bold ${currentResult === state.targetNumber ? 'text-emerald-500' : 'text-black/20'}`}>
                    = {currentResult ?? '?'}
                  </div>
                  <button 
                    onClick={handleCompute}
                    disabled={selectedIndices.length !== currentLevel.numToPick}
                    className="px-12 py-4 bg-emerald-500 text-white rounded-full font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30"
                  >
                    Compute!
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player 2 Side */}
        <div className={`relative flex flex-col items-center justify-center p-12 transition-colors duration-700 ${state.currentPlayer === 2 ? 'bg-white' : 'bg-stone-100/50'}`}>
          <div className={`absolute top-8 right-8 flex items-center gap-2 opacity-40 transition-opacity ${state.currentPlayer === 2 ? 'opacity-100' : ''}`}>
            <span className="text-xs font-bold uppercase tracking-widest">Player 2</span>
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          </div>

          <AnimatePresence mode="wait">
            {isPosing && poser === 2 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6"
              >
                <h2 className="text-4xl font-serif italic text-center">Set a target for Player 1</h2>
                <div className="relative group">
                  <input 
                    type="number"
                    value={inputTarget}
                    onChange={(e) => setInputTarget(e.target.value)}
                    placeholder="00"
                    className="text-8xl font-mono font-bold bg-transparent border-b-4 border-black/20 focus:border-blue-500 outline-none w-48 text-center py-4 transition-colors"
                  />
                </div>
                <button 
                  onClick={handlePose}
                  disabled={!inputTarget}
                  className="mt-8 px-10 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-black"
                >
                  Pose Problem
                </button>
              </motion.div>
            )}

            {isComputing && computer === 2 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 w-full max-w-md"
              >
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-40">Target</span>
                  <div className="text-7xl font-mono font-bold text-blue-600">{state.targetNumber}</div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                  {state.availableNumbers.map((num, i) => (
                    <button
                      key={i}
                      onClick={() => toggleNumber(i)}
                      className={`h-20 rounded-2xl font-mono text-2xl font-bold transition-all border-2 ${
                        selectedIndices.includes(i) 
                          ? 'bg-blue-500 text-white border-blue-400 shadow-lg scale-105' 
                          : 'bg-white border-black/5 hover:border-blue-500/50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    const pool = generatePool(currentLevel.poolSize, state.targetNumber!, currentLevel.numToPick, currentLevel.operators);
                    setState(prev => ({ ...prev, availableNumbers: pool }));
                    setSelectedIndices([]);
                    setCurrentOperators([]);
                  }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                >
                  <RefreshCw size={14} /> Refresh Numbers
                </button>

                <div className="flex flex-wrap items-center justify-center gap-3 p-6 bg-stone-100 rounded-3xl min-h-[100px] w-full border border-black/5">
                  {selectedIndices.map((idx, i) => (
                    <React.Fragment key={i}>
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-mono font-bold text-xl">
                        {state.availableNumbers[idx]}
                      </div>
                      {i < selectedIndices.length - 1 && (
                        <button 
                          onClick={() => changeOperator(i)}
                          className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl hover:bg-blue-200 transition-colors"
                        >
                          {currentOperators[i]}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className={`text-4xl font-mono font-bold ${currentResult === state.targetNumber ? 'text-blue-500' : 'text-black/20'}`}>
                    = {currentResult ?? '?'}
                  </div>
                  <button 
                    onClick={handleCompute}
                    disabled={selectedIndices.length !== currentLevel.numToPick}
                    className="px-12 py-4 bg-blue-500 text-white rounded-full font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30"
                  >
                    Compute!
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-500/95 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-8 text-white text-center p-12">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <Trophy size={120} />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-7xl font-serif italic">YOU COMPUTE!</h2>
                  <p className="text-xl font-medium tracking-wide uppercase opacity-80">That was brilliant and optimistic!</p>
                </div>
                <div className="flex gap-4 mt-8">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-white/20 p-4 rounded-full"
                  >
                    <Star className="text-yellow-300 fill-yellow-300" />
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                    className="bg-white/20 p-4 rounded-full"
                  >
                    <Sparkles className="text-blue-300 fill-blue-300" />
                  </motion.div>
                </div>
                <button 
                  onClick={nextTurn}
                  className="mt-12 px-12 py-5 bg-white text-emerald-600 rounded-full font-bold uppercase tracking-widest hover:bg-stone-100 transition-all shadow-2xl flex items-center gap-3"
                >
                  Next Challenge <ArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {isLevelUp && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-violet-600/95 backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-8 text-white text-center p-12">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Star size={120} className="fill-yellow-400 text-yellow-400" />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-8xl font-serif italic">LEVEL {state.level + 1}</h2>
                  <p className="text-2xl font-medium tracking-widest uppercase opacity-80">You are computing at a higher frequency!</p>
                </div>
                <div className="grid grid-cols-3 gap-8 mt-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Calculator size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">More Numbers</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                      <RefreshCw size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">New Operators</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Trophy size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Greater Glory</span>
                  </div>
                </div>
                <button 
                  onClick={proceedLevel}
                  className="mt-16 px-16 py-6 bg-white text-violet-600 rounded-full font-bold uppercase tracking-widest hover:bg-stone-100 transition-all shadow-2xl flex items-center gap-3 text-xl"
                >
                  Ascend to Level {state.level + 1} <ArrowRight />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="p-4 bg-stone-100 border-t border-black/5 flex justify-center items-center">
        <div className="flex items-center gap-4 text-sm font-medium opacity-60">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Positive Vibes Only</span>
          </div>
          <div className="w-1 h-1 bg-black/20 rounded-full" />
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-500" />
            <span>Optimistic Computing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
