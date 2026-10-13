# MULTI-DEBATE AGENT SYSTEM (MDAS)

An autonomous multi-agent debate platform powered by Next.js, Tailwind CSS, Prisma, and multiple LLM backends (Claude, Gemini, Groq, and fallback providers).

---

## 🌐 Live Deployment & Links

- **🚀 Production Deployment (Vercel):** [https://multi-debate-agents.vercel.app](https://multi-debate-agents.vercel.app)
- **🔗 GitHub Repository:** [https://github.com/BUNNY-RANGU/MULTI-DEBATE-AGENTS](https://github.com/BUNNY-RANGU/MULTI-DEBATE-AGENTS)
- **⚡ Live Tunnel (Cloudflare):** [https://gerald-chains-lows-mods.trycloudflare.com](https://gerald-chains-lows-mods.trycloudflare.com)
- **💻 Local Instance:** [http://localhost:3001](http://localhost:3001)

---

## 🚀 Features

- **Multi-Agent Debates**: Configure AI agents with distinctive personas, debate styles, and argument structures.
- **Real-Time Rounds & Scoring**: Live debate turns, rebuttal generation, fallacy detection, and aggregate scoring.
- **Arena & Chat Interfaces**: Interactive debate arena, direct AI chat, and coaching reports.
- **Provider Fallback Layer**: Resilient LLM routing with Gemini fallback support.
- **Prisma & SQLite Backend**: Local persistent database with custom debates, users, and execution logs.
- **Public Tunneling**: One-click Cloudflare Tunnel integration for sharing live URLs.

---

## 🛠️ Quick Start

### 1. Installation

```bash
# Install dependencies
npm install
# or bun install
```

### 2. Database Setup

```bash
# Generate Prisma Client & sync schema
npx prisma generate
npx prisma db push
```

### 3. Running Locally

#### Development Mode:
```bash
npm run dev
```

#### Production Mode (Windows / Standalone):
Double-click `START-MDAS.bat` or run:
```bash
# Server on port 3001
start-server.bat

# Public Tunnel
start-tunnel.bat
```

---

## 🌐 Endpoints & URLs

- **Local UI**: [http://localhost:3001](http://localhost:3001)
- **Database**: `db/custom.db` (SQLite)
- **Public Tunnel**: Generated dynamically via `tools/cloudflared.exe` or `start-tunnel.bat`

---

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages & API endpoints
│   ├── components/agora/    # UI components (arena, debate form, chat)
│   ├── lib/
│   │   ├── debate/          # Core debate execution engine
│   │   └── debate-engine/   # Provider routing, fallback logic & agent personas
├── prisma/                  # Prisma schema definition
├── db/                      # SQLite database files
├── tools/                   # Tunnel utilities (cloudflared)
├── START-MDAS.bat           # One-click launcher for server & tunnel
└── package.json
```

---

## 📜 License
MIT
