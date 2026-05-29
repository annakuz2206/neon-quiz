const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
    const { title, category, creator_id } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO quizzes (title, category, creator_id, status) VALUES (?, ?, ?, "draft")',
            [title, category, creator_id]
        );
        res.status(201).json({ quizId: result.insertId, message: 'Квиз создан!' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка создания квиза' });
    }
});

router.post('/:id/questions', async (req, res) => {
    const quizId = req.params.id;
    const { question_text, question_type, image, time_limit, options } = req.body;

    try {
        const [questionResult] = await db.query(
            'INSERT INTO questions (quiz_id, question_text, question_type, image, time_limit) VALUES (?, ?, ?, ?, ?)',
            [quizId, question_text, question_type, image || null, time_limit]
        );
        const questionId = questionResult.insertId;

        for (let option of options) {
            await db.query(
                'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                [questionId, option.text || option.option_text, option.isCorrect ?? option.is_correct]
            );
        }

        res.status(201).json({ message: 'Вопрос успешно добавлен!' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка добавления вопроса' });
    }
});

router.get('/', async (req, res) => {
    try {
        const [quizzes] = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка загрузки квизов' });
    }
});

router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [history] = await db.query(`
            WITH ranked_results AS (
                SELECT 
                    h.user_id,
                    h.quiz_id,
                    h.score,
                    h.total_time,
                    h.played_at,
                    q.title,
                    q.category,
                    (SELECT COUNT(*) FROM questions WHERE questions.quiz_id = q.id) AS total_questions,
                    DENSE_RANK() OVER (
                        PARTITION BY h.quiz_id, h.played_at 
                        ORDER BY h.score DESC, h.total_time ASC
                    ) AS place
                FROM history h
                JOIN quizzes q ON h.quiz_id = q.id
            )
            SELECT score, total_questions, played_at, title, category, place, total_time 
            FROM ranked_results
            WHERE user_id = ?
            ORDER BY played_at DESC
        `, [userId]);

        const formattedHistory = history.map(item => ({
            ...item,
            formattedScore: `${item.score}/${item.total_questions || 0}`,
            formattedTime: item.total_time ? `${item.total_time} сек` : '0 сек'
        }));

        res.json(formattedHistory);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения истории результатов' });
    }
});

