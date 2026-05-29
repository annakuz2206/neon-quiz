import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ActiveQuizzesPage.css';

function ActiveQuizzesPage() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/quizzes/active-rooms')
            .then(res => res.json())
            .then(data => {
                setRooms(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Ошибка загрузки запущенных квизов:', err);
                setLoading(false);
            });
    }, []);

    const handleCopyCode = (e, code) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="app-container">
            <div className="neon-card active-rooms-panel">
                <div className="active-rooms-header">
                    <h2 className="active-rooms-title">АКТИВНЫЕ КОМНАТЫ</h2>
                    <button
                        className="btn-neon btn-active-back"
                        onClick={() => navigate('/dashboard')}
                    >
                        В МЕНЮ
                    </button>
                </div>

                <div className="scroll-container active-rooms-scroll">
                    {loading ? (
                        <p className="rooms-scan-text">
                            Сканирование запущенных комнат...
                        </p>
                    ) : rooms.length === 0 ? (
                        <div className="rooms-empty-container">
                            <p className="rooms-empty-title">Сейчас нет запущенных комнат</p>
                            <p className="rooms-empty-subtitle">Как только админ запустит квиз, код появится здесь.</p>
                        </div>
                    ) : (
                        <div className="rooms-list">
                            {rooms.map((room) => (
                                <div key={room.roomCode} className="room-card">
                                    <div className="room-info">
                                        <div className="room-title">{room.title}</div>
                                        <span className="room-category">
                                            Категория: {room.category || 'Общее'}
                                        </span>
                                    </div>

                                    <div
                                        onClick={(e) => handleCopyCode(e, room.roomCode)}
                                        className={`room-pin-code ${copiedCode === room.roomCode ? 'copied' : 'default'}`}
                                    >
                                        {copiedCode === room.roomCode ? 'СКОПИРОВАНО' : room.roomCode}
                                    </div>

                                    <p className="room-hint">
                                        Нажмите на код для копирования и вставьте в форму для входа в лобби
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ActiveQuizzesPage;