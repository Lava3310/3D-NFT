// ===== Три темы =====
const themes = ['dark', 'light', 'ultra'];
let themeIndex = 0;
const themeBtn = document.getElementById('themeToggle');

function setTheme(index) {
    document.body.className = themes[index];
    const icons = ['🌙', '☀️', '⚫'];
    themeBtn.textContent = icons[index];
    localStorage.setItem('theme', themes[index]);
}

if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        themeIndex = (themeIndex + 1) % themes.length;
        setTheme(themeIndex);
    });
}

const saved = localStorage.getItem('theme');
if (saved) {
    const idx = themes.indexOf(saved);
    if (idx !== -1) {
        themeIndex = idx;
        setTheme(themeIndex);
    }
}

// ===== Раскрытие панели =====
const expandBtn = document.getElementById('expandBtn');
const expandedContent = document.getElementById('expandedContent');
const topBar = document.getElementById('topBar');
let isExpanded = false;

if (expandedContent) {
    expandedContent.style.display = 'none';
}

function setExpanded(state) {
    isExpanded = state;
    if (isExpanded) {
        if (expandedContent) expandedContent.style.display = '';
        setTimeout(() => {
            if (expandedContent) expandedContent.classList.add('open');
            if (topBar) topBar.classList.add('expanded');
            const icon = expandBtn ? expandBtn.querySelector('i') : null;
            if (icon) icon.style.transform = 'rotate(180deg)';
        }, 10);
    } else {
        if (expandedContent) expandedContent.classList.remove('open');
        if (topBar) topBar.classList.remove('expanded');
        const icon = expandBtn ? expandBtn.querySelector('i') : null;
        if (icon) icon.style.transform = 'rotate(0deg)';
        
        if (expandedContent) {
            expandedContent.addEventListener('transitionend', function onTransitionEnd() {
                if (!isExpanded && expandedContent) {
                    expandedContent.style.display = 'none';
                }
                expandedContent.removeEventListener('transitionend', onTransitionEnd);
            });
        }
    }
}

if (expandBtn) {
    expandBtn.addEventListener('click', () => {
        setExpanded(!isExpanded);
    });
}

// Свайп
let touchStartY = 0;
let touchEndY = 0;

if (topBar) {
    topBar.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });

    topBar.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].clientY;
        const diff = touchEndY - touchStartY;
        if (diff > 30 && !isExpanded) {
            setExpanded(true);
        } else if (diff < -30 && isExpanded) {
            setExpanded(false);
        }
    });
}

// ===== Кнопки подключения =====
const telegramCard = document.getElementById('telegramCard');
const walletCard = document.getElementById('walletCard');
const connectTelegramBtn = document.getElementById('connectTelegramBtn');
const connectWalletBtn = document.getElementById('connectWalletBtn');

if (connectTelegramBtn) {
    connectTelegramBtn.addEventListener('click', () => {
        alert('Подключение Telegram через Telegram Login');
        if (telegramCard) telegramCard.remove();
        if (walletCard) walletCard.classList.remove('hidden');
    });
}

if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
        alert('TON Connect — скоро');
    });
}

// ===== Заглушки данных =====
function updateUI() {
    const userName = document.getElementById('userName');
    const userTag = document.getElementById('userTag');
    const balanceValue = document.getElementById('balanceValue');
    const cubesSlotsValue = document.getElementById('cubesSlotsValue');
    const estimatedValue = document.getElementById('estimatedValue');
    const walletValue = document.getElementById('walletValue');
    const regDateValue = document.getElementById('regDateValue');
    
    if (userName) userName.textContent = 'CryptoBuilder';
    if (userTag) userTag.textContent = '@cryptobuilder';
    if (balanceValue) balanceValue.textContent = '125 TON';
    if (cubesSlotsValue) cubesSlotsValue.textContent = '3 / 8';
    if (estimatedValue) estimatedValue.textContent = '~1 250 TON';
    if (walletValue) walletValue.textContent = 'не подключён';
    if (regDateValue) regDateValue.textContent = '21 мар 2026';
}
updateUI();

// ===== Кнопки профиля =====
const editProfileBtn = document.getElementById('editProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');

if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        alert('Редактирование профиля');
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Выйти из аккаунта?')) {
            localStorage.clear();
            window.location.reload();
        }
    });
}

// ===== Кнопки кубов =====
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = e.target.closest('.cube-card');
        const cubeName = card ? card.querySelector('h4').textContent : 'куб';
        alert(`Просмотр ${cubeName}`);
    });
});

document.querySelectorAll('.owners-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = e.target.closest('.cube-card');
        const cubeName = card ? card.querySelector('h4').textContent : 'куб';
        alert(`Владельцы ${cubeName}: CryptoBuilder (100%)`);
    });
});

document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = e.target.closest('.cube-card');
        const cubeName = card ? card.querySelector('h4').textContent : 'куб';
        alert(`Редактирование ${cubeName}`);
    });
});

document.querySelectorAll('.mint-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = e.target.closest('.cube-card');
        const cubeName = card ? card.querySelector('h4').textContent : 'куб';
        if (confirm(`Заминтить ${cubeName}? Это действие нельзя отменить.`)) {
            alert(`Куб ${cubeName} отправлен на минт!`);
        }
    });
});

// ===== Переключение страниц с анимацией =====
const pages = {
    home: document.getElementById('homePage'),
    market: document.getElementById('marketPage'),
    quests: document.getElementById('questsPage'),
    games: document.getElementById('gamesPage')
};

const navBtns = document.querySelectorAll('.nav-btn');

function showPage(pageId) {
    // Анимация нажатия на кнопку
    const activeBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
    if (activeBtn) {
        activeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            activeBtn.style.transform = '';
        }, 150);
    }
    
    // Переключение страниц
    Object.keys(pages).forEach(key => {
        if (pages[key]) {
            pages[key].classList.remove('active');
        }
    });
    
    if (pages[pageId]) {
        pages[pageId].classList.add('active');
    }
    
    // Обновление активной кнопки
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });
}

// Добавляем обработчики
navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = btn.getAttribute('data-page');
        if (pageId) {
            showPage(pageId);
        }
    });
});

// ===== Переключение вкладок маркета =====
const marketTabs = document.querySelectorAll('.market-tab');
const marketContents = {
    nft: document.getElementById('marketNFT'),
    voxels: document.getElementById('marketVoxels'),
    auction: document.getElementById('marketAuction'),
    shop: document.getElementById('marketShop'),
    cases: document.getElementById('marketCases')
};

function showMarketTab(tabId) {
    // Анимация контента
    Object.values(marketContents).forEach(content => {
        if (content && content.classList.contains('active')) {
            content.style.animation = 'none';
            content.offsetHeight;
            content.style.animation = '';
        }
        if (content) content.classList.remove('active');
    });
    
    if (marketContents[tabId]) {
        marketContents[tabId].classList.add('active');
    }
    
    // Обновление активной вкладки с анимацией
    marketTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-market-tab') === tabId) {
            // Эффект нажатия
            tab.style.transform = 'scale(0.98)';
            setTimeout(() => {
                tab.style.transform = '';
            }, 150);
            tab.classList.add('active');
        }
    });
}

// Добавляем обработчики на вкладки
if (marketTabs.length > 0) {
    marketTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-market-tab');
            if (tabId) {
                showMarketTab(tabId);
            }
        });
    });
}

// Инициализация активной вкладки
setTimeout(() => {
    const activeTab = document.querySelector('.market-tab.active');
    if (!activeTab && marketTabs.length > 0) {
        showMarketTab('nft');
    }
}, 100);