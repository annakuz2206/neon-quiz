import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import './GameRoom.css';

function GameRoom({ user }) {
    const location = useLocation();
    const navigate = useNavigate();

    const { roomCode, isHost } = location.state || {};

    const [gameState, setGameState] = useState('lobby');
    const [players, setPlayers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [qIndex, setQIndex] = useState(0);
    const [totalQ, setTotalQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    const [selectedOptions, setSelectedOptions] = useState([]);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [showCorrect, setShowCorrect] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState([]);

    useEffect(() => {
        if (!roomCode) {
            navigate('/dashboard', { replace: true });
        }
    }, [roomCode, navigate]);

    useEffect(() => {
        if (!roomCode) return;

        if (isHost) {
            socket.emit('host_create_room', { roomCode });
        } else {
            socket.emit('player_join_room', { roomCode, user });
        }

        socket.on('room_players_update', (data) => setPlayers(data));
        socket.on('scoreboard_update', (data) => setPlayers(data));
        socket.on('game_started', () => setGameState('playing'));

        socket.on('quiz_cancelled_message', (data) => {
            alert(data.message);
            navigate('/dashboard', { replace: true });
        });

        socket.on('receive_question', (data) => {
            setCurrentQuestion(data.question);
            setQIndex(data.currentIndex);
            setTotalQ(data.totalQuestions);
            setTimeLeft(data.question.time);

            setCorrectAnswers([]);
            setSelectedOptions([]);
            setHasAnswered(false);
            setShowCorrect(false);
        });

        socket.on('question_time_up', (data) => {
            setCorrectAnswers(data.correctOptionIds || []);
            setShowCorrect(true);
            setTimeLeft(0);
        });

        socket.on('game_over', (finalPlayers) => {
            const normalizedPlayers = finalPlayers.map(p => ({
                id: p.id,
                username: p.username || p.player_name || 'Аноним',
                score: p.score !== undefined ? p.score : 0
            }));
            setPlayers(normalizedPlayers);
            setGameState('ended');
        });

        socket.on('join_error', (errorMsg) => {
            alert(errorMsg);
            navigate('/dashboard');
        });

        return () => {
            socket.off('room_players_update');
            socket.off('scoreboard_update');
            socket.off('game_started');
            socket.off('quiz_cancelled_message');
            socket.off('receive_question');
            socket.off('question_time_up');
            socket.off('game_over');
            socket.off('join_error');
        };
    }, [roomCode, isHost, user, navigate]);

    useEffect(() => {
        if (gameState !== 'playing' || showCorrect) return;
        if (timeLeft <= 0) return;

        const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, gameState, showCorrect]);

    const handleStartGame = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/quizzes/full-by-code/${roomCode}`);
            const data = await res.json();

            if (res.ok && data.questions && data.questions.length > 0) {
                socket.emit('host_start_game', { roomCode, questions: data.questions });
            } else {
                alert(data.message || 'В этом квизе нет вопросов!');
            }
        } catch (err) {
            console.error('Ошибка при старте игры:', err);
            alert('Не удалось загрузить вопросы игры.');
        }
    };

    const handleCancelGame = () => {
        if (roomCode) {
            socket.emit('cancel_quiz_by_admin', { roomCode });
            navigate('/manage-quizzes', { replace: true });
        }
    };

    const handleSelectOption = (id) => {
        if (isHost || timeLeft === 0 || showCorrect) return;

        if (currentQuestion.type === 'single') {
            if (selectedOptions.includes(id)) {
                setSelectedOptions([]);
                setHasAnswered(false);
                socket.emit('player_submit_answer', { roomCode, userId: user.id, optionIds: [] });
            } else {
                setSelectedOptions([id]);
                setHasAnswered(true);
                socket.emit('player_submit_answer', { roomCode, userId: user.id, optionIds: [id] });
            }
        } else {
            let updatedOptions = [];
            if (selectedOptions.includes(id)) {
                updatedOptions = selectedOptions.filter(oId => oId !== id);
            } else {
                updatedOptions = [...selectedOptions, id];
            }
            setSelectedOptions(updatedOptions);
            setHasAnswered(updatedOptions.length > 0);
            socket.emit('player_submit_answer', { roomCode, userId: user.id, optionIds: updatedOptions });
        }
    };

    if (!roomCode) return null;

    return (
        <div className="app-container">
            <div className="neon-card gameroom-panel">

                {gameState === 'lobby' && (
                    <>
                        <div className="gameroom-header-section">
                            <span className="room-sub-label">
                                {isHost ? 'Панель организатора' : 'Ожидание старта'}
                            </span>
                            <h1 className="room-main-title">ЛОББИ МАТЧА</h1>

                            <div className="lobby-pin-display">{roomCode}</div>

                            <div className="lobby-players-header">
                                <span className="lobby-players-title">ИГРОКИ В КОМНАТЕ</span>
                                <span className="lobby-players-badge">{players.length} чел.</span>
                            </div>
                        </div>

                        <div className="scroll-container gameroom-scroll">
                            {players.length === 0 ? (
                                <p className="lobby-empty-text">Ждем подключения игроков...</p>
                            ) : (
                                <div className="lobby-players-grid">
                                    {players.map((p, i) => (
                                        <div key={i} className="lobby-player-card">
                                            {p.username}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="gameroom-footer-section">
                            {isHost ? (
                                <div className="lobby-host-controls">
                                    <button className="gameroom-btn-interactive" onClick={handleStartGame}>
                                        ЗАПУСТИТЬ КВИЗ
                                    </button>
                                    <button className="gameroom-btn-interactive" onClick={handleCancelGame}>
                                        ОТМЕНИТЬ МАТЧ
                                    </button>
                                </div>
                            ) : (
                                <div className="lobby-player-wait-box">
                                    Приготовьтесь! Организатор запустит игру в ближайшее время
                                </div>
                            )}
                        </div>
                    </>
                )}

                {gameState === 'playing' && currentQuestion && (
                    <>
                        <div className="gameroom-header-section">
                            <div className="game-info-bar">
                                <span>Вопрос {qIndex + 1} из {totalQ}</span>
                                <span className={`game-timer ${timeLeft < 5 ? 'danger' : ''}`}>
                                    Время: {timeLeft} сек
                                </span>
                            </div>

                            <h2 className="game-question-text">{currentQuestion.text}</h2>
                        </div>

                        <div className="game-media-center">
                            {currentQuestion.image ? (
                                <img src={currentQuestion.image} alt="Вопрос" className="game-question-image" />
                            ) : (
                                <div className="game-spacer-20" />
                            )}

                            {!isHost && !showCorrect && (
                                <p className={`game-status-msg ${hasAnswered ? 'success' : ''}`}>
                                    {hasAnswered ? 'Ответ принят! Можно изменить до конца таймера.' : 'Выберите вариант ответа...'}
                                </p>
                            )}
                            {isHost && !showCorrect && (
                                <p className="game-status-msg info">Игроки выбирают ответы...</p>
                            )}
                            {showCorrect && (
                                <p className="game-status-msg time-up">
                                    ВРЕМЯ ВЫШЛО! СМОТРИМ ПРАВИЛЬНЫЙ ОТВЕТ:
                                </p>
                            )}
                        </div>

                        <div className="game-options-grid game-options-interactive">
                            {currentQuestion.options.map((opt) => {
                                const isSelected = selectedOptions.includes(opt.id);
                                const isCorrect = correctAnswers?.includes(opt.id) || false;

                                let stateClass = '';
                                if (isSelected) stateClass = 'selected';

                                if (showCorrect) {
                                    if (isCorrect) {
                                        stateClass = 'correct-reveal';
                                    } else if (isSelected && !isCorrect) {
                                        stateClass = 'wrong-reveal';
                                    }
                                }

                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => handleSelectOption(opt.id)}
                                        className={`game-option-card ${stateClass}`}
                                    >
                                        {opt.text}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {gameState === 'ended' && (
                    <>
                        <div className="gameroom-header-section">
                            <h1 className="room-main-title">
                                МАТЧ ЗАВЕРШЕН
                            </h1>
                            <h3 className="leaderboard-title">Итоговые результаты</h3>
                        </div>

                        <div className="scroll-container gameroom-scroll">
                            {(() => {
                                const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
                                let currentPlace = 1;

                                return sortedPlayers.map((p, i) => {
                                    if (i > 0 && p.score !== sortedPlayers[i - 1].score) {
                                        currentPlace = i + 1;
                                    }

                                    const isFirstPlace = currentPlace === 1;

                                    return (
                                        <div key={i} className={`leaderboard-row ${isFirstPlace ? 'winner-row' : ''}`}>
                                            <span className="leaderboard-player-name">
                                                {currentPlace}. {p.username} {user && p.id === user.id && <span className="leaderboard-self-marker">(Вы)</span>}
                                            </span>
                                            <strong className="leaderboard-score">
                                                {p.score} / {totalQ}
                                            </strong>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        <button className="gameroom-btn-interactive" onClick={() => navigate('/dashboard')}>
                            ВЫЙТИ В МЕНЮ
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}

export default GameRoom;