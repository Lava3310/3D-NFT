import { initTheme, initModal, initNotifications, initBalanceSimulation } from './utils.js';

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initModal('settingsBtn', 'settingsModal', 'closeSettings');
    initNotifications('notifToggle');
    initBalanceSimulation('balance', 'estimatedValue', 125, 1250);
    
    // Назад
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'main.html';
    });
    
    // Подключение кошелька
    const connectPanel = document.getElementById('connectPanel');
    const walletInput = document.getElementById('walletInput');
    const connectSubmit = document.getElementById('connectSubmit');
    const walletDisplay = document.getElementById('walletDisplay');
    
    connectSubmit.addEventListener('click', () => {
        const walletAddress = walletInput.value.trim();
        if (walletAddress) {
            walletDisplay.textContent = walletAddress;
            connectPanel.style.display = 'none';
        } else {
            alert('Введите адрес кошелька');
        }
    });
    
    // Редактирование имени
    const editBtn = document.getElementById('editProfileBtn');
    const userName = document.getElementById('userName');
    
    editBtn.addEventListener('click', () => {
        const newName = prompt('Введите новое имя пользователя:', userName.textContent);
        if (newName) {
            userName.textContent = newName;
        }
    });
    
    // Кнопки действий
    document.getElementById('depositBtn').addEventListener('click', () => {
        alert('💰 Пополнение скоро будет доступно');
    });
    
    document.getElementById('withdrawBtn').addEventListener('click', () => {
        alert('💸 Вывод средств скоро будет доступен');
    });
    
    document.getElementById('termsBtn').addEventListener('click', () => {
        alert('📋 Условия использования:\n\n• Создавайте уникальные кубы\n• Участвуйте в аукционах\n• Зарабатывайте TON');
        document.getElementById('settingsModal').classList.remove('show');
    });
    
    // Добавление новой истории
    setTimeout(() => {
        const historyList = document.getElementById('historyList');
        const newItem = document.createElement('div');
        newItem.className = 'history-item';
        newItem.innerHTML = `
            <div class="history-icon">🎁</div>
            <div class="history-details">
                <div class="history-action">Ежедневный бонус</div>
                <div class="history-time">только что</div>
            </div>
            <div class="history-value">+10 TON</div>
        `;
        historyList.prepend(newItem);
    }, 5000);
});