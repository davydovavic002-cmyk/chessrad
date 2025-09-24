// server.js - САМАЯ НАДЕЖНАЯ ВЕРСИЯ

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

// 1. Настройка Express-сервера
const app = express();
// Раздаем статические файлы (index.html, script.js, и т.д.) из корневой папки
app.use(express.static(path.join(__dirname, '/')));

// 2. Создание HTTP-сервера на основе Express
const server = http.createServer(app);

// 3. Создаем WebSocket-сервер, но пока НЕ привязываем его к HTTP-серверу
const wss = new WebSocketServer({ noServer: true });

// 4. Логика обработки подключений (остается такой же)
let players = {};

wss.on('connection', (socket) => {
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

// 5. САМОЕ ГЛАВНОЕ ИЗМЕНЕНИЕ: Слушаем событие 'upgrade' на HTTP-сервере
server.on('upgrade', (request, socket, head) => {
  console.log('[Server] Received an upgrade request! Trying to handle WebSocket...');

  // Передаем обработку "рукопожатия" нашему wss
  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log('[Server] WebSocket handshake successful! Emitting connection.');
    wss.emit('connection', ws, request);
  });
});

// 6. Запуск HTTP-сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] HTTP server is listening on port ${PORT}`);
});