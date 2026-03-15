// main.js — логика основного приложения

// Состояние
let currentScreen = 'home';
let isDarkTheme = true;

// DOM элементы
const content = document.getElementById('content');
const navBtns = document.querySelectorAll('.nav-btn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const themeToggle = document.getElementById('themeToggle');

// ===== ЭКРАНЫ (временные заглушки) =====

const screens = {
    auction: '<div class="screen-placeholder"><h2>Аукцион</h2><p>Скоро здесь будут лоты</p></div>',
    top: '<div class="screen-placeholder"><h2>Топ</h2><p>Лидеры появятся позже</p></div>',
    home: `
        <div class="screen-placeholder">
            <h2>Мои 3D NFT</h2>
            <p>У вас пока нет кубов</p>
            <button class="action-btn" onclick="window.location.href='editor.html'">Создать первый куб</button>
        </div>
    `,
    market: '<div class="screen-placeholder"><h2>Маркет</h2><p>Магазин откроется скоро</p></div>',
    events: '<div class="screen-placeholder"><h2>События</h2><p>Задания и игры в разработке</p></div>'
};

// ===== ФУНКЦИИ =====

// Показать экран
function showScreen(screenName) {
    currentScreen = screenName;
    
    // Обновить контент
    content.innerHTML = screens[screenName] || screens.home;
    
    // Обновить активную кнопку
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.screen === screenName) {
            btn.classList.add('active');
        }
    });
}

// ===== ОБРАБОТЧИКИ =====

// Навигация
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        showScreen(btn.dataset.screen);
    });
});

// Настройки
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('show');
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

// Закрыть модалку по клику вне
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
    }
});

// Переключение темы
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    isDarkTheme = !isDarkTheme;
    themeToggle.textContent = isDarkTheme ? '🌙 Тёмная' : '☀️ Светлая';
});

// Обновить страницу
document.getElementById('refreshBtn').addEventListener('click', () => {
    location.reload();
});

// Профиль
document.getElementById('profileBtn').addEventListener('click', () => {
    alert('Профиль в разработке');
});

// Условия
document.getElementById('termsBtn').addEventListener('click', () => {
    alert('Условия использования:\n1. Будьте классными\n2. Создавайте крутые кубы\n3. Зарабатывайте TON');
});

// Имитация баланса (для теста)
setInterval(() => {
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        const randomChange = (Math.random() * 10).toFixed(2);
        balanceEl.textContent = (125 + parseFloat(randomChange)).toFixed(2) + ' TON';
    }
    
    const estimatedEl = document.getElementById('estimatedValue');
    if (estimatedEl) {
        const randomEst = (Math.random() * 500 + 1000).toFixed(0);
        estimatedEl.textContent = '~ ' + randomEst + ' TON';
    }
}, 15000);

// Показать главную при загрузке
showScreen('home');