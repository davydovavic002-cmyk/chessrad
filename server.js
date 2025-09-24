// server.js - ФИНАЛЬНАЯ ВЕРСИЯ С ОТДЕЛЬНЫМ ПУТЕМ /ws

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { URL } = require('url'); // Добавляем модуль URL

const app = express();
app.use(express.static(path.join(__dirname, '/')));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

let players = {};

wss.on('connection', (socket) => {
    // ... (вся внутренняя логика wss.on('connection', ...) остается без изменений)
    let clientId = null;
    let playerColor = null;

    if (Object.keys(players).length === 0) {
        playerColor = 'w';
        clientId = 'player1';
    } else if (Object.keys(players).length === 1) {
        playerColor = 'b';
        clientId = 'player2';
    } else {
        socket.send(JSON.stringify({ type: 'error', message: 'Game is full.' }));
        socket.close();
        return;
    }

    players[clientId] = socket;
    console.log(`[Server] ${clientId} connected as ${playerColor === 'w' ? 'White' : 'Black'}`);

    socket.send(JSON.stringify({ type: 'player_color', color: playerColor }));

    socket.on('message', (message) => {
        console.log(`[Server] Received message from ${clientId}:`, message.toString());
        Object.keys(players).forEach(id => {
            if (id !== clientId && players[id].readyState === socket.OPEN) {
                players[id].send(message.toString());
            }
        });
    });

    socket.on('close', () => {
        console.log(`[Server] ${clientId} has disconnected.`);
        delete players[clientId];
    });

    socket.on('error', (error) => {
        console.error(`[Server] WebSocket error from ${clientId}:`, error);
    });
});

// ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ
server.on('upgrade', (request, socket, head) => {
  // Парсим URL, чтобы получить путь
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  console.log(`[Server] Upgrade request received for path: ${pathname}`);

  // Проверяем, что запрос пришел именно на наш путь для WebSocket
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log('[Server] WebSocket handshake successful for /ws!');
      wss.emit('connection', ws, request);
    });
  } else {
    // Если это какой-то другой путь, вежливо отказываем
    console.log(`[Server] Rejecting upgrade request for unknown path: ${pathname}`);
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] HTTP server is listening on port ${PORT}`);
});