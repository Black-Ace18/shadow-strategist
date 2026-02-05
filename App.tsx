import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChessEngine } from './services/chessLogic';
import { VoiceService } from './services/voiceService';
import { LORE_LIBRARY, COORDINATE_TO_LORE_KEY, PieceIdentity, PIECE_TYPE_DATA, getBookMove } from './constants';
import { Mic, MicOff, RefreshCw, Terminal, Cpu, Zap, Activity, ShieldCheck, Skull, MessageSquare, Target, AudioLines, Search, Undo2, Award, AlertTriangle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const engine = new ChessEngine();
const voice = new VoiceService();
const ASSET_ROOT = window.location.origin + '/assets/';
const AI_DEPTH = 3;

const ERROR_PHRASES = [
  "Command invalid. Trajectory blocked.",
  "Syntax error. That move is impossible.",
  "Neural misfire. Re-calibrate your coordinates.",
  "Restricted sector. Choose another path."
];

const THREAT_LINES = [
  "Threat detected. Sector unsafe.",
  "Hostile intent confirmed. Recommend evasion.",
  "Warning. Structural integrity at risk.",
  "Critical alert. Enemy trajectory locked."
];

interface LogEntry {
  type: 'user' | 'ai' | 'sys';
  text: string;
}

const playCaptureGlitch = () => {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const noise = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);

    noise.type = 'square';
    noise.frequency.setValueAtTime(800, ctx.currentTime);
    noise.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
    noise.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    noise.start();
    osc.stop(ctx.currentTime + 0.5);
    noise.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn("Audio synthesis unavailable", e);
  }
};

const playVictoryFanfare = () => {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.2, ctx.currentTime);

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.1));
      osc.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0, ctx.currentTime + (i * 0.1));
      g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + (i * 0.1) + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.1) + 0.4);
      osc.start(ctx.currentTime + (i * 0.1));
      osc.stop(ctx.currentTime + (i * 0.1) + 0.5);
    });
  } catch (e) {}
};

const AssetImage: React.FC<{ filename: string; alt: string; className?: string }> = ({ filename, alt, className }) => {
  const [error, setError] = useState(false);
  const src = error ? null : `${ASSET_ROOT}${filename}`;
  if (!src) return (
    <div className={`flex items-center justify-center bg-black/40 ${className}`}>
      <Cpu size={32} className="text-cyan-500/20" />
    </div>
  );
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
};

