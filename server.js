// server.js (Финальная версия)

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Указываем, что наши файлы лежат на один уровень ВЫШЕ, чем запущенный скрипт
const PUBLIC_DIR = path.resolve(__dirname, '..'); 

const server = http.createServer((req, res) => {
    let requestedUrl = req.url;
    if (requestedUrl === '/') {
        requestedUrl = '/index.html';
    }

    let filePath = path.join(PUBLIC_DIR, requestedUrl);

    console.log(`[Server] Request for URL: ${req.url}. Trying to serve file: ${filePath}`);

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

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code == 'ENOENT') {
                console.error(`[Server] FILE NOT FOUND: ${filePath}`);
                res.writeHead(404);
                res.end('Error: File Not Found');
            } else {
                console.error(`[Server] SERVER ERROR reading file: ${err.code}`);
                res.writeHead(500);
                res.end('Error: Server error: ' + err.code);
            }
        } else {
            console.log(`[Server] Successfully served file: ${filePath}`);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// ... остальной код для WebSocket остается без изменений ...
const wss = new WebSocket.Server({ noServer: true });
const clients = [];

wss.on('connection', (ws) => {
    console.log('[Server] New client connected');
    clients.push(ws);

    ws.on('message', (message) => {
        const receivedMessage = message.toString('utf8');
        console.log(`[Server] Received message => ${receivedMessage}`);
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(receivedMessage);
            }
        });
    });

    ws.on('close', () => {
        console.log('[Server] Client disconnected');
        const index = clients.indexOf(ws);
        if (index > -1) {
            clients.splice(index, 1);
        }
    });

    ws.on('error', (error) => {
        console.error(`[Server] WebSocket error: ${error.message}`);
    });
});

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] HTTP server is listening on port ${PORT}`);
});