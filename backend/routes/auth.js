const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
        }

        const [result] = await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, password]
        );
        res.status(201).json({ message: 'Регистрация успешна!', userId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера базы данных' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query(
            'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const user = users[0];
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;