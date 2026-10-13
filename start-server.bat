@echo off
cd /d "%~dp0.next\standalone"
set PORT=3001
set HOSTNAME=0.0.0.0
set NODE_ENV=production
echo MULTI DEBATE AGENT SYSTEM - server running at http://localhost:3001
node server.js
pause