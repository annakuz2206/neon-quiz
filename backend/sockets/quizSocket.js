const activeRooms = {};
const db = require('../config/db');

module.exports = (io) => {
    io.on('connection', (socket) => {

        socket.on('host_create_room', ({ roomCode }) => {
            if (!roomCode) return;

            const roomId = String(roomCode).trim();
            socket.join(roomId);

            if (!global.liveRooms) global.liveRooms = {};
            if (!global.liveRooms[roomId]) {
                global.liveRooms[roomId] = { quizId: null, createdAt: new Date() };
            }

            const roomData = global.liveRooms[roomId];

            activeRooms[roomId] = {
                quizId: roomData.quizId ? String(roomData.quizId) : null,
                adminSocketId: socket.id,
                players: [],
                questions: [],
                currentQuestionIndex: -1,
                timer: null,
                questionStartAt: null
            };
            socket.emit('room_players_update', []);
        });

        socket.on('player_join_room', ({ roomCode, user }) => {
            if (!roomCode) return socket.emit('join_error', 'Код комнаты не указан!');

            const roomId = String(roomCode).trim();
            const room = activeRooms[roomId];

            if (!room) {
                return socket.emit('join_error', 'Комната с таким кодом не найдена!');
            }

            const playerExists = room.players.some(p => p.id === user.id);
            if (!playerExists) {
                room.players.push({
                    id: user.id,
                    username: user.username,
                    score: 0,
                    total_time: 0,
                    socketId: socket.id,
                    currentAnswer: [],
                    timeSpentOnQuestion: 0
                });
            }

            socket.join(roomId);

            io.to(roomId).emit('room_players_update', room.players.map(p => ({ id: p.id, username: p.username, score: p.score })));
            socket.emit('join_success', { roomCode: roomId });
        });

        socket.on('cancel_quiz_by_admin', ({ roomCode }) => {
            const roomId = String(roomCode).trim();
            const room = activeRooms[roomId];

            if (room) {
                io.to(roomId).emit('quiz_cancelled_message', {
                    message: 'Увы, организатор отменил квиз.'
                });

                if (room.timer) clearTimeout(room.timer);
                if (global.liveRooms && global.liveRooms[roomId]) delete global.liveRooms[roomId];
                delete activeRooms[roomId];
            }
        });

        socket.on('close_room_by_admin', ({ roomCode }) => {
            const roomId = String(roomCode).trim();
            const room = activeRooms[roomId];

            if (room && room.timer) {
                clearTimeout(room.timer);
            }
            if (global.liveRooms && global.liveRooms[roomId]) {
                delete global.liveRooms[roomId];
            }
            if (activeRooms[roomId]) {
                delete activeRooms[roomId];
            }
            io.to(roomId).emit('quiz_cancelled_message', {
                message: 'Комната была принудительно закрыта администратором.'
            });
        });

        socket.on('host_start_game', ({ roomCode, questions }) => {
            if (!roomCode) return;

            const roomId = String(roomCode).trim();
            const room = activeRooms[roomId];

            if (!room) return;

            room.questions = questions;
            room.currentQuestionIndex = 0;

            io.to(roomId).emit('game_started');
            sendQuestionAutomatically(io, roomId);
        });

        socket.on('player_submit_answer', ({ roomCode, userId, optionIds }) => {
            if (!roomCode) return;

            const roomId = String(roomCode).trim();
            const room = activeRooms[roomId];
            if (!room || room.currentQuestionIndex === -1 || !room.questionStartAt) return;

            const player = room.players.find(p => p.id === userId);
            if (player) {
                const timeDiff = (Date.now() - room.questionStartAt) / 1000;
                player.timeSpentOnQuestion = parseFloat(timeDiff.toFixed(2));
                player.currentAnswer = optionIds || [];
            }
        });

        socket.on('disconnect', () => {
            for (const roomId in activeRooms) {
                if (activeRooms[roomId].adminSocketId === socket.id) {
                    io.to(roomId).emit('quiz_cancelled_message', {
                        message: 'Увы, организатор отменил квиз.'
                    });

                    if (activeRooms[roomId].timer) clearTimeout(activeRooms[roomId].timer);
                    if (global.liveRooms && global.liveRooms[roomId]) delete global.liveRooms[roomId];
                    delete activeRooms[roomId];
                }
            }
        });
    });
};

function sendQuestionAutomatically(io, roomId) {
    const room = activeRooms[roomId];
    if (!room) return;

    const question = room.questions[room.currentQuestionIndex];
    if (!question) return;

    if (room.timer) clearTimeout(room.timer);

    let encodedImage = question.image;
    if (encodedImage && Buffer.isBuffer(encodedImage)) {
        encodedImage = encodedImage.toString('utf-8');
    }

    const secureQuestion = {
        text: question.question_text,
        type: question.question_type,
        image: encodedImage,
        time: question.time_limit,
        options: question.options.map(o => ({ id: o.id, text: o.option_text }))
    };

    const correctOptionIds = question.options
        .filter(o => String(o.is_correct) === '1' || o.is_correct === true || o.is_correct === 1)
        .map(o => o.id);

    room.questionStartAt = Date.now();
    room.players.forEach(p => {
        p.currentAnswer = [];
        p.timeSpentOnQuestion = 0;
    });

    io.to(roomId).emit('receive_question', {
        question: secureQuestion,
        currentIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length
    });

    room.timer = setTimeout(() => {
        room.players.forEach(player => {
            const playerAnswers = player.currentAnswer || [];

            const isCorrect = playerAnswers.length === correctOptionIds.length &&
                playerAnswers.every(id => correctOptionIds.includes(id));

            if (isCorrect) {
                player.score += 1;
                player.total_time = parseFloat((player.total_time + player.timeSpentOnQuestion).toFixed(2));
            } else {
                player.total_time = parseFloat((player.total_time + question.time_limit).toFixed(2));
            }
        });

        io.to(roomId).emit('scoreboard_update', room.players.map(p => ({ username: p.username, score: p.score })));
        io.to(roomId).emit('question_time_up', { correctOptionIds });

        room.timer = setTimeout(() => {
            advanceGameAutomatically(io, roomId);
        }, 2000);

    }, question.time_limit * 1000);
}

async function advanceGameAutomatically(io, roomId) {
    const room = activeRooms[roomId];
    if (!room) return;

    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
        try {
            const quizIdForDb = room.quizId ? Number(room.quizId) : null;

            const savePromises = room.players.map(player => {
                return db.query(
                    'INSERT INTO history (user_id, quiz_id, score, total_time) VALUES (?, ?, ?, ?)',
                    [player.id, quizIdForDb, player.score, player.total_time]
                );
            });
            await Promise.all(savePromises);
        } catch (error) {
        }

        const finalSortedPlayers = [...room.players].sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.total_time - b.total_time;
        });

        io.to(roomId).emit('game_over', finalSortedPlayers);

        if (global.liveRooms && global.liveRooms[roomId]) delete global.liveRooms[roomId];
        delete activeRooms[roomId];
    } else {
        sendQuestionAutomatically(io, roomId);
    }
}