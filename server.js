// server.js

// Подключаем необходимые модули
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs'); // Модуль для работы с файловой системой
const path = require('path'); // Модуль для работы с путями к файлам

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    // --- НОВЫЙ КОД ДЛЯ РАЗДАЧИ ФАЙЛОВ ---
    // Определяем путь к запрашиваемому файлу
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Определяем тип контента на основе расширения файла
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    // Читаем файл и отправляем его клиенту
    fs.readFile(filePath, (err, content) => {
        if (err) {
            // Если файл не найден, отправляем ошибку 404
            if (err.code == 'ENOENT') {
                res.writeHead(404);
                res.end('Error: File Not Found');
            } else {
                // Другая серверная ошибка
                res.writeHead(500);
                res.end('Error: Server error: ' + err.code);
            }
        } else {
            // Если все хорошо, отправляем файл
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
    // --- КОНЕЦ НОВОГО КОДА ---
});

// Создаем WebSocket сервер поверх HTTP сервера
const wss = new WebSocket.Server({ noServer: true });

// Массив для хранения всех подключенных клиентов
const clients = [];

wss.on('connection', (ws) => {
    console.log('[Server] New client connected');
    clients.push(ws); // Добавляем нового клиента в массив

    ws.on('message', (message) => {
        const receivedMessage = message.toString('utf8');
        console.log(`[Server] Received message => ${receivedMessage}`);

        // Рассылаем полученное сообщение всем остальным клиентам
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(receivedMessage);
            }
        });
    });

    ws.on('close', () => {
        console.log('[Server] Client disconnected');
        // Удаляем клиента из массива при отключении
        const index = clients.indexOf(ws);
        if (index > -1) {
            clients.splice(index, 1);
        }
    });

    ws.on('error', (error) => {
        console.error(`[Server] WebSocket error: ${error.message}`);
    });
});

// Обрабатываем запрос на "апгрейд" до WebSocket
server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;
    console.log(`[Server] Upgrade request received for path: ${pathname}`);

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            console.log('[Server] WebSocket handshake successful for /ws!');
            wss.emit('connection', ws, request);
        });
    } else {
        console.log(`[Server] Rejecting upgrade request for unknown path: ${pathname}`);
        socket.destroy();
    }
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] HTTP server is listening on port ${PORT}`);
});