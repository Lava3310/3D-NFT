import { initTheme } from './utils.js';
import { initTelegramWidget } from './auth.js';

// ===== Инициализация при загрузке =====
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем тему
    initTheme();
    
    // Инициализируем виджет Telegram
    initTelegramWidget();
});