import { initTheme } from './utils.js';
import { handleTelegramLogin, loginUser } from './auth.js';

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    
    // ===== Проверяем, не вернулись ли мы с OAuth =====
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // Telegram может передать данные в query или hash
    const tgData = urlParams.get('tgAuthResult') || hashParams.get('tgAuthResult');

    if (tgData) {
        try {
            const user = JSON.parse(decodeURIComponent(tgData));
            await loginUser(user);
            return;
        } catch (e) {
            console.error('Ошибка при обработке OAuth:', e);
        }
    }
    
    // ===== Пытаемся получить данные из Telegram Mini App =====
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
        tg.expand();
        tg.ready();
        
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            console.log('Автовход из Telegram:', user);
            
            const telegramData = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                photo_url: user.photo_url
            };
            
            await loginUser(telegramData);
            return;
        }
    }
    
    // ===== Обычный вход через кнопку =====
    const loginBtn = document.getElementById('telegramLoginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            handleTelegramLogin();
        });
    }
});