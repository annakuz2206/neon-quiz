import { io } from 'socket.io-client';

export const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    upgrade: false,
    autoConnect: true
});

socket.on('connect', () => {
    console.log('📶 Сокет успешно подключился к бэкенду! ID:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('🚨 Ошибка подключения сокета на фронтенде:', error);
});