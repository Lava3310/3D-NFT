import { initTheme } from './utils.js';
import { initTelegramWidget, loginUser } from './auth.js';

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    
    // ===== Пытаемся получить данные из Telegram Mini App =====
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
        tg.expand(); // растягиваем на весь экран
        tg.ready();  // говорим Telegram, что приложение готово
        
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            console.log('Автовход из Telegram:', user);
            
            // Преобразуем данные в нужный формат
            const telegramData = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                photo_url: user.photo_url
            };
            
            // Выполняем вход
            await loginUser(telegramData);
            return; // после входа дальше не идём
        }
    }
    
    // Если не в Telegram или нет данных — показываем виджет
    console.log('Не в Telegram Mini App, показываем виджет');
    initTelegramWidget();
       // ===== Настраиваем кнопку =====
    const customBtn = document.getElementById('customLoginBtn');
    const widgetContainer = document.getElementById('telegram-login-container');
    
    if (customBtn && widgetContainer) {
        // При клике на нашу кнопку эмулируем клик по iframe виджета
        customBtn.addEventListener('click', () => {
            const iframe = widgetContainer.querySelector('iframe');
            if (iframe) {
                // Создаём событие клика
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                iframe.dispatchEvent(event);
            }
        });
    }
});