import React, { useState, useEffect } from 'react';
import './QuizCreator.css';

function QuizCreator({ userId, onFinish }) {
    const [quizId, setQuizId] = useState(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [addedQuestionsCount, setAddedQuestionsCount] = useState(0);

    const [qText, setQText] = useState('');
    const [qType, setQType] = useState('single');
    const [qImage, setQImage] = useState('');
    const [qTime, setQTime] = useState(15);

    const [options, setOptions] = useState([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
    ]);

    useEffect(() => {
        if (window.setCreatedQuizIdGlobal) {
            window.setCreatedQuizIdGlobal(quizId);
        }
    }, [quizId]);

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:5000/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category, creator_id: userId })
        });
        const data = await res.json();
        if (res.ok) {
            setQuizId(data.quizId);
            setAddedQuestionsCount(0);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            alert('Файл слишком тяжелый! Выберите изображение размером до 4 МБ.');
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setQImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleAddOption = () => {
        setOptions([...options, { text: '', isCorrect: false }]);
    };

    const handleRemoveOption = (indexToRemove) => {
        setOptions(options.filter((_, index) => index !== indexToRemove));
    };

    const handleOptionTextChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleOptionCorrectChange = (index, isChecked) => {
        if (qType === 'single') {
            const newOptions = options.map((opt, i) => ({
                ...opt,
                isCorrect: i === index ? true : false
            }));
            setOptions(newOptions);
        } else {
            const newOptions = [...options];
            newOptions[index].isCorrect = isChecked;
            setOptions(newOptions);
        }
    };

    const handleTypeChange = (newType) => {
        setQType(newType);
        if (newType === 'single') {
            let foundCorrect = false;
            const newOptions = options.map(opt => {
                if (opt.isCorrect && !foundCorrect) {
                    foundCorrect = true;
                    return opt;
                }
                return { ...opt, isCorrect: false };
            });
            setOptions(newOptions);
        }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();

        const hasCorrect = options.some(opt => opt.isCorrect);
        if (!hasCorrect) {
            return alert('Выберите хотя бы один правильный вариант ответа!');
        }

        const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_text: qText,
                question_type: qType,
                image: qImage,
                time_limit: qTime,
                options
            })
        });

        if (res.ok) {
            setAddedQuestionsCount(prev => prev + 1);
            setQText('');
            setQImage('');
            setOptions([
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ]);

            const fileInput = document.getElementById('quiz-file-input');
            if (fileInput) fileInput.value = '';
        }
    };

    const handleFinishQuiz = () => {
        if (addedQuestionsCount === 0) {
            const confirmExit = window.confirm('Вы не добавили ни одного вопроса. Точно выйти без сохранения вопросов?');
            if (!confirmExit) return;
        }
        setQuizId(null);
        if (onFinish) onFinish();
    };

    return (
        <div className="quiz-creator-container">
            {!quizId ? (
                <form onSubmit={handleCreateQuiz}>
                    <label className="label-dim">Название квиза:</label>
                    <input type="text" className="neon-input" value={title} onChange={e => setTitle(e.target.value)} required />

                    <label className="label-dim margin-top">Категория (тег):</label>
                    <input type="text" className="neon-input" value={category} onChange={e => setCategory(e.target.value)} required />

                    <button type="submit" className="btn-neon">Создать основу квиза</button>
                </form>
            ) : (
                <form onSubmit={handleAddQuestion} className="form-container">
                    <div className="header-row">
                        <h4 className="header-title">Вопрос №{addedQuestionsCount + 1}</h4>
                        <span className="badge">
                            Уже добавлено: {addedQuestionsCount} шт.
                        </span>
                    </div>

                    <label className="label-main">Текст вопроса:</label>
                    <textarea className="neon-input" rows="2" value={qText} onChange={e => setQText(e.target.value)} required />

                    <div className="file-input-container">
                        <label className="label-block">
                            Загрузить картинку к вопросу:
                        </label>
                        <input id="quiz-file-input" type="file" className="file-input-hidden" accept="image/*" onChange={handleFileChange} />
                        <label htmlFor="quiz-file-input" className={`btn-file-neon ${qImage ? 'file-selected' : ''}`}>
                            {qImage ? 'Картинка успешно загружена' : 'ВЫБРАТЬ КАРТИНКУ ВОПРОСА'}
                        </label>
                    </div>

                    {qImage && (
                        <div className="preview-container">
                            <div className="image-wrapper">
                                <img src={qImage} alt="Превью" className="preview-image" />
                            </div>
                            <button
                                type="button"
                                className="btn-neon delete-image-btn"
                                onClick={() => {
                                    setQImage('');
                                    const fileInput = document.getElementById('quiz-file-input');
                                    if (fileInput) fileInput.value = '';
                                }}
                            >
                                Удалить картинку
                            </button>
                        </div>
                    )}

                    <div className="flex-row">
                        <div className="flex-item">
                            <label className="label-main">Тип выбора:</label>
                            <select className="neon-input margin-zero" value={qType} onChange={e => handleTypeChange(e.target.value)}>
                                <option value="single">Один правильный</option>
                                <option value="multiple">Несколько правильных</option>
                            </select>
                        </div>
                        <div className="time-input-width">
                            <label className="label-main">Время (сек):</label>
                            <input type="number" className="neon-input margin-zero" value={qTime} onChange={e => setQTime(Number(e.target.value))} required min="5" />
                        </div>
                    </div>

                    <div className="options-section">
                        <label className="label-neon-blue">Варианты ответа (отметьте правильные):</label>
                        {options.map((opt, i) => (
                            <div key={i} className="option-row">
                                <input
                                    type={qType === 'single' ? 'radio' : 'checkbox'}
                                    checked={opt.isCorrect}
                                    onChange={e => handleOptionCorrectChange(i, e.target.checked)}
                                    className="checkbox"
                                />
                                <input
                                    type="text"
                                    className="neon-input margin-zero-flex"
                                    placeholder={`Вариант ${i + 1}`}
                                    value={opt.text}
                                    onChange={e => handleOptionTextChange(i, e.target.value)}
                                    required
                                />
                                {options.length > 2 && (
                                    <button type="button" onClick={() => handleRemoveOption(i)} className="remove-option-btn">✖</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={handleAddOption} className="btn-neon add-option-btn">
                            + Добавить вариант
                        </button>
                    </div>

                    <button type="submit" className="base-custom-btn btn-add-question">
                        ДОБАВИТЬ ЭТОТ ВОПРОС В КВИЗ
                    </button>

                    <button type="button" onClick={handleFinishQuiz} className="base-custom-btn btn-finish-quiz">
                        СОХРАНИТЬ КВИЗ
                    </button>
                </form>
            )}
        </div>
    );
}

export default QuizCreator;