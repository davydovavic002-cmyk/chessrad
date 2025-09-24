$(document).ready(function() {
    let board = null;
    const game = new Chess();
    const statusEl = $('#status');
    const pgnEl = $('#pgn');

    // --- ДОБАВЛЕНО: НАЧАЛО СЕТЕВОГО КОДА ---

    // 1. Устанавливаем соединение с вашим WebSocket сервером на Render.com
    const socket = new WebSocket('wss://chessrad.onrender.com');

    // Эта функция сработает, когда соединение будет успешно установлено
    socket.onopen = function() {
        console.log('WebSocket connection established!');
        statusEl.html('Соединение установлено. Ожидание второго игрока...');
    };

    // 2. Эта функция будет вызываться каждый раз, когда сервер присылает сообщение
    socket.onmessage = function(event) {
        // Получаем данные от сервера (это будет ход оппонента)
        const move = JSON.parse(event.data);

        // Применяем ход к нашему игровому движку
        game.move(move);

        // Обновляем позицию на доске, чтобы увидеть ход оппонента
        board.position(game.fen());

        // Обновляем статус игры
        updateStatus();
    };

    // Обработка ошибок соединения
    socket.onerror = function(error) {
        console.error('WebSocket Error:', error);
        statusEl.html('Ошибка соединения с сервером.');
    };

    // --- КОНЕЦ СЕТЕВОГО КОДА ---

    // --- Игровые функции ---
    function onDragStart(source, piece) {
        if (game.game_over()) return false;
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        // Пытаемся сделать ход локально
        const move = game.move({ from: source, to: target, promotion: 'q' });

        // Если ход некорректный, отменяем
        if (move === null) return 'snapback';

        // --- ИЗМЕНЕНО: Отправка хода на сервер ---
        // 3. Если ход корректный, отправляем его на сервер, чтобы оппонент его увидел
        // Серверу мы отправляем объект хода в формате JSON
        socket.send(JSON.stringify(move));
        // ------------------------------------------

        updateStatus();
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateStatus() {
        let status = '';
        const moveColor = game.turn() === 'w' ? 'Белых' : 'Черных';

        if (game.in_checkmate()) {
            status = `Игра окончена, ${moveColor} получили мат.`;
        } else if (game.in_draw()) {
            status = 'Игра окончена, ничья.';
        } else {
            status = `Ход ${moveColor}.`;
            if (game.in_check()) {
                status += `, ${moveColor} под шахом.`;
            }
        }
        statusEl.html(status);
        pgnEl.html(game.pgn());
        pgnEl.scrollTop(pgnEl[0].scrollHeight);
    }

    // --- Функция для инициализации ИГРОВОЙ доски ---
    function initGameMode() {
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        };
        board = Chessboard('myBoard', config);
        updateStatus();
    }

    // --- ОБРАБОТЧИКИ КНОПОК --- (этот раздел без изменений)

    $('#startBtn').on('click', function() {
        game.reset();
        board.start();
        updateStatus();
        // Можно также отправить сигнал на сервер о новой игре
        // socket.send(JSON.stringify({ type: 'reset' }));
    });

    $('#backBtn').on('click', function() {
        // Отмена хода в сетевой игре - сложная логика, пока убираем
        // game.undo();
        // board.position(game.fen());
        // updateStatus();
    });

    $('#flipBtn').on('click', function() {
        board.flip();
    });

    // Режим расстановки в сетевой игре не имеет смысла, его можно будет потом убрать
    // Но пока пусть остается, он не мешает
    $('#setupModeBtn').on('click', function() {
        $('.play-buttons').addClass('hidden');
        $('.setup-buttons').removeClass('hidden');
        $('#main-title').text('Режим расстановки');
        const config = { draggable: true, position: board.fen(), dropOffBoard: 'trash', sparePieces: true };
        board = Chessboard('myBoard', config);
        statusEl.html('Расставляйте фигуры. Игра на паузе.');
    });
    $('#clearBoardBtn').on('click', board.clear);
    $('#startPositionBtn').on('click', board.start);
    $('#returnToGameBtn').on('click', function() {
        $('.setup-buttons').addClass('hidden');
        $('.play-buttons').removeClass('hidden');
        $('#main-title').text('Шахматы');
        initGameMode();
    });

    // --- Первоначальная загрузка ---
    initGameMode(); // Начинаем в режиме игры
});
