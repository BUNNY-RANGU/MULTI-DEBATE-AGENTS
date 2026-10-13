# MULTI DEBATE AGENT SYSTEM — Windows Run Guide

Deployed: 12 Oct 2026 (relaunched 13 Oct 2026) · Next.js 16 production build (standalone)

## Live links
- **Public (Cloudflare tunnel):** https://concentrations-grants-penalties-impaired.trycloudflare.com
- **This computer:** http://localhost:3001
- **Same Wi-Fi/LAN:** http://192.168.1.131:3001

> The public link is a free Cloudflare "quick tunnel": it stays live while the tunnel window is open, and the address changes every time you restart the tunnel.

## What's already set up
- All Node dependencies installed (~650 packages).
- Database: SQLite at `db\custom.db` (Prisma; schema synced, existing data preserved). `DATABASE_URL` lives in `.env`.
- Production build assembled at `.next\standalone` (this is what the server runs).
- `tools\cloudflared.exe` — tunnel client for the public link.
- AI fallback: all LLM calls now work via Google Gemini (`gemini-3.5-flash`); they automatically prefer the ZAI SDK if a `.z-ai-config` file ever appears.

## Run / restart (recommended)
Double-click **START-MDAS.bat** in this folder.
It opens two small windows:
1. "MDAS Server" — the app on port 3001
2. "MDAS Tunnel" — the public link (the https://....trycloudflare.com address is printed in this window)

Keep both windows open while you use the app. Close them to stop.

> Note: port 3000 is used by another app on this PC (AutoClaw), so MULTI-DEBATE runs on 3001.

## Manual commands
App server:
    cd .next\standalone
    set PORT=3001 & set HOSTNAME=0.0.0.0
    node server.js
Tunnel:
    tools\cloudflared.exe tunnel --url http://localhost:3001

## After changing the code
Rebuild and re-assemble:
    npx next build
    Copy-Item .next\static .next\standalone\.next\static -Recurse -Force
    Copy-Item public .next\standalone\public -Recurse -Force
Then restart the server window.

## Customizing
- UI text / branding: src\app, src\components\agora
- Debate agents & prompts: src\lib\debate-engine\agents.ts
- LLM routing + keys: src\lib\debate-engine\providers.ts (see API_KEYS and the "GEMINI FALLBACK LAYER" section at the bottom)
- Database schema: prisma\schema.prisma (run `npx prisma db push` after edits)

## Troubleshooting
- Blank/err page after reboot -> run START-MDAS.bat again.
- Public link 502 -> make sure both windows are open and the server window shows "Ready".
- AI answers slow under load -> Gemini free-tier rate limits; wait 15-20 s and retry.