#!/bin/bash
# AGORA Platform Startup Script
cd /home/z/my-project
bun run dev >> dev.log 2>&1 &
echo $! > /tmp/agora-dev.pid
echo "Dev server started with PID $(cat /tmp/agora-dev.pid)"

cd /home/z/my-project/mini-services/debate-ws
bun run dev >> /home/z/my-project/ws.log 2>&1 &
echo $! > /tmp/agora-ws.pid
echo "WS service started with PID $(cat /tmp/agora-ws.pid)"