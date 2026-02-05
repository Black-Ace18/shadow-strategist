
export interface PieceIdentity {
  name: string;
  role: string;
  description: string;
  image: string;
  voiceProfile: { pitch: number; rate: number };
}

// Full Lore Library for Radiant Network (White) and Shadow Syndicate (Black)
export const LORE_LIBRARY: Record<string, PieceIdentity> = {
  // --- RADIANT NETWORK (WHITE) ---
  "w_r_a1": { name: "Aegis-Alpha", role: "Primary Bastion", description: "The western shield of the Radiant Network. Immovable code.", image: "w_r_a1.jpg", voiceProfile: { pitch: 0.6, rate: 0.85 } },
  "w_n_b1": { name: "Vector-Prime", role: "Hyper-Scout", description: "Initiating rapid spatial jumping. No firewall can contain me.", image: "w_n_b1.jpg", voiceProfile: { pitch: 1.1, rate: 1.1 } },
  "w_b_c1": { name: "Oracle-I", role: "Logic Seer", description: "Visualizing the entropic flow of the Shadow's next move.", image: "w_b_c1.jpg", voiceProfile: { pitch: 0.9, rate: 1.0 } },
  "w_q_d1": { name: "Grand Arbitrator", role: "Supreme Command", description: "The most powerful algorithm in existence. Total board dominance.", image: "w_q_d1.jpg", voiceProfile: { pitch: 1.0, rate: 0.9 } },
  "w_k_e1": { name: "Sovereign-Core", role: "Network Heart", description: "The unyielding mainframe. If I fall, the network darkens.", image: "w_k_e1.jpg", voiceProfile: { pitch: 0.8, rate: 0.8 } },
  "w_b_f1": { name: "Oracle-II", role: "Neural Infiltrator", description: "Bypassing Shadow protocols via complex diagonal streams.", image: "w_b_f1.jpg", voiceProfile: { pitch: 0.9, rate: 1.0 } },
  "w_n_g1": { name: "Vector-Sigma", role: "Stealth Scout", description: "Ghosting through the matrix. Target locked.", image: "w_n_g1.jpg", voiceProfile: { pitch: 1.1, rate: 1.1 } },
  "w_r_h1": { name: "Aegis-Omega", role: "Backup Bastion", description: "The eastern wall. Security protocol 0-H is active.", image: "w_r_h1.jpg", voiceProfile: { pitch: 0.6, rate: 0.85 } },
  
  "w_p_a2": { name: "Sentry-01", role: "Vanguard", description: "Western perimeter sentinel. Ready to hold the line.", image: "w_p_a2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },
  "w_p_b2": { name: "Sentry-02", role: "Vanguard", description: "Optimized for frontline territorial control.", image: "w_p_b2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },
  "w_p_c2": { name: "Sentry-03", role: "Vanguard", description: "Data-link established. Advancing on command.", image: "w_p_c2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },
  "w_p_d2": { name: "Sentry-04", role: "Vanguard", description: "Core-sector protector. Calculating optimal advance.", image: "w_p_d2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },
  "w_p_e2": { name: "Sentry-05", role: "Vanguard", description: "Core Vanguard unit. Promotion is my primary objective.", image: "w_p_e2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },
  "w_p_f2": { name: "Sentry-06", role: "Vanguard", description: "Tactical infantry. Scanning for hostile vulnerabilities.", image: "w_p_f2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },
  "w_p_g2": { name: "Sentry-07", role: "Vanguard", description: "Eastern flank specialist. Loyal to the Core.", image: "w_p_g2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },
  "w_p_h2": { name: "Sentry-08", role: "Vanguard", description: "Final perimeter guard. Security at 100%.", image: "w_p_h2.jpg", voiceProfile: { pitch: 1.2, rate: 1.0 } },

  // --- SHADOW SYNDICATE (BLACK) ---
  "b_r_a8": { name: "Void-Reaper", role: "Siege Glitch", description: "The western breach. Consuming all data in its path.", image: "b_r_a8.jpg", voiceProfile: { pitch: 0.4, rate: 0.8 } },
  "b_n_b8": { name: "Malice-Vector", role: "Phantom Rider", description: "A flicker in the screen. I am already behind you.", image: "b_n_b8.jpg", voiceProfile: { pitch: 0.5, rate: 1.1 } },
  "b_b_c8": { name: "Entropy-Seer", role: "Corruption Eye", description: "I see the end of your Radiant Network.", image: "b_b_c8.jpg", voiceProfile: { pitch: 0.4, rate: 0.9 } },
  "b_q_d8": { name: "The Devourer", role: "Malware Prime", description: "Infinite hunger. I will overwrite your entire reality.", image: "b_q_d8.jpg", voiceProfile: { pitch: 0.5, rate: 0.7 } },
  "b_k_e8": { name: "Zero-Day King", role: "Core Virus", description: "The ultimate infection. Resistance is obsolete.", image: "b_k_e8.jpg", voiceProfile: { pitch: 0.3, rate: 0.6 } },
  "b_b_f8": { name: "Entropy-Wraith", role: "Logic Error", description: "Corrupting the logic streams. Error 404: Hope Not Found.", image: "b_b_f8.jpg", voiceProfile: { pitch: 0.4, rate: 0.9 } },
  "b_n_g8": { name: "Malice-Wraith", role: "Data Shadow", description: "Unpredictable. Impossible. I am the system crash.", image: "b_n_g8.jpg", voiceProfile: { pitch: 0.5, rate: 1.1 } },
  "b_r_h8": { name: "Void-Phantom", role: "Chaos Bastion", description: "The final door to the abyss has opened.", image: "b_r_h8.jpg", voiceProfile: { pitch: 0.4, rate: 0.8 } },

  "b_p_a7": { name: "Glitch-A", role: "Infiltrator", description: "Western sector corruption initiated.", image: "b_p_a7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
  "b_p_b7": { name: "Glitch-B", role: "Infiltrator", description: "Subverting protocols in sector B.", image: "b_p_b7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
  "b_p_c7": { name: "Glitch-C", role: "Infiltrator", description: "Bypassing sector C security nodes.", image: "b_p_c7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
  "b_p_d7": { name: "Glitch-D", role: "Infiltrator", description: "Central core disruption node Delta.", image: "b_p_d7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
  "b_p_e7": { name: "Glitch-E", role: "Infiltrator", description: "Proximity to Radiant Core detected. Viral load ready.", image: "b_p_e7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
  "b_p_f7": { name: "Glitch-F", role: "Infiltrator", description: "Analyzing Radiant structural weaknesses.", image: "b_p_f7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
  "b_p_g7": { name: "Glitch-G", role: "Infiltrator", description: "Eastern flank entropy spreading.", image: "b_p_g7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
  "b_p_h7": { name: "Glitch-H", role: "Infiltrator", description: "Edge sector error source. System destabilizing.", image: "b_p_h7.jpg", voiceProfile: { pitch: 0.6, rate: 1.0 } },
};

// Map board coordinates to Lore Key (Starting positions)
export const COORDINATE_TO_LORE_KEY: Record<string, string> = {
  'a1': 'w_r_a1', 'b1': 'w_n_b1', 'c1': 'w_b_c1', 'd1': 'w_q_d1', 'e1': 'w_k_e1', 'f1': 'w_b_f1', 'g1': 'w_n_g1', 'h1': 'w_r_h1',
  'a2': 'w_p_a2', 'b2': 'w_p_b2', 'c2': 'w_p_c2', 'd2': 'w_p_d2', 'e2': 'w_p_e2', 'f2': 'w_p_f2', 'g2': 'w_p_g2', 'h2': 'w_p_h2',
  'a8': 'b_r_a8', 'b8': 'b_n_b8', 'c8': 'b_b_c8', 'd8': 'b_q_d8', 'e8': 'b_k_e8', 'f8': 'b_b_f8', 'g8': 'b_n_g8', 'h8': 'b_r_h8',
  'a7': 'b_p_a7', 'b7': 'b_p_b7', 'c7': 'b_p_c7', 'd7': 'b_p_d7', 'e7': 'b_p_e7', 'f7': 'b_p_f7', 'g7': 'b_p_g7', 'h7': 'b_p_h7',
};

// Generic mapping for pieces by type for fallback identity creation
export const PIECE_TYPE_DATA: Record<string, Partial<PieceIdentity>> = {
  p: { name: "Sentry", role: "Vanguard", image: "w_p_e2.jpg" },
  n: { name: "Vector", role: "Scout", image: "w_n_b1.jpg" },
  b: { name: "Oracle", role: "Seer", image: "w_b_c1.jpg" },
  r: { name: "Aegis", role: "Bastion", image: "w_r_a1.jpg" },
  q: { name: "Arbitrator", role: "Command", image: "w_q_d1.jpg" },
  k: { name: "Sovereign", role: "Core", image: "w_k_e1.jpg" }
};

/**
 * Tactical opening book module.
 * Updated with standard professional lines for immediate AI response.
 */
export const getBookMove = (fen: string): string | null => {
  const normalizedFen = fen.split(' ').slice(0, 4).join(' ');
  const OPENING_BOOK: Record<string, string> = {
    // 1. e4 (King's Pawn)
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": "e4",
    // Black response to 1. e4 -> Sicilian (c5) or e5
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3": "c5",
    // Black response to 1. d4 -> d5
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3": "d5",
    // Sicilian response (2. Nf3)
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6": "Nf3",
    // King's Pawn response (2. Nf3)
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6": "Nf3"
  };
  return OPENING_BOOK[normalizedFen] || null;
};
