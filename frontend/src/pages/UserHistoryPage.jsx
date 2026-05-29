import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserHistoryPage.css';

function UserHistoryPage({ user }) {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) {
            navigate('/');
            return;
        }

        fetch(`http://localhost:5000/api/quizzes/history/${user.id}`)
            .then(res => res.json())
            .then(data => {
                setHistory(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [user, navigate]);

    if (!user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('ru-RU');
    };

    return (
        <div className="app-container">
            <div className="neon-card">
                <div className="history-header">
                    <h2 className="history-title">ИСТОРИЯ УЧАСТИЙ</h2>
                    <button
                        className="btn-neon btn-history-back"
                        onClick={() => navigate('/dashboard')}
                    >
                        В МЕНЮ
                    </button>
                </div>

                <div className="scroll-container">
                    {loading ? (
                        <p className="history-status-text">
                            Загрузка истории...
                        </p>
                    ) : history.length === 0 ? (
                        <p className="history-empty-text">
                            Вы еще не участвовали в квизах.
                        </p>
                    ) : (
                        history.map((h, i) => {
                            let placeClass = '';
                            if (h.place === 1) placeClass = 'gold-place';
                            else if (h.place === 2) placeClass = 'silver-place';

                            return (
                                <div key={i} className={`history-item-card ${placeClass}`}>
                                    <div className="history-item-info">
                                        <div className="history-item-main-row">
                                            {h.title}
                                            <span className="history-item-date">
                                                ({formatDate(h.played_at)})
                                            </span>
                                        </div>
                                        <div className="history-item-badge">
                                            {h.place}-е место
                                        </div>
                                    </div>

                                    <div className="history-item-score">
                                        {h.formattedScore}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserHistoryPage;