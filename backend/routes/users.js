const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, role FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения пользователей' });
    }
});

router.put('/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'Роль успешно обновлена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка обновления роли' });
    }
});

module.exports = router;