const App: React.FC = () => {
  const [fen, setFen] = useState(engine.getFen());
  const [turn, setTurn] = useState(engine.getTurn());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("SYSTEM READY");
  const [historyLog, setHistoryLog] = useState<LogEntry[]>([{ type: 'sys', text: 'SYSTEM READY - NEURAL LINK STABLE' }]);
  const [isThinking, setIsThinking] = useState(false);
  const [isUnderAnalysis, setIsUnderAnalysis] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [selectedIdentity, setSelectedIdentity] = useState<PieceIdentity | null>(null);
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);
  const [analyzeHighlight, setAnalyzeHighlight] = useState<string | null>(null);
  const [analysisPulse, setAnalysisPulse] = useState<'red' | 'green' | null>(null);
  const [isErrorFlash, setIsErrorFlash] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const [pieceHistory, setPieceHistory] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    Object.keys(COORDINATE_TO_LORE_KEY).forEach(sq => { map[sq] = sq; });
    return map;
  });

  const board = useMemo(() => engine.getBoard(), [fen]);
  
  const checkedKingSquare = useMemo(() => {
    const engineTurn = engine.getTurn();
    if (engine.isCheck()) {
      return engine.getKingSquare(engineTurn);
    }
    return null;
  }, [fen]);

  const addLog = useCallback((type: 'user' | 'ai' | 'sys', text: string) => {
    setHistoryLog(prev => [...prev, { type, text }]);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [historyLog]);

  const executeUIMove = useCallback((from: string, to: string, isCapture: boolean = false) => {
    const startSq = pieceHistory[from];
    const identity = LORE_LIBRARY[COORDINATE_TO_LORE_KEY[startSq]];
    
    if (isCapture) playCaptureGlitch();

    setLastMove({ from, to });
    setPieceHistory(prev => {
      const n = { ...prev };
      n[to] = n[from];
      delete n[from];
      return n;
    });
    setFen(engine.getFen());

    const newTurn = engine.getTurn();

    if (newTurn === 'b') {
      const responseText = voice.generateTacticalResponse(identity?.name || "Radiant", to, isCapture);
      setStatus("TRANSMITTING...");
      voice.speak(
        responseText, 
        identity?.voiceProfile.pitch || 1.0, 
        identity?.voiceProfile.rate || 1.0, 
        undefined,
        () => {
          setTurn('b');
          setStatus("SHADOW CALCULATING...");
        }
      );
      addLog('user', responseText);
    } else {
      const responseText = voice.generateTacticalResponse(identity?.name || "Hostile", to, isCapture);
      setTurn('w');
      setStatus("USER TURN");
      voice.speak(
        responseText, 
        identity?.voiceProfile.pitch || 0.5, 
        identity?.voiceProfile.rate || 0.8
      );
      addLog('ai', responseText);
    }
  }, [pieceHistory, addLog]);

  useEffect(() => {
    if (turn === 'b' && !engine.isGameOver() && !promotionMove) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const bookMoveSan = getBookMove(engine.getFen());
        let moveResult = null;

        if (bookMoveSan) {
          moveResult = engine.makeMove(bookMoveSan);
        } else {
          const best = engine.getBestMove(AI_DEPTH);
          if (best) {
            moveResult = engine.makeMove(best);
          }
        }
        
        if (moveResult) {
          executeUIMove(moveResult.from, moveResult.to, !!moveResult.captured);
        } else {
          setFen(engine.getFen());
          setTurn(engine.getTurn());
        }
        
        setIsThinking(false);
        if (engine.isGameOver()) {
          setStatus("SIMULATION COMPLETE");
          addLog('sys', 'SIMULATION COMPLETE - BOARD LOCKED');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [turn, promotionMove, executeUIMove, addLog]);

  const triggerError = useCallback(() => {
    setIsErrorFlash(true);
    setStatus("COMMAND REJECTED");
    const phrase = ERROR_PHRASES[Math.floor(Math.random() * ERROR_PHRASES.length)];
    const startTime = Date.now();
    
    voice.speak(phrase, 0.4, 0.85, undefined, () => {
      const elapsed = Date.now() - startTime;
      const minDuration = 2400; 
      const remaining = Math.max(0, minDuration - elapsed);
      setTimeout(() => setIsErrorFlash(false), remaining);
    });
    
    addLog('sys', phrase);
  }, [addLog]);

  const handleSquareClick = (sq: string) => {
    if (turn !== 'w' || isThinking || promotionMove) return;
    
    if (isUnderAnalysis) {
      setIsUnderAnalysis(false);
      setAnalysisPulse(null);
      setAnalyzeHighlight(null);
      window.speechSynthesis.cancel();
    }

    const piece = board[8 - parseInt(sq[1])][sq.charCodeAt(0) - 97];
    const startSq = pieceHistory[sq];
    
    let id = startSq ? LORE_LIBRARY[COORDINATE_TO_LORE_KEY[startSq]] : null;
    if (!id && piece) {
      const typeData = PIECE_TYPE_DATA[piece.type];
      id = {
        name: piece.color === 'w' ? typeData.name! : "Hostile Node",
        role: typeData.role!,
        description: "Scanning neural signature...",
        image: piece.color === 'w' ? (typeData.image || 'w_p_e2.jpg') : "b_k_e8.jpg",
        voiceProfile: { pitch: 1, rate: 1 }
      };
    }
    setSelectedIdentity(id);

    if (selectedSquare === sq) {
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (selectedSquare) {
      const p = board[8 - parseInt(selectedSquare[1])][selectedSquare.charCodeAt(0) - 97];
      if (p?.type === 'p' && (sq[1] === '8' || sq[1] === '1') && engine.getValidMoves(selectedSquare).some(m => m.to === sq)) {
        setPromotionMove({ from: selectedSquare, to: sq });
        return;
      }
      const move = engine.makeMove({ from: selectedSquare, to: sq, promotion: 'q' });
      if (move) executeUIMove(move.from, move.to, !!move.captured);
      else if (piece && piece.color === 'w') {
        setSelectedSquare(sq);
        setValidMoves(engine.getValidMoves(sq).map(m => m.to));
      }
    } else if (piece && piece.color === 'w') {
      setSelectedSquare(sq);
      setValidMoves(engine.getValidMoves(sq).map(m => m.to));
    }
  };

  const finalizePromotion = (t: string) => {
    if (!promotionMove) return;
    const move = engine.makeMove({ from: promotionMove.from, to: promotionMove.to, promotion: t });
    if (move) {
      executeUIMove(move.from, move.to, !!move.captured);
      setPromotionMove(null);
    }
  };

  const startVoice = () => {
    if (isThinking || isListening) return;
    setIsListening(true);
    setStatus("LISTENING...");
    voice.startListening(
      (text) => {
        setTranscript(text);
        addLog('user', `[VOICE COMMAND]: ${text}`);
        const intent = voice.parseIntent(text);
        if (intent?.command === 'reset') resetGame();
        else if (intent) {
          const move = engine.findMoveFromIntent(intent.type, intent.to);
          if (move) {
            const res = engine.makeMove(move.promotion ? { ...move, promotion: 'q' } : move);
            if (res) executeUIMove(res.from, res.to, !!res.captured);
            else triggerError();
          } else triggerError();
        } else triggerError();
      },
      () => setIsListening(false),
      () => setIsListening(false)
    );
  };

  const resetGame = () => {
    engine.reset();
    setPieceHistory(() => {
      const m: Record<string, string> = {};
      Object.keys(COORDINATE_TO_LORE_KEY).forEach(sq => { m[sq] = sq; });
      return m;
    });
    setFen(engine.getFen());
    setTurn(engine.getTurn());
    setSelectedSquare(null);
    setValidMoves([]);
    setTranscript("");
    setLastMove(null);
    setSelectedIdentity(null);
    setPromotionMove(null);
    setAnalyzeHighlight(null);
    setAnalysisPulse(null);
    setIsUnderAnalysis(false);
    setIsErrorFlash(false);
    setStatus("CORE REBOOTED");
    setHistoryLog([{ type: 'sys', text: 'CORE REBOOTED - NEW SIMULATION BEGUN' }]);
  };

  const runAnalysis = async () => {
    if (turn !== 'w' || isThinking || isUnderAnalysis) return;
    if (!selectedSquare) {
      setStatus("SCAN ERROR");
      voice.speak("Neural link unestablished. Select a node.", 0.8, 1.0);
      return;
    }
    const piece = board[8 - parseInt(selectedSquare[1])][selectedSquare.charCodeAt(0) - 97];
    if (!piece || piece.color !== 'w') return;

    window.speechSynthesis.cancel();
    setAnalyzeHighlight(selectedSquare);
    setStatus("NEURAL LINKING...");
    setIsUnderAnalysis(true);
    
    const startSq = pieceHistory[selectedSquare];
    const id = LORE_LIBRARY[COORDINATE_TO_LORE_KEY[startSq]];
    const isAttacked = engine.isSquareAttacked(selectedSquare, 'b');

    let msg = isAttacked 
      ? `${id?.name || "Unit"} reporting: ${THREAT_LINES[Math.floor(Math.random() * THREAT_LINES.length)]} Sector ${selectedSquare.toUpperCase()} compromised.` 
      : `Sector ${selectedSquare.toUpperCase()} clear. ${id?.name || "Unit"} maintaining structural baseline.`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Persona: ${id?.name}, role ${id?.role}. Context: Chess board square ${selectedSquare.toUpperCase()}. Status: ${isAttacked ? 'UNDER ATTACK' : 'SAFE'}. Action: One very concise cyberpunk report. No special characters like asterisks or hashtags.`,
      });
      if (resp.text) msg = resp.text.trim();
    } catch (e) {}

    setAnalysisPulse(isAttacked ? 'red' : 'green');

    const failsafe = setTimeout(() => {
      setIsUnderAnalysis(false);
      setAnalysisPulse(null);
    }, 12000);

    voice.speak(
      msg, id?.voiceProfile.pitch || 1.0, id?.voiceProfile.rate || 1.0, undefined, 
      () => {
        clearTimeout(failsafe);
        setIsUnderAnalysis(false);
        setAnalysisPulse(null);
        setAnalyzeHighlight(null);
        setStatus(isAttacked ? "THREAT DETECTED" : "SAFE");
        addLog('sys', isAttacked ? `THREAT SCAN: COMPROMISED @ ${selectedSquare.toUpperCase()}` : `THREAT SCAN: SECURE @ ${selectedSquare.toUpperCase()}`);
      }
    );
  };

  const backtrack = () => {
    if (isThinking) return;
    engine.undoMove();
    engine.undoMove();
    setFen(engine.getFen());
    setTurn(engine.getTurn());
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setStatus("TIME-SLICE REVERSED");
    addLog('sys', 'TIME-SLICE REVERSED. RETURNING TO PREVIOUS NODE.');
    voice.speak("Temporal shift complete.", 0.8, 0.85);
  };

  const suggestions = useMemo(() => {
    const engineTurn = engine.getTurn();
    if (engineTurn !== 'w') return [];
    return engine.getValidMoves().slice(0, 3).map(m => `${PIECE_TYPE_DATA[m.piece]?.name || "Unit"} to ${m.to}`);
  }, [fen]);

  const { isGameOver, isCheckmate, winner } = useMemo(() => {
    const over = engine.isGameOver();
    const mate = engine.isCheckmate();
    const engineTurn = engine.getTurn();
    let win = null;

    if (mate) {
      if (engineTurn === 'b') win = 'white'; 
      else win = 'black'; 
    }
    
    return { isGameOver: over, isCheckmate: mate, winner: win };
  }, [fen]);

  // VICTORY AUDIO OVERRIDE
  useEffect(() => {
    if (isGameOver) {
      // Step A: Instant termination of all ongoing speech
      window.speechSynthesis.cancel();
      
      if (winner === 'white') {
        // Step B: Trigger high-energy cyberpunk reward sound
        playVictoryFanfare();
        
        // Step C: Trigger Mission Accomplished lore after reward audio
        setTimeout(() => {
          voice.speak("Neural network reclaimed. Shadow Syndicate offline. Total sector dominance achieved. Mission Accomplished.", 1.0, 0.9);
        }, 1000);
      }
    }
  }, [isGameOver, winner]);

  return (
    <div className="min-h-screen bg-[#05010a] text-[#e0e0e0] flex flex-col items-center p-4 font-rajdhani selection:bg-[#bf00ff] overflow-x-hidden">
      <header className="w-full max-w-5xl flex flex-col items-center mb-6 text-center">
        <div className="flex items-center gap-2 sm:gap-4 mb-2 justify-center">
          {/* RULE 1: VISUAL PARITY - Render electric icons on all views */}
          <Zap className="text-[#bf00ff] animate-pulse" size={18} />
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-orbitron tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#bf00ff] via-white to-[#bf00ff] uppercase">SHADOW STRATEGIST</h1>
          <Zap className="text-[#bf00ff] animate-pulse" size={18} />
        </div>
        <div className="flex items-center gap-2 bg-[#1a052e] px-4 py-1.5 rounded-full border border-purple-500/30">
          <Activity size={12} className={turn === 'w' ? 'text-cyan-400' : 'text-red-500'} />
          <span className={`text-[10px] font-mono tracking-[0.2em] uppercase font-bold ${turn === 'w' ? 'text-cyan-400' : 'text-red-500'}`}>{turn === 'w' ? 'CAN YOU DEFEAT THE SHADOW?' : 'THE SHADOW IS CALCULATING...'}</span>
        </div>
      </header>

      <section className={`w-full max-w-4xl mb-6 bg-gradient-to-br from-[#1a052e] to-black border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-2xl backdrop-blur-md relative overflow-visible transition-all duration-300 
        ${isUnderAnalysis ? (analysisPulse === 'red' ? 'border-red-600 shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse' : 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.8)] animate-pulse') : 'border-[#bf00ff]/30'}`}>
        <div className="flex items-center gap-4 sm:gap-6 z-10 w-full">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black border-2 border-cyan-500/40 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)] flex-shrink-0 aspect-square overflow-hidden relative">
            {selectedIdentity ? <AssetImage filename={selectedIdentity.image} alt="Neural Profile" className="w-full h-full object-contain animate-in fade-in zoom-in duration-300" /> : <div className="text-cyan-500/10"><Cpu size={40} /></div>}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 h-[200%] animate-[scan_2s_linear_infinite] pointer-events-none" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="font-orbitron text-lg sm:text-2xl font-bold text-cyan-400 tracking-tight flex items-center gap-2">{selectedIdentity ? selectedIdentity.name.toUpperCase() : "NEURAL SCANNER"}</h2>
            <div className="text-[9px] sm:text-[11px] text-purple-400 uppercase font-bold font-mono mb-1 tracking-widest">{selectedIdentity?.role || "AWAITING SELECTION"}</div>
            <p className="text-[10px] sm:text-xs text-gray-400 font-mono max-w-md italic leading-tight border-l-2 border-[#bf00ff]/20 pl-2">"{selectedIdentity?.description || "Select a node for tactical readout."}"</p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-3 pr-4 z-10">
          <div className="flex gap-1 items-end h-10">
            {[...Array(12)].map((_, i) => <div key={i} className={`w-1 bg-cyan-400 rounded-full transition-all duration-300 ${isListening ? 'animate-pulse' : 'h-1 opacity-10'}`} style={{ animationDelay: `${i * 0.1}s`, height: isListening ? `${30 + Math.random() * 60}%` : '4px' }} />)}
          </div>
          <span className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] font-bold">{isListening ? "UPLINK ACTIVE" : "COMMS STANDBY"}</span>
        </div>
      </section>

      <main className={`relative p-2 bg-[#0d0118] border-2 rounded-lg transition-all duration-300 
        ${isErrorFlash ? 'animate-error-blink' : 'border-purple-500/20 shadow-[0_0_100px_rgba(191,0,255,0.15)]'}`}>
        <div className="grid grid-cols-8 border-4 border-[#1a052e] bg-black">
          {board.map((row, r) => row.map((p, c) => {
            const sq = `${String.fromCharCode(97+c)}${8-r}`;
            const isSel = selectedSquare === sq;
            const isVal = validMoves.includes(sq);
            const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isAnalyze = analyzeHighlight === sq;
            const isCheckedKing = checkedKingSquare === sq;
            return (
              <div key={sq} onClick={() => handleSquareClick(sq)}
                className={`w-11 h-11 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer transition-all relative
                  ${(r+c)%2===1 ? 'bg-[#0f021a]' : 'bg-[#1e083a]'}
                  ${isSel ? 'ring-inset ring-2 ring-cyan-400 bg-cyan-500/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.4)] z-10' : ''}
                  ${isLast ? 'bg-purple-900/30 border-b-2 border-[#bf00ff]/40' : ''}
                  ${isAnalyze ? 'ring-inset ring-2 ring-yellow-400 bg-yellow-500/30 shadow-[inset_0_0_20px_rgba(234,179,8,0.4)] z-10' : ''}
                  ${isCheckedKing ? 'animate-king-check z-30' : ''}
                  hover:brightness-125`}>
                <span className="absolute bottom-0.5 right-1 text-[7px] text-purple-700 font-mono opacity-40 uppercase">{sq}</span>
                {isVal && !p && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse z-10" />}
                {isVal && p && <div className="absolute inset-0 border-2 border-red-500/50 z-10" />}
                {p && <span className={`text-4xl sm:text-6xl select-none transition-all duration-300 z-20 ${p.color === 'w' ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'text-[#bf00ff] drop-shadow-[0_0_15px_rgba(191,0,255,1)]'} ${isSel ? 'scale-115 -translate-y-1' : 'scale-100'}`}>
                  {p.type==='p'?'♙':p.type==='r'?'♖':p.type==='n'?'♘':p.type==='b'?'♗':p.type==='q'?'♕':'♔'}
                </span>}
              </div>
            );
          }))}
        </div>
        {promotionMove && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 rounded border border-cyan-400 animate-in fade-in backdrop-blur-sm">
            <div className="text-center p-6">
              <h3 className="text-sm sm:text-base font-orbitron text-cyan-400 mb-8 uppercase tracking-[0.3em] font-black">PROMOTION MATRIX</h3>
              <div className="flex gap-4 sm:gap-6">
                {[{t:'q',i:'♕',l:'GRAND ARBITRATOR'},{t:'r',i:'♖',l:'AEGIS'},{t:'b',i:'♗',l:'ORACLE'},{t:'n',i:'♘',l:'VECTOR'}].map(p=>(
                  <button key={p.t} onClick={()=>finalizePromotion(p.t)} className="flex flex-col items-center p-4 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-all hover:scale-105 group">
                    <span className="text-5xl text-white mb-3 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{p.i}</span>
                    <span className="text-[8px] font-mono text-cyan-500 uppercase font-bold">{p.l}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
             <div className="bg-[#05010a]/95 backdrop-blur-xl border-2 border-[#bf00ff] shadow-[0_0_50px_rgba(191,0,255,0.4)] w-full max-w-sm rounded-2xl p-8 flex flex-col items-center text-center animate-in zoom-in duration-300">
               {winner === 'white' ? (
                 <>
                   <Award size={64} className="text-cyan-400 mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,1)]" />
                   <h2 className="text-2xl font-black font-orbitron text-cyan-400 mb-2 uppercase tracking-tighter">MISSION ACCOMPLISHED</h2>
                   <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-8 font-bold">YOU HAVE DEFEATED THE SHADOW SYNDICATE.</p>
                 </>
               ) : winner === 'black' ? (
                 <>
                   <AlertTriangle size={64} className="text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse" />
                   <h2 className="text-2xl font-black font-orbitron text-red-600 mb-2 uppercase tracking-tighter">VOID COLLAPSED</h2>
                   <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-8 font-bold">SHADOW HAS TAKEN OVER THE NEURAL NETWORK.</p>
                 </>
               ) : (
                 <>
                   <Activity size={64} className="text-yellow-400 mb-4" />
                   <h2 className="text-2xl font-black font-orbitron text-yellow-500 mb-2 uppercase tracking-tighter">DRAW DETECTED</h2>
                   <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-8 font-bold">STALEMATE. THE MATRIX REMAINS IN EQUILIBRIUM.</p>
                 </>
               )}
               
               <button onClick={resetGame} className="w-full py-4 bg-transparent border-2 border-[#bf00ff] text-[#bf00ff] font-black font-orbitron rounded-xl flex items-center justify-center gap-3 hover:bg-[#bf00ff] hover:text-white transition-all shadow-[0_0_20px_rgba(191,0,255,0.2)] group uppercase tracking-[0.2em] text-xs">
                 <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> Reboot Core
               </button>
             </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-5xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">
        <section className="bg-gradient-to-b from-[#1a052e] to-black border border-purple-500/30 p-6 rounded-2xl flex flex-col gap-5 shadow-xl">
          <div className="flex items-center gap-2 text-[#bf00ff]">
            <Cpu size={16} /><h3 className="text-[11px] uppercase font-black tracking-[0.2em] font-orbitron">NEURAL COMMAND</h3>
          </div>
          <button onClick={isListening?voice.stopListening.bind(voice):startVoice} disabled={isThinking} className={`w-full py-5 flex flex-col items-center justify-center gap-2 border-2 rounded-xl transition-all ${isListening?'bg-red-500/10 border-red-500 text-red-500 animate-pulse':'bg-transparent border-[#bf00ff]/40 text-[#bf00ff] hover:bg-[#bf00ff]/10'}`}>
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            <span className="text-[10px] font-black uppercase tracking-widest font-orbitron">{isListening ? "UPLINK ACTIVE" : "VOICE CONTROL"}</span>
          </button>
          <div className="flex flex-row gap-3 w-full">
            <button onClick={resetGame} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 border border-[#bf00ff]/20 rounded-xl bg-black/40 hover:bg-[#bf00ff]/20 text-[#bf00ff] text-[9px] font-black font-orbitron uppercase transition-all group">
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> REBOOT
            </button>
            <button onClick={runAnalysis} disabled={isUnderAnalysis} className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 border rounded-xl bg-black/40 transition-all group overflow-hidden ${isUnderAnalysis ? (analysisPulse === 'red' ? 'border-red-600 text-red-400 animate-pulse' : 'border-green-500 text-green-400 animate-pulse') : 'border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'}`}>
              {isUnderAnalysis ? <AudioLines size={18} className="animate-pulse" /> : <Search size={18} className="group-hover:scale-125 transition-transform" />}
              <span className="text-[9px] font-black font-orbitron uppercase tracking-tight w-full text-center">{isUnderAnalysis ? "SCANNING..." : "ANALYSIS"}</span>
            </button>
            <button onClick={backtrack} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 border border-orange-500/20 rounded-xl bg-black/40 hover:bg-orange-500/20 text-orange-400 text-[9px] font-black font-orbitron uppercase transition-all group">
              <Undo2 size={18} className="group-hover:-translate-x-1 transition-transform" /> BACK
            </button>
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#0d0118] to-black border border-purple-500/10 p-6 rounded-2xl flex flex-col shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <MessageSquare size={16} /><h3 className="text-[11px] uppercase font-black tracking-[0.2em] font-orbitron">MATRIX FEED</h3>
          </div>
          <div ref={logContainerRef} className="flex-grow font-mono text-[10px] space-y-2 overflow-y-auto max-h-48 custom-scrollbar pr-1 scroll-smooth">
            {historyLog.map((entry, idx) => (
              <div key={idx} className={`flex gap-2 items-start break-words leading-tight ${entry.type === 'user' ? 'text-blue-400' : entry.type === 'ai' ? 'text-[#bf00ff]' : 'text-yellow-400'}`}>
                <span className="font-bold whitespace-nowrap">[{entry.type.toUpperCase()}]</span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-white/5 pt-2 text-[9px] font-mono opacity-40 text-gray-500">// BACKTRACKING LOG</div>
        </section>

        <section className="bg-gradient-to-b from-[#1a052e] to-black border border-purple-500/30 p-6 rounded-2xl flex flex-col shadow-xl">
          <div className="flex items-center gap-2 mb-5 text-orange-400">
            <Target size={16} /><h3 className="text-[11px] uppercase font-black tracking-[0.2em] font-orbitron">EXAMPLE COMMANDS</h3>
          </div>
          <div className="space-y-3">
            {suggestions.length > 0 ? suggestions.map((s, i) => (
              <div key={i} className="bg-black/50 p-3 rounded-xl border border-white/5 text-[10px] font-mono text-orange-400 flex items-center justify-between group transition-all hover:border-orange-500/40 hover:translate-x-1">
                <span className="font-bold">"{s.toUpperCase()}"</span><Terminal size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )) : <div className="text-[10px] font-mono text-gray-700 italic text-center py-4">Scanning for legal trajectories...</div>}
          </div>
        </section>
      </footer>
    </div>
  );
};

export default App;