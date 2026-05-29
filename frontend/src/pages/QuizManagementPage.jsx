import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import './QuizManagementPage.css';

function QuizManagementPage() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('neon_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        if (!user) navigate('/');
    }, [user, navigate]);

    useEffect(() => {
        fetch('http://localhost:5000/api/quizzes')
            .then(res => res.json())
            .then(data => {
                setQuizzes(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Ошибка при получении квизов:', err);
                setLoading(false);
            });
    }, []);

    const handleHostGame = async (quizId) => {
        try {
            const res = await fetch('http://localhost:5000/api/quizzes/generate-room-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizId })
            });
            const data = await res.json();

            if (res.ok && data.roomCode) {
                setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, activeRoomCode: data.roomCode } : q));
                navigate('/game', { state: { roomCode: data.roomCode, isHost: true } });
            } else {
                alert(data.error || 'Не удалось сгенерировать код комнаты.');
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка сервера при запуске квиза.');
        }
    };

    const handleDeleteQuiz = async (id, activeRoomCode) => {
        try {
            const res = await fetch(`http://localhost:5000/api/quizzes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (activeRoomCode) {
                    socket.emit('cancel_quiz_by_admin', { roomCode: activeRoomCode });
                }
                setQuizzes(quizzes.filter(item => item.id !== id));
            } else {
                alert('Ошибка сервера при удалении квиза.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!user) return null;

    return (
        <div className="app-container">
            <div className="neon-card quiz-mgmt-panel">
                <div className="quiz-mgmt-header">
                    <h2 className="quiz-mgmt-title">УПРАВЛЕНИЕ КВИЗАМИ</h2>
                    <button className="btn-neon btn-mgmt-back" onClick={() => navigate('/dashboard')}>В МЕНЮ</button>
                </div>

                <div className="scroll-container quiz-mgmt-scroll">
                    {loading ? (
                        <p className="quiz-mgmt-loading">Загрузка...</p>
                    ) : (
                        <div className="quiz-mgmt-list">
                            {quizzes.map(q => (
                                <div key={q.id} className="quiz-mgmt-card">
                                    <div>
                                        <div className="quiz-mgmt-card-title">{q.title}</div>
                                        <div className="quiz-mgmt-card-category">Категория: {q.category || 'Общее'}</div>
                                    </div>

                                    <div className="quiz-mgmt-divider" />

                                    <div className="quiz-mgmt-actions">
                                        <button className="btn-mgmt-action" onClick={() => handleHostGame(q.id)}>
                                            ЗАПУСТИТЬ
                                        </button>
                                        <button className="btn-mgmt-action" onClick={() => navigate(`/edit-quiz/${q.id}`)}>
                                            РЕДАКТИРОВАТЬ
                                        </button>
                                        <button className="btn-mgmt-action" onClick={() => handleDeleteQuiz(q.id, q.activeRoomCode)}>
                                            УДАЛИТЬ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuizManagementPage;