import React, { useState } from 'react';
import './Auth.css';

function Auth({ setUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                return;
            }

            if (isLogin) {
                localStorage.setItem('neon_user', JSON.stringify(data));
                setUser(data);
            } else {
                setSuccess('Регистрация успешна! Теперь можете войти и начать игру');
                setUsername('');
                setPassword('');

                setTimeout(() => {
                    setSuccess('');
                    setIsLogin(true);
                }, 1500);
            }
        } catch (err) {
            setError('Ошибка сети. Проверьте, запущен ли сервер.');
        }
    };

    return (
        <div className="app-container">
            <div className="neon-card" style={{ width: '550px', height: '750px', justifyContent: 'center', alignItems: 'center' }}>

                <form onSubmit={handleSubmit} className="auth-form">
                    <h1 className="auth-title">{isLogin ? 'NEON QUIZ' : 'РЕГИСТРАЦИЯ'}</h1>

                    {error && <p className="auth-error">{error}</p>}

                    {success && (
                        <p className="auth-success">
                            {success}
                        </p>
                    )}

                    <input
                        type="text"
                        className="neon-input"
                        placeholder="Логин"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="neon-input"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="btn-neon auth-btn">
                        {isLogin ? 'Войти' : 'Создать аккаунт'}
                    </button>

                    <p className="auth-footer-text">
                        {isLogin ? (
                            <>
                                Еще нет аккаунта?{' '}
                                <span className="neon-link" onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>
                                    Зарегистрироваться
                                </span>
                            </>
                        ) : (
                            <>
                                Уже есть аккаунт?{' '}
                                <span className="neon-link" onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>
                                    Войти
                                </span>
                            </>
                        )}
                    </p>
                </form>

            </div>
        </div>
    );
}

export default Auth;