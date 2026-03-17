import { initTheme, initModal, initNotifications, initBalanceSimulation } from './utils.js';
import { loadUser } from './auth.js';

// ===== Элементы =====
const navItems = document.querySelectorAll('.nav-item');
const contents = {
    home: document.getElementById('homeContent'),
    top: document.getElementById('topContent'),
    market: document.getElementById('marketContent'),
    auction: document.getElementById('auctionContent'),
    events: document.getElementById('eventsContent')
};

// ===== Загрузка пользователя =====
const userId = localStorage.getItem('userId');
if (!userId) {
    console.log('Нет userId, редирект на вход');
    window.location.href = 'index.html';
} else {
    loadUser(userId).then(user => {
        if (user) {
            const balanceEl = document.getElementById('balance');
            if (balanceEl) balanceEl.textContent = user.balance_ton;
        }
    });
}

// ===== Переключение вкладок =====
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        Object.values(contents).forEach(c => {
            if (c) c.style.display = 'none';
        });

        const tab = item.dataset.tab;
        if (contents[tab]) {
            contents[tab].style.display = 'block';
        }
    });
});

// ===== Инициализация при загрузке =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initModal('settingsBtn', 'settingsModal', 'closeSettings');
    initNotifications('notifToggle');
    initBalanceSimulation('balance', 'estimatedValue', 125, 1250);
    
    const depositBtn = document.getElementById('depositBtn');
    if (depositBtn) {
        depositBtn.addEventListener('click', () => {
            alert('💰 Пополнение скоро будет доступно');
        });
    }
    
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            alert('💸 Вывод средств скоро будет доступен');
        });
    }
    
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = 'userprofile.html';
        });
    }
    
    const termsBtn = document.getElementById('termsBtn');
    if (termsBtn) {
        termsBtn.addEventListener('click', () => {
            alert('📋 Условия использования:\n\n• Создавайте уникальные кубы\n• Участвуйте в аукционах\n• Зарабатывайте TON');
            const modal = document.getElementById('settingsModal');
            if (modal) modal.classList.remove('show');
        });
    }
});