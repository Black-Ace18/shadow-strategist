
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const MOVE_PHRASES = ["Relocating to", "Advancing on", "Positioning at", "Coordinates confirmed:"];
export const CAPTURE_PHRASES = ["Target eliminated at", "Hostile neutralized on", "Clearing sector", "Executing capture pattern on"];
export const CHECK_PHRASES = ["King is exposed.", "Critical threat detected.", "Checkmate imminent."];

export class VoiceService {
  private recognition: any;
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
    }
  }

  startListening(onResult: (text: string) => void, onEnd: () => void, onError: (err: any) => void) {
    if (!this.recognition) return;
    this.recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    this.recognition.onend = onEnd;
    this.recognition.onerror = onError;
    this.recognition.start();
  }

  stopListening() { if (this.recognition) this.recognition.stop(); }

  speak(text: string, pitch: number = 0.7, rate: number = 1.1, onStart?: () => void, onEnd?: () => void) {
    this.synth.cancel();

    // SANITIZATION: Strip markdown and technical symbols to ensure whole-word pronunciation
    const sanitizedText = text.replace(/[*_#]/g, '').trim();

    const u = new SpeechSynthesisUtterance(sanitizedText);
    this.currentUtterance = u;
    u.rate = rate;
    u.pitch = pitch;
    
    if (onStart) u.onstart = onStart;
    
    u.onend = (event) => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    const voices = this.synth.getVoices();
    // Prioritize natural sounding British or neutral male voices for the 'Shadow' persona
    u.voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Male')) || voices[0];
    this.synth.speak(u);
  }

  generateTacticalResponse(unitName: string, targetSq: string, isCapture: boolean): string {
    const phrases = isCapture ? CAPTURE_PHRASES : MOVE_PHRASES;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const suffixes = ["Over.", "Standing by.", "Awaiting next command.", "Sector secured.", "Unit holding."];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${unitName}: ${phrase} ${targetSq.toUpperCase()}. ${suffix}`;
  }

  parseIntent(text: string): { type: string | null, to: string, command?: string } | null {
    const t = text.toLowerCase()
      .replace('night', 'knight')
      .replace('see', 'c')
      .replace('bee', 'b')
      .replace('for', '4')
      .replace('to ', ' ')
      .replace('on ', ' ')
      .trim();

    if (t.includes('reset') || t.includes('reboot')) {
      return { type: null, to: '', command: 'reset' };
    }

    const pieceMap: Record<string, string> = {
      'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k'
    };

    const squareMatch = t.match(/([a-h][1-8])/i);
    if (!squareMatch) return null;

    const to = squareMatch[1].toLowerCase();
    let type: string | null = null;

    for (const [name, code] of Object.entries(pieceMap)) {
      if (t.includes(name)) {
        type = code;
        break;
      }
    }

    return { type, to };
  }
}
