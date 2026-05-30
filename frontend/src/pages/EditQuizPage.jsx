import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditQuizPage.css';

function EditQuizPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:5000/api/quizzes/${id}/full`)
            .then(res => res.json())
            .then(data => {
                const normalizedQuestions = (data.questions || []).map(q => ({
                    question_text: q.question_text || q.text || '',
                    question_type: q.question_type || 'single',
                    time_limit: q.time_limit || 20,
                    image: q.image || '',
                    options: (q.options || []).map(opt => ({
                        option_text: opt.option_text || opt.text || '',
                        is_correct: (opt.is_correct === 1 || opt.is_correct === true) ? 1 : 0
                    }))
                }));
                setQuestions(normalizedQuestions);
                return fetch(`http://localhost:5000/api/quizzes`);
            })
            .then(res => res.json())
            .then(allQuizzes => {
                const currentQuiz = allQuizzes.find(q => q.id === parseInt(id));
                if (currentQuiz) {
                    setTitle(currentQuiz.title);
                    setCategory(currentQuiz.category);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            question_text: '',
            question_type: 'single',
            time_limit: 20,
            image: '',
            options: [
                { option_text: '', is_correct: 1 },
                { option_text: '', is_correct: 0 }
            ]
        }]);
    };

    const handleRemoveQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleQuestionChange = (index, field, value) => {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
    };

    const handleImageUpload = (index, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            handleQuestionChange(index, 'image', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleOptionChange = (qIndex, optIndex, field, value) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;
            const updatedOptions = q.options.map((opt, oIdx) =>
                oIdx === optIndex ? { ...opt, [field]: value } : opt
            );
            return { ...q, options: updatedOptions };
        }));
    };

    const handleToggleCorrect = (qIndex, optIndex) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;

            const isSingle = q.question_type === 'single';
            const updatedOptions = q.options.map((opt, oIdx) => {
                if (isSingle) {
                    return { ...opt, is_correct: oIdx === optIndex ? 1 : 0 };
                } else {
                    return oIdx === optIndex ? { ...opt, is_correct: opt.is_correct === 1 ? 0 : 1 } : opt;
                }
            });

            return { ...q, options: updatedOptions };
        }));
    };

    const handleAddOption = (qIndex) => {
        setQuestions(prev => prev.map((q, i) =>
            i === qIndex ? { ...q, options: [...q.options, { option_text: '', is_correct: 0 }] } : q
        ));
    };

    const handleSaveChanges = async () => {
        if (!title.trim() || !category.trim()) {
            return alert('Заполните название и категорию квиза!');
        }

        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].question_text.trim()) {
                return alert(`Заполните текст вопроса №${i + 1}`);
            }
            if (questions[i].options.length < 2) {
                return alert(`У вопроса №${i + 1} должно быть минимум 2 варианта ответа!`);
            }
        }

        try {
            const resMeta = await fetch(`http://localhost:5000/api/quizzes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category })
            });

            const resQuestions = await fetch(`http://localhost:5000/api/quizzes/${id}/questions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions })
            });

            if (resMeta.ok && resQuestions.ok) {
                alert('Квиз успешно сохранен и обновлен!');
                navigate('/manage-quizzes');
            } else {
                alert('Произошла ошибка при сохранении изменений.');
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка соединения с сервером.');
        }
    };

    if (loading) {
        return (
            <div className="app-container">
                <div className="neon-card edit-quiz-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <p style={{ color: 'var(--neon-blue)', textShadow: '0 0 10px var(--neon-blue)', margin: 0, fontWeight: 'bold' }}>
                        Загрузка данных квиза...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="neon-card edit-quiz-card">
                <div className="edit-quiz-header">
                    <h2 className="edit-quiz-title">РЕДАКТИРОВАНИЕ КВИЗА</h2>
                    <button className="btn-neon" style={{ width: 'auto', marginTop: 0, padding: '8px 15px' }} onClick={() => navigate('/manage-quizzes')}>Отмена</button>
                </div>

                <div className="scroll-container" style={{ maxHeight: '70vh', paddingRight: '5px' }}>
                    <div className="edit-meta-grid">
                        <div className="edit-meta-field">
                            <label className="field-label">Название квиза</label>
                            <input type="text" className="neon-input" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="edit-meta-field">
                            <label className="field-label">Категория</label>
                            <input type="text" className="neon-input" value={category} onChange={e => setCategory(e.target.value)} />
                        </div>
                    </div>

                    <h3>Вопросы квиза ({questions.length})</h3>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="question-block">
                            <div className="question-block-header">
                                <strong>Вопрос №{qIndex + 1}</strong>
                                <button className="btn-neon btn-remove-question" onClick={() => handleRemoveQuestion(qIndex)}>Удалить вопрос</button>
                            </div>

                            <input
                                type="text"
                                className="neon-input"
                                style={{ marginBottom: '10px' }}
                                value={q.question_text}
                                onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                            />

                            <div className="question-row-settings">
                                <div className="question-settings-field">
                                    <label className="field-label-small">Тип выбора</label>
                                    <select
                                        className="neon-input select-dark"
                                        value={q.question_type}
                                        onChange={e => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                                    >
                                        <option value="single">Один правильный вариант</option>
                                        <option value="multiple">Множественный выбор</option>
                                    </select>
                                </div>
                                <div className="question-settings-field">
                                    <label className="field-label-small">Время на ответ (сек)</label>
                                    <input
                                        type="number"
                                        className="neon-input"
                                        value={q.time_limit}
                                        onChange={e => handleQuestionChange(qIndex, 'time_limit', parseInt(e.target.value) || 20)}
                                    />
                                </div>
                            </div>

                            <div className="image-upload-wrapper">
                                <label className="image-upload-label">Изображение вопроса</label>

                                <div className="image-upload-actions">
                                    <label className="btn-admin-direct btn-upload-trigger">
                                        Загрузить фото с устройства
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={e => handleImageUpload(qIndex, e.target.files[0])}
                                        />
                                    </label>

                                    {q.image && (
                                        <button
                                            className="btn-neon btn-remove-photo"
                                            onClick={() => handleQuestionChange(qIndex, 'image', '')}
                                        >
                                            Удалить фото
                                        </button>
                                    )}
                                </div>

                                {q.image && (
                                    <div className="image-preview-box">
                                        <span className="preview-label">Предпросмотр:</span>
                                        <img
                                            src={q.image}
                                            alt="Превью"
                                            className="image-preview-element"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                            </div>

                            <label className="options-section-label">Варианты ответов (зеленый круг — правильный):</label>
                            <div className="options-list-wrapper">
                                {q.options.map((opt, optIndex) => (
                                    <div key={optIndex} className="option-row">
                                        <div
                                            onClick={() => handleToggleCorrect(qIndex, optIndex)}
                                            className={`indicator-checkbox ${opt.is_correct === 1 ? 'correct' : ''}`}
                                        />
                                        <input
                                            type="text"
                                            className="neon-input input-option-text"
                                            value={opt.option_text}
                                            onChange={e => handleOptionChange(qIndex, optIndex, 'option_text', e.target.value)}
                                        />
                                    </div>
                                ))}
                                <button className="btn-admin-direct btn-add-option" onClick={() => handleAddOption(qIndex)}>+ Добавить вариант ответа</button>
                            </div>
                        </div>
                    ))}

                    <button className="btn-admin-direct btn-add-question-full" onClick={handleAddQuestion}>Добавить новый вопрос в квиз</button>
                </div>

                <button className="btn-neon btn-save-quiz-bottom" onClick={handleSaveChanges}>Сохранить все изменения</button>
            </div>
        </div>
    );
}

export default EditQuizPage;
