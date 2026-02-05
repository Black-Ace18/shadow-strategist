# Shadow Strategist | Neural Chess Interface

### Overview

Shadow Strategist is an **AI-powered, voice-controlled chess application** that transforms classical strategy into a real-time neural combat simulation.  
Players issue spoken commands to control units, receive tactical feedback from an AI persona, and engage with the board through synchronized voice, motion, and visual signals.

This is not a traditional chess UI.  
It is a **command-driven tactical system** designed for immersion, speed, and narrative depth within a cyberpunk combat framework.

---

### Project Status

- **Stability**: Production-ready  
- **Deployment**: Live  
- **Hosting Network**: Netlify 
- **Access URL**: https://your-deployment-link.vercel.app

---

### Core Capabilities

#### AI Voice Command System
- Real-time speech recognition for issuing chess moves
- Natural-language parsing mapped to legal game actions
- Low-latency response loop for competitive play

#### Tactical AI Personality
- AI-generated voice responses for confirmations, warnings, and narrative feedback
- Context-aware commentary based on board state and threats
- Consistent personality tone aligned with cyberpunk combat lore

#### Neural Matrix Feed
- Live command and response log
- Color-coded system:
  - **Blue** — Player commands
  - **Purple** — AI responses
  - **Yellow** — System alerts and errors

#### Intelligent Opening Intelligence
- AI-driven opening recognition
- Tactical explanations and strategic intent analysis
- Delivered via voice and visual overlays

#### Voice-Synchronized Interface
- Board animations synchronized with AI speech
- Reactive UI pulses for checks, threats, and critical states
- King “Neural Core” alerts during high-risk scenarios

---

### Technology Stack

#### Frontend
- React
- Vite

#### Game Logic
- Chess.js
- React-Chessboard

#### UI & Motion
- Tailwind CSS
- Framer Motion

#### Audio & Speech
- Web Speech API  
  - SpeechRecognition  
  - SpeechSynthesis

---

### Local Installation

#### Prerequisites
- Node.js (v18 or higher recommended)
- npm

#### Setup

```bash
git clone https://github.com/YourUsername/shadow-strategist.git
cd shadow-strategist
npm install
npm run dev
