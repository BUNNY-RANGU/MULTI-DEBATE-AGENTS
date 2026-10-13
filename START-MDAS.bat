@echo off
title MDAS launcher
echo Starting MULTI DEBATE AGENT SYSTEM...
start "MDAS Server" cmd /k call "%~dp0start-server.bat"
timeout /t 6 >nul
start "MDAS Tunnel" cmd /k call "%~dp0start-tunnel.bat"
echo.
echo Local:  http://localhost:3001
echo Public: see the MDAS Tunnel window
pause