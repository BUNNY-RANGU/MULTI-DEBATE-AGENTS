@echo off
cd /d "%~dp0"
echo MULTI DEBATE AGENT SYSTEM - public tunnel starting...
if not exist "tools\cloudflared.exe" (
    echo cloudflared not found. Downloading cloudflared...
    powershell -Command "New-Item -ItemType Directory -Force -Path tools | Out-Null; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'tools\cloudflared.exe'"
)
echo Look below for the https://....trycloudflare.com link.
tools\cloudflared.exe tunnel --url http://localhost:3001
pause