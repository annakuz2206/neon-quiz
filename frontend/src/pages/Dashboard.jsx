import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ user, setUser }) {
    const navigate = useNavigate();

    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    const [hoveredBtn, setHoveredBtn] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('neon_user');
        setUser(null);
        navigate('/');
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        setError('');

        if (!roomCode.trim()) {
            setError('Введите код комнаты!');
            return;
        }

        navigate('/game', {
            state: {
                roomCode: roomCode.trim().toUpperCase(),
                user: {
                    id: user?.id,
                    username: user?.username || 'Игрок'
                },
                isHost: false
            }
        });
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    const getCustomBtnStyle = (btnKey, isInput = false) => {
        const isHovered = hoveredBtn === btnKey;
        return {
            width: '100%',
            padding: isInput ? '12px 10px' : '12px 0',
            fontSize: isInput ? '1.1rem' : '1rem',
            fontWeight: '600',
            letterSpacing: isInput ? '5px' : '1px',
            textTransform: 'uppercase',
            textAlign: 'center',
            background: isHovered ? 'rgba(255, 0, 85, 0.05)' : 'transparent',
            color: isHovered ? 'var(--neon-pink)' : 'var(--neon-blue)',
            borderColor: isHovered ? 'var(--neon-pink)' : 'var(--neon-blue)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: isHovered ? '0 0 15px rgba(255, 0, 85, 0.5)' : '0 0 8px rgba(0, 230, 255, 0.15)',
            transition: 'all 0.25s ease',
            outline: 'none',
            fontFamily: 'inherit',
            marginTop: 0,
            boxSizing: 'border-box'
        };
    };

    return (
        <div className="app-container">
            <div
                className="neon-card"
                style={{
                    width: '550px',
                    height: '750px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
            >
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', letterSpacing: '1px' }}>ДОБРО ПОЖАЛОВАТЬ,</h1>
                        <p style={{ color: 'var(--neon-pink)', textShadow: '0 0 8px var(--neon-pink)', margin: '5px 0', fontWeight: 'bold', fontSize: '1.4rem' }}>
                            {user?.username?.toUpperCase()}
                        </p>
                        <span style={{ fontSize: '0.8rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            Роль: {user?.role || 'user'}
                        </span>
                    </div>

                    {isAdmin ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <button
                                style={getCustomBtnStyle('create-quiz')}
                                onMouseEnter={() => setHoveredBtn('create-quiz')}
                                onMouseLeave={() => setHoveredBtn(null)}
                                onClick={() => navigate('/create-quiz')}
                            >
                                СОЗДАТЬ КВИЗ
                            </button>

                            <button
                                style={getCustomBtnStyle('manage-quizzes')}
                                onMouseEnter={() => setHoveredBtn('manage-quizzes')}
                                onMouseLeave={() => setHoveredBtn(null)}
                                onClick={() => navigate('/manage-quizzes')}
                            >
                                УПРАВЛЕНИЕ КВИЗАМИ
                            </button>

                            <button
                                style={getCustomBtnStyle('active-quizzes-admin')}
                                onMouseEnter={() => setHoveredBtn('active-quizzes-admin')}
                                onMouseLeave={() => setHoveredBtn(null)}
                                onClick={() => navigate('/active-quizzes')}
                            >
                                АКТИВНЫЕ КОМНАТЫ
                            </button>

                            <button
                                style={getCustomBtnStyle('admin-history')}
                                onMouseEnter={() => setHoveredBtn('admin-history')}
                                onMouseLeave={() => setHoveredBtn(null)}
                                onClick={() => navigate('/admin-history')}
                            >
                                ИСТОРИЯ ИГР
                            </button>

                            {user?.role === 'superadmin' && (
                                <button
                                    style={getCustomBtnStyle('manage-users')}
                                    onMouseEnter={() => setHoveredBtn('manage-users')}
                                    onMouseLeave={() => setHoveredBtn(null)}
                                    onClick={() => navigate('/manage-users')}
                                >
                                    УПРАВЛЕНИЕ РОЛЯМИ
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ width: '100%' }}>
                            <div style={{
                                background: 'transparent',
                                border: '1px dashed rgba(0, 230, 255, 0.4)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                marginBottom: '15px',
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                color: '#e4e4e7',
                                lineHeight: '1.4'
                            }}>
                                <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold', textShadow: '0 0 5px rgba(0, 230, 255, 0.2)' }}>Подсказка:</span> выберите в списке запущенных квизов желаемый, нажмите на его код для копирования и вставьте в форму ниже.
                            </div>

                            <form onSubmit={handleJoinRoom} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <h3 style={{
                                    margin: 0,
                                    textAlign: 'center',
                                    color: 'var(--neon-pink)',
                                    textShadow: '0 0 8px var(--neon-pink)',
                                    fontSize: '1.2rem',
                                    letterSpacing: '1px'
                                }}>
                                    ПОДКЛЮЧИТЬСЯ К МАТЧУ
                                </h3>

                                {error && <p style={{ color: 'var(--neon-pink)', margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}

                                <input
                                    type="text"
                                    placeholder="ВВЕДИТЕ PIN КОМНАТЫ"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    onMouseEnter={() => setHoveredBtn('pin-input')}
                                    onMouseLeave={() => setHoveredBtn(null)}
                                    style={getCustomBtnStyle('pin-input', true)}
                                    maxLength={6}
                                    required
                                />

                                <button
                                    type="submit"
                                    onMouseEnter={() => setHoveredBtn('join-lobby')}
                                    onMouseLeave={() => setHoveredBtn(null)}
                                    style={getCustomBtnStyle('join-lobby')}
                                >
                                    ВОЙТИ В ЛОББИ
                                </button>
                            </form>

                            <div style={{ height: '15px' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <button
                                    style={getCustomBtnStyle('active-quizzes-player')}
                                    onMouseEnter={() => setHoveredBtn('active-quizzes-player')}
                                    onMouseLeave={() => setHoveredBtn(null)}
                                    onClick={() => navigate('/active-quizzes')}
                                >
                                    СМОТРЕТЬ ЗАПУЩЕННЫЕ КВИЗЫ
                                </button>

                                <button
                                    style={getCustomBtnStyle('player-history')}
                                    onMouseEnter={() => setHoveredBtn('player-history')}
                                    onMouseLeave={() => setHoveredBtn(null)}
                                    onClick={() => navigate('/my-history')}
                                >
                                    ИСТОРИЯ МОИХ ИГР
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="btn-neon"
                    style={{
                        borderColor: '#555',
                        color: '#aaa',
                        marginTop: '20px',
                        boxShadow: 'none'
                    }}
                    onClick={handleLogout}
                >
                    ВЫЙТИ ИЗ СИСТЕМЫ
                </button>
            </div>
        </div>
    );
}

export default Dashboard;