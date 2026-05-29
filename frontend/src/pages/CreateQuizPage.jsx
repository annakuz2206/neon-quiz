import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCreator from '../components/QuizCreator';
import './CreateQuizPage.css';

function CreateQuizPage() {
    const navigate = useNavigate();
    const [currentQuizId, setCurrentQuizId] = useState(null);

    window.setCreatedQuizIdGlobal = (id) => {
        setCurrentQuizId(prevId => prevId !== id ? id : prevId);
    };

    const storedUser = JSON.parse(localStorage.getItem('neon_user'));
    const userId = storedUser?.id;

    const handleBackToMenu = async () => {
        if (currentQuizId) {
            const confirmCancel = window.confirm('Вы не сохранили квиз! Если уйти сейчас, он будет удален. Продолжить?');
            if (!confirmCancel) return;

            try {
                await fetch(`http://localhost:5000/api/quizzes/${currentQuizId}`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.error('Не удалось удалить отмененный квиз:', err);
            }
        }
        navigate('/dashboard');
    };

    if (!userId) {
        return (
            <div className="app-container">
                <div className="neon-card auth-error-card">
                    <p className="auth-error-text">
                        Ошибка: Пользователь не авторизован.
                    </p>
                    <button className="btn-neon btn-max-width" onClick={() => navigate('/login')}>
                        На главную
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="neon-card create-quiz-panel">
                <div className="create-quiz-header">
                    <h2 className="create-quiz-title">КОНСТРУКТОР КВИЗОВ</h2>
                    <button
                        className="btn-neon btn-create-back"
                        onClick={handleBackToMenu}
                    >
                        В МЕНЮ
                    </button>
                </div>

                <div className="scroll-container create-quiz-scroll">
                    <QuizCreator userId={userId} onFinish={() => navigate('/dashboard')} />
                </div>
            </div>
        </div>
    );
}

export default CreateQuizPage;