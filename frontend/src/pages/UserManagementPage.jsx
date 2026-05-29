import React from 'react';
import { useNavigate } from 'react-router-dom';
import SuperadminPanel from '../components/SuperadminPanel';
import './UserManagementPage.css';

function UserManagementPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('neon_user'));

    if (!user || user.role !== 'superadmin') {
        return (
            <div className="app-container">
                <div className="neon-card superadmin-denied-box">
                    <p className="superadmin-denied-text">
                        Доступ запрещен.<br />Требуются права суперадминистратора.
                    </p>
                    <button className="btn-neon btn-denied-back" onClick={() => navigate('/dashboard')}>
                        В МЕНЮ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="neon-card superadmin-card">
                <div className="superadmin-header">
                    <h2 className="superadmin-title">
                        УПРАВЛЕНИЕ РОЛЯМИ
                    </h2>
                    <button
                        className="btn-neon btn-superadmin-back"
                        onClick={() => navigate('/dashboard')}
                    >
                        В МЕНЮ
                    </button>
                </div>

                <div className="scroll-container superadmin-scroll-body">
                    <SuperadminPanel />
                </div>
            </div>
        </div>
    );
}

export default UserManagementPage;