$(document).ready(function() {
    let board = null;
    const game = new Chess();
    const statusEl = $('#status');
    const pgnEl = $('#pgn');

    // --- Игровые функции ---
    function onDragStart(source, piece) {
        if (game.game_over()) return false;
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        const move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) return 'snapback';
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
            position: game.fen(), // Загружаем текущую позицию из движка
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        };
        board = Chessboard('myBoard', config);
        updateStatus();
    }

    // --- Функция для инициализации РЕДАКТОРА ---
    function initSetupMode() {
        const config = {
            draggable: true,
            position: board.fen(), // Начинаем редактор с текущей позиции
            dropOffBoard: 'trash',
            sparePieces: true // Показываем фигуры для добавления
        };
        board = Chessboard('myBoard', config);
        // В режиме редактора статус не обновляем
        statusEl.html('Расставляйте фигуры. Игра на паузе.');
    }

    // --- ОБРАБОТЧИКИ КНОПОК ---

    // Кнопки режима игры
    $('#startBtn').on('click', function() {
        game.reset();
        board.start();
        updateStatus();
    });

    $('#backBtn').on('click', function() {
        game.undo();
        board.position(game.fen());
        updateStatus();
    });

    $('#flipBtn').on('click', function() {
        board.flip();
    });

    // Переход в режим расстановки
    $('#setupModeBtn').on('click', function() {
        $('.play-buttons').addClass('hidden');
        $('.setup-buttons').removeClass('hidden');
        $('#main-title').text('Режим расстановки');
        initSetupMode();
    });

    // Кнопки режима расстановки
    $('#clearBoardBtn').on('click', function() {
        board.clear();
    });

    $('#startPositionBtn').on('click', function() {
        board.start();
    });

    // Возврат в режим игры
    $('#returnToGameBtn').on('click', function() {
        $('.setup-buttons').addClass('hidden');
        $('.play-buttons').removeClass('hidden');
        $('#main-title').text('Шахматы');
        // ВАЖНО: Восстанавливаем доску в то состояние, в котором была игра
        initGameMode();
    });

    // --- Первоначальная загрузка ---
    initGameMode(); // Начинаем в режиме игры
});