router.get('/global-history', async (req, res) => {
    try {
        const [globalHistory] = await db.query(`
            SELECT 
                h.quiz_id,
                h.played_at,
                q.title AS quiz_title,
                q.category AS quiz_category,
                COUNT(h.user_id) AS total_players,
                (SELECT COUNT(*) FROM questions WHERE questions.quiz_id = q.id) AS total_questions,
                (
                    SELECT u.username 
                    FROM history h2
                    JOIN users u ON h2.user_id = u.id
                    WHERE h2.quiz_id = h.quiz_id AND h2.played_at = h.played_at
                    ORDER BY h2.score DESC, h2.total_time ASC
                    LIMIT 1
                ) AS winner_name,
                (
                    SELECT h2.score 
                    FROM history h2
                    WHERE h2.quiz_id = h.quiz_id AND h2.played_at = h.played_at
                    ORDER BY h2.score DESC, h2.total_time ASC
                    LIMIT 1
                ) AS winner_score
            FROM history h
            JOIN quizzes q ON h.quiz_id = q.id
            GROUP BY h.quiz_id, h.played_at
            ORDER BY h.played_at DESC
        `);

        const formattedGlobalHistory = globalHistory.map(item => ({
            quiz_title: item.quiz_title,
            quiz_category: item.quiz_category,
            total_players: item.total_players,
            winner: item.winner_name ? `${item.winner_name} (${item.winner_score}/${item.total_questions || 0})` : 'Нет данных',
            date: new Date(item.played_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        res.json(formattedGlobalHistory);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения глобальной истории результатов' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM quizzes WHERE id = ?', [id]);
        res.json({ message: 'Квиз успешно удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении квиза' });
    }
});

router.get('/:id/full', async (req, res) => {
    const { id } = req.params;
    try {
        const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [id]);

        for (let q of questions) {
            const [options] = await db.query('SELECT id, option_text, is_correct FROM options WHERE question_id = ?', [q.id]);
            q.options = options;

            if (q.image && Buffer.isBuffer(q.image)) {
                q.image = q.image.toString('utf-8');
            }
        }

        res.json({ quizId: id, questions });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка загрузки данных игры' });
    }
});

router.get('/full-by-code/:roomCode', async (req, res) => {
    const cleanRoomCode = String(req.params.roomCode).trim();

    try {
        if (!global.liveRooms) global.liveRooms = {};
        const roomData = global.liveRooms[cleanRoomCode];

        if (!roomData || !roomData.quizId) {
            return res.status(404).json({ message: 'Active комната с таким кодом не найдена!' });
        }

        const quizId = Number(roomData.quizId);
        const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);

        for (let q of questions) {
            const [options] = await db.query('SELECT id, option_text, is_correct FROM options WHERE question_id = ?', [q.id]);

            q.options = options.map(opt => ({
                ...opt,
                is_correct: opt.is_correct === 1 || opt.is_correct === true || String(opt.is_correct) === '1' ? 1 : 0
            }));

            if (q.image && Buffer.isBuffer(q.image)) {
                q.image = q.image.toString('utf-8');
            }
        }

        res.json({ quizId, questions });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера при загрузке вопросов по коду комнаты' });
    }
});

router.post('/generate-room-code', (req, res) => {
    try {
        const { quizId } = req.body;

        if (!quizId) {
            return res.status(400).json({ error: 'Не указан ID квиза' });
        }

        if (!global.liveRooms) {
            global.liveRooms = {};
        }

        let roomCode;
        let attempts = 0;

        do {
            roomCode = Math.floor(1000 + Math.random() * 9000).toString();
            attempts++;
            if (attempts > 50) break;
        } while (global.liveRooms[roomCode]);

        global.liveRooms[roomCode] = {
            quizId: String(quizId).trim(),
            createdAt: new Date()
        };

        setTimeout(() => {
            if (global.liveRooms && global.liveRooms[roomCode]) {
                delete global.liveRooms[roomCode];
            }
        }, 3600000);

        return res.status(200).json({ roomCode });
    } catch (err) {
        return res.status(500).json({ error: 'Внутренняя ошибка сервера при генерации кода' });
    }
});

router.post('/close-room', (req, res) => {
    const { roomCode } = req.body;
    const cleanRoomCode = String(roomCode).trim();
    if (global.liveRooms && global.liveRooms[cleanRoomCode]) {
        delete global.liveRooms[cleanRoomCode];
    }
    res.json({ message: 'Комната успешно закрыта' });
});

router.get('/check-pin/:pin', (req, res) => {
    const cleanPin = String(req.params.pin).trim();

    if (!global.liveRooms) global.liveRooms = {};
    const activeRoom = global.liveRooms[cleanPin];

    if (activeRoom) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, category } = req.body;
    try {
        await db.query(
            'UPDATE quizzes SET title = ?, category = ? WHERE id = ?',
            [title, category, id]
        );
        res.json({ message: 'Квиз успешно обновлен!' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении метаданных квиза' });
    }
});

router.put('/:id/questions', async (req, res) => {
    const quizId = req.params.id;
    const { questions } = req.body;

    try {
        await db.query('START TRANSACTION');

        const [oldQuestions] = await db.query('SELECT id FROM questions WHERE quiz_id = ?', [quizId]);

        if (oldQuestions.length > 0) {
            const oldQuestionIds = oldQuestions.map(q => q.id);
            await db.query('DELETE FROM options WHERE question_id IN (?)', [oldQuestionIds]);
        }

        await db.query('DELETE FROM questions WHERE quiz_id = ?', [quizId]);

        for (let q of questions) {
            const [questionResult] = await db.query(
                'INSERT INTO questions (quiz_id, question_text, question_type, image, time_limit) VALUES (?, ?, ?, ?, ?)',
                [quizId, q.question_text, q.question_type, q.image || null, q.time_limit]
            );
            const questionId = questionResult.insertId;

            for (let option of q.options) {
                const isCorrectVal = (String(option.is_correct) === '1' || option.is_correct === true) ? 1 : 0;

                await db.query(
                    'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                    [questionId, option.option_text || option.text || '', isCorrectVal]
                );
            }
        }

        await db.query('COMMIT');
        res.json({ message: 'Все вопросы квиза успешно сохранены!' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Ошибка при сохранении изменений в вопросах квиза' });
    }
});

router.get('/active-rooms', async (req, res) => {
    try {
        if (!global.liveRooms || Object.keys(global.liveRooms).length === 0) {
            return res.json([]);
        }

        const activeRoomsList = [];

        for (const [roomCode, roomData] of Object.entries(global.liveRooms)) {
            const quizId = Number(roomData.quizId);

            const [quiz] = await db.query('SELECT title, category FROM quizzes WHERE id = ?', [quizId]);

            activeRoomsList.push({
                roomCode: roomCode,
                quizId: quizId,
                title: quiz[0] ? quiz[0].title : 'Квиз без названия',
                category: quiz[0] ? quiz[0].category : 'Общее',
                createdAt: roomData.createdAt
            });
        }

        activeRoomsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(activeRoomsList);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера при загрузке активных комнат' });
    }
});

module.exports = router;