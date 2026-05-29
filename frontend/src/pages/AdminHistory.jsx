import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminHistory.css';

function AdminHistory() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/quizzes/global-history')
            .then(res => res.json())
            .then(data => {
                setHistory(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Ошибка загрузки админской истории:', err);
                setLoading(false);
            });
    }, []);

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return { dateStr: '-', timeStr: '' };
        const parts = dateTimeString.split(',');
        if (parts.length === 2) {
            return { dateStr: parts[0].trim(), timeStr: parts[1].trim() };
        }
        return { dateStr: dateTimeString, timeStr: '' };
    };

    const formatWinner = (winnerString) => {
        if (!winnerString) return { name: '-', score: '' };
        const match = winnerString.match(/^(.*?)\s*(\(\d+\/\d+\))$/);
        if (match) {
            return { name: match[1], score: match[2] };
        }
        return { name: winnerString, score: '' };
    };

    return (
        <div className="app-container">
            <div className="neon-card admin-history-panel">
                <div className="history-header">
                    <h2 className="history-title">ГЛОБАЛЬНАЯ ИСТОРИЯ ИГР</h2>
                    <button
                        className="btn-neon btn-history-back"
                        onClick={() => navigate('/dashboard')}
                    >
                        В МЕНЮ
                    </button>
                </div>

                <div className="scroll-container admin-history-scroll">
                    {loading ? (
                        <p className="history-status-text">
                            Загрузка глобальной истории...
                        </p>
                    ) : history.length === 0 ? (
                        <p className="history-empty-text">Игры ещё не проводились</p>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr className="table-head-row">
                                    <th>Квиз</th>
                                    <th className="text-center">Игроки</th>
                                    <th>Топ-1</th>
                                    <th className="text-right">Дата</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((game, index) => {
                                    const { dateStr, timeStr } = formatDateTime(game.date);
                                    const { name, score } = formatWinner(game.winner);

                                    return (
                                        <tr key={index} className="table-body-row">
                                            <td>
                                                <div className="quiz-title">{game.quiz_title || 'Удаленный квиз'}</div>
                                                <div className="quiz-category">{game.quiz_category}</div>
                                            </td>
                                            <td className="text-center players-count">
                                                {game.total_players}
                                            </td>
                                            <td>
                                                <span className="winner-name">{name}</span>
                                                {score && <span className="winner-score">{score}</span>}
                                            </td>
                                            <td className="text-right">
                                                <span className="game-date">{dateStr}</span>
                                                {timeStr && <span className="game-time">{timeStr}</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminHistory;