import { initTheme } from './utils.js';
import { loginUser } from './auth.js';

// ===== Инициализация при загрузке =====
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем тему
    initTheme();
    
    // Настраиваем кнопку входа
    document.getElementById('loginBtn').addEventListener('click', () => {
        const telegramData = {
            id: Math.floor(Math.random() * 1000000),
            first_name: 'Crypto',
            last_name: 'Builder',
            username: 'cryptobuilder_' + Math.floor(Math.random() * 1000),
            photo_url: null
        };
        
        loginUser(telegramData);
    });
});