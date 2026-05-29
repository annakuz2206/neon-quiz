import React, { useState, useEffect } from 'react';
import './SuperadminPanel.css';

function SuperadminPanel() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    const loadUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/users');

            if (!res.ok) {
                throw new Error(`Сервер вернул статус ${res.status}`);
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setUsers(data.filter(u => u.role !== 'superadmin'));
            } else {
                setError('Бэкенд вернул некорректный формат данных');
            }
        } catch (err) {
            setError('Не удалось загрузить пользователей. Проверьте консоль бэкенда.');
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                loadUsers();
            }
        } catch (err) {
            alert('Ошибка при изменении роли');
        }
    };

    return (
        <div className="superadmin-panel-container">
            {error && <p className="error-message">{error}</p>}

            {users.length === 0 && !error && (
                <p className="empty-message">Остальные пользователи не найдены</p>
            )}

            {users.map(u => (
                <div key={u.id} className="user-row">
                    <span>{u.username} (<span className="role-badge">{u.role}</span>)</span>
                    <button
                        onClick={() => toggleRole(u.id, u.role)}
                        className="btn-neon btn-role-toggle"
                    >
                        {u.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                    </button>
                </div>
            ))}
        </div>
    );
}

export default SuperadminPanel;