// server.js - ОБНОВЛЕННАЯ ВЕРСИЯ

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

// 1. Настройка Express-сервера для раздачи статических файлов (index.html, script.js, и т.д.)
const app = express();
app.use(express.static(path.join(__dirname, '/'))); // Раздаем файлы из корневой папки

// 2. Создание HTTP-сервера на основе Express
const server = http.createServer(app);

// 3. Получение порта от Render или использование 3000 для локальной разработки
const PORT = process.env.PORT || 3000;

// 4. Запуск HTTP-сервера
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// 5. Создание WebSocket-сервера поверх HTTP-сервера
const wss = new WebSocketServer({ server });

let players = {}; // Объект для хранения игроков и их цветов

wss.on('connection', (socket) => {
    let clientId = null;
    let playerColor = null;

    // Определяем цвет для нового игрока
    if (Object.keys(players).length === 0) {
        playerColor = 'w'; // Первый игрок будет белыми
        clientId = 'player1';
    } else if (Object.keys(players).length === 1) {
        playerColor = 'b'; // Второй игрок будет черными
        clientId = 'player2';
    } else {
        // Если уже есть два игрока, новые подключения будут наблюдателями
        socket.send(JSON.stringify({ type: 'error', message: 'Game is full.' }));
        socket.close();
        return;
    }

    players[clientId] = socket;
    console.log(`${clientId} connected as ${playerColor === 'w' ? 'White' : 'Black'}`);

    // Отправляем новому игроку его цвет
    socket.send(JSON.stringify({ type: 'player_color', color: playerColor }));

    // Обработка сообщений (ходов)
    socket.on('message', (message) => {
        console.log('Received message =>', message.toString());

        // Пересылаем сообщение другому игроку
        Object.keys(players).forEach(id => {
            if (id !== clientId && players[id].readyState === socket.OPEN) {
                players[id].send(message.toString());
            }
        });
    });

    socket.on('close', () => {
        console.log(`${clientId} has disconnected.`);
        delete players[clientId]; // Удаляем игрока при отключении
    });

    socket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('Server setup complete. Waiting for connections...');