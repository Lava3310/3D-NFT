// js/main.js
import { auth } from './auth.js';
import { supabase } from './supabase.js';

// ============================================
// DOM ЭЛЕМЕНТЫ
// ============================================

const loadingScreen = document.getElementById('loading-screen');
const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('telegram-login-btn');
const logoutBtn = document.getElementById('logoutBtn');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const themeToggle = document.getElementById('themeToggle');
const expandBtn = document.getElementById('expandBtn');
const expandedContent = document.getElementById('expandedContent');

// ============================================
// ТЕМЫ
// ============================================

const themes = ['dark', 'light', 'ultra'];
let themeIndex = 0;

function setTheme(index) {
    document.body.className = themes[index];
    const icons = { dark: '🌙', light: '☀️', ultra: '⚫' };
    if (themeToggle) themeToggle.textContent = icons[themes[index]];
    localStorage.setItem('theme', themes[index]);
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        const idx = themes.indexOf(saved);
        if (idx !== -1) {
            themeIndex = idx;
            setTheme(themeIndex);
        }
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        themeIndex = (themeIndex + 1) % themes.length;
        setTheme(themeIndex);
        auth.hapticFeedback('light');
    });
}

// ============================================
// РАСКРЫТИЕ ПАНЕЛИ
// ============================================

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
            const icon = expandBtn?.querySelector('i');
            if (icon) icon.style.transform = 'rotate(180deg)';
        }, 10);
    } else {
        if (expandedContent) expandedContent.classList.remove('open');
        const icon = expandBtn?.querySelector('i');
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
        auth.hapticFeedback('light');
    });
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

async function init() {
    console.log('🚀 Initializing app...');
    
    // Инициализируем тему
    initTheme();
    
    // Проверяем, есть ли сохраненный пользователь
    const savedUser = auth.getLocalUser();
    
    if (savedUser) {
        console.log('📦 Found saved user:', savedUser.first_name);
        await loadApp(savedUser);
    } else {
        console.log('👋 No saved user, showing login screen');
        showLoginScreen();
    }
}

// ============================================
// ЗАГРУЗКА ПРИЛОЖЕНИЯ
// ============================================

async function loadApp(user) {
    console.log('🎮 Loading app for user:', user.first_name);
    
    // Скрываем загрузку и вход, показываем приложение
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContent) appContent.classList.remove('hidden');
    
    // Обновляем UI данными пользователя
    updateUserUI(user);
    
    // Подгружаем остальные данные
    await loadUserData(user);
    
    // Устанавливаем слушатель на изменение пользователя
    auth.addListener((updatedUser) => {
        if (updatedUser) {
            updateUserUI(updatedUser);
        }
    });
}

// ============================================
// ОБНОВЛЕНИЕ UI ПОЛЬЗОВАТЕЛЯ
// ============================================

function updateUserUI(user) {
    // Имя пользователя
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.first_name || 'Пользователь';
    }
    
    // Telegram username
    const userTagEl = document.getElementById('userTag');
    if (userTagEl) {
        userTagEl.textContent = user.username ? `@${user.username}` : '@user';
    }
    
    // Аватар
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        if (user.avatar) {
            avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.first_name}">`;
        } else {
            avatarEl.innerHTML = '<i class="fas fa-user-astronaut"></i>';
        }
    }
    
    // Дата регистрации
    const regDateEl = document.getElementById('regDateValue');
    if (regDateEl && user.created_at) {
        const date = new Date(user.created_at);
        regDateEl.textContent = date.toLocaleDateString('ru-RU');
    }
    
    // Кошелек
    const walletEl = document.getElementById('walletValue');
    const walletCard = document.getElementById('walletCard');
    
    if (walletEl) {
        if (user.wallet) {
            walletEl.textContent = `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`;
            if (walletCard) walletCard.classList.add('hidden');
        } else {
            walletEl.textContent = 'не подключён';
            if (walletCard) walletCard.classList.remove('hidden');
        }
    }
}

// ============================================
// ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ
// ============================================

async function loadUserData(user) {
    console.log('📊 Loading user data...');
    
    // Загружаем кубы пользователя
    await loadUserCubes(user.id);
    
    // Загружаем воксели пользователя
    await loadUserVoxels(user.id);
}

async function loadUserCubes(userId) {
    const cubeList = document.getElementById('cubeList');
    if (!cubeList) return;
    
    try {
        const { data: cubes, error } = await supabase
            .from('cubes')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading cubes:', error);
            cubeList.innerHTML = '<p class="placeholder-text">❌ Ошибка загрузки кубов</p>';
            return;
        }
        
        if (!cubes || cubes.length === 0) {
            cubeList.innerHTML = `
                <div class="placeholder-text">
                    <i class="fas fa-cube"></i>
                    <p>У вас пока нет кубов</p>
                    <small>Создайте свой первый куб!</small>
                </div>
            `;
            return;
        }
        
        cubeList.innerHTML = cubes.map(cube => renderCubeCard(cube)).join('');
        
        // Добавляем обработчики на кнопки
        attachCubeEventListeners();
        
    } catch (error) {
        console.error('Error in loadUserCubes:', error);
        cubeList.innerHTML = '<p class="placeholder-text">❌ Ошибка загрузки кубов</p>';
    }
}

async function loadUserVoxels(userId) {
    const voxelList = document.getElementById('voxelList');
    if (!voxelList) return;
    
    try {
        const { data: voxels, error } = await supabase
            .from('voxels')
            .select('*')
            .eq('owner_id', userId);
        
        if (error) {
            console.error('Error loading voxels:', error);
            voxelList.innerHTML = '<p class="placeholder-text">❌ Ошибка загрузки вокселей</p>';
            return;
        }
        
        if (!voxels || voxels.length === 0) {
            voxelList.innerHTML = `
                <div class="placeholder-text">
                    <i class="fas fa-dice-d6"></i>
                    <p>У вас пока нет вокселей</p>
                    <small>Купите в магазине или откройте кейс</small>
                </div>
            `;
            return;
        }
        
        voxelList.innerHTML = voxels.map(voxel => renderVoxelCard(voxel)).join('');
        
    } catch (error) {
        console.error('Error in loadUserVoxels:', error);
        voxelList.innerHTML = '<p class="placeholder-text">❌ Ошибка загрузки вокселей</p>';
    }
}

// ============================================
// РЕНДЕРИНГ КАРТОЧЕК
// ============================================

function renderCubeCard(cube) {
    return `
        <div class="cube-card" data-cube-id="${cube.id}">
            <div class="cube-preview">
                <i class="fas fa-${cube.is_minted ? 'gem' : 'cube'}"></i>
            </div>
            <div class="cube-info">
                <div class="cube-header">
                    <h4>${escapeHtml(cube.name)}</h4>
                    <div class="owner-badge">
                        <i class="fas fa-user"></i>
                        <span>Вы</span>
                    </div>
                </div>
                <div class="cube-stats">
                    <div class="stat-item">
                        <i class="fas fa-expand-alt"></i>
                        <span class="stat-label">Размер</span>
                        <span class="stat-value">${cube.size}³</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-fill-drip"></i>
                        <span class="stat-label">Заполн.</span>
                        <span class="stat-value">${cube.filled_voxels || 0}/${cube.total_voxels || 512}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-star"></i>
                        <span class="stat-label">Статус</span>
                        <span class="stat-value">${cube.rarity || 1}/10</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-coins"></i>
                        <span class="stat-label">Цена</span>
                        <span class="stat-value">${cube.price ? cube.price + ' TON' : '—'}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-chart-line"></i>
                        <span class="stat-label">Оценка</span>
                        <span class="stat-value">${cube.estimated_value ? cube.estimated_value + ' TON' : '—'}</span>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" data-cube-id="${cube.id}" title="Просмотр">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn history-btn" data-cube-id="${cube.id}" title="История">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </div>
                <div class="cube-actions">
                    ${!cube.is_minted ? `
                        <button class="cube-btn mint-btn" data-cube-id="${cube.id}">
                            <i class="fas fa-gem"></i> Минт
                        </button>
                        <button class="cube-btn edit-btn" data-cube-id="${cube.id}">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                    ` : `
                        <button class="cube-btn sell-btn" data-cube-id="${cube.id}">
                            <i class="fas fa-tag"></i> Продать
                        </button>
                        <button class="cube-btn transfer-btn" data-cube-id="${cube.id}">
                            <i class="fas fa-exchange-alt"></i> Передать
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

function renderVoxelCard(voxel) {
    const voxelNames = {
        'stone': 'Камень',
        'wood': 'Древесина',
        'iron': 'Железо',
        'gold': 'Золото',
        'diamond': 'Алмаз',
        'emerald': 'Изумруд',
        'crystal': 'Кристалл'
    };
    
    const voxelIcons = {
        'stone': 'mountain',
        'wood': 'tree',
        'iron': 'shield',
        'gold': 'crown',
        'diamond': 'gem',
        'emerald': 'leaf',
        'crystal': 'star'
    };
    
    const name = voxelNames[voxel.type] || voxel.type;
    const icon = voxelIcons[voxel.type] || 'cube';
    const pricePerUnit = voxel.price_per_unit || 0.01;
    const totalValue = (voxel.quantity * pricePerUnit).toFixed(2);
    const rarityClass = voxel.rarity >= 8 ? 'legendary' : (voxel.rarity >= 5 ? 'rare' : 'common');
    
    return `
        <div class="voxel-card">
            <div class="voxel-preview">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="voxel-info">
                <div class="voxel-header">
                    <h4>${name}</h4>
                </div>
                <div class="voxel-stats-grid">
                    <div class="voxel-stat">
                        <i class="fas fa-cubes"></i>
                        <span class="stat-label">Количество</span>
                        <span class="stat-value">${voxel.quantity} шт</span>
                    </div>
                    <div class="voxel-stat">
                        <i class="fas fa-tag"></i>
                        <span class="stat-label">Цена/шт</span>
                        <span class="stat-value">${pricePerUnit} TON</span>
                    </div>
                    <div class="voxel-stat">
                        <i class="fas fa-coins"></i>
                        <span class="stat-label">Общая стоимость</span>
                        <span class="stat-value accent">${totalValue} TON</span>
                    </div>
                    <div class="voxel-stat">
                        <i class="fas fa-star"></i>
                        <span class="stat-label">Редкость</span>
                        <span class="stat-value rarity-value ${rarityClass}">${voxel.rarity || 1}/10</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// ОБРАБОТЧИКИ КНОПОК
// ============================================

function attachCubeEventListeners() {
    // Кнопки просмотра
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cubeId = btn.dataset.cubeId;
            auth.hapticFeedback('light');
            alert(`Просмотр куба ${cubeId}`);
        });
    });
    
    // Кнопки истории
    document.querySelectorAll('.history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cubeId = btn.dataset.cubeId;
            auth.hapticFeedback('light');
            alert(`История куба ${cubeId}`);
        });
    });
    
    // Кнопки минта
    document.querySelectorAll('.mint-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const cubeId = btn.dataset.cubeId;
            auth.hapticFeedback('medium');
            
            if (confirm('Заминтить этот куб? Это действие нельзя отменить.')) {
                try {
                    const { error } = await supabase
                        .from('cubes')
                        .update({ is_minted: true, minted_at: new Date() })
                        .eq('id', cubeId);
                    
                    if (error) throw error;
                    
                    auth.showPopup('Успех', 'Куб успешно заминчен!');
                    await loadUserCubes(auth.currentUser.id);
                } catch (error) {
                    console.error('Error minting cube:', error);
                    auth.showPopup('Ошибка', 'Не удалось заминтить куб');
                }
            }
        });
    });
    
    // Кнопки редактирования
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cubeId = btn.dataset.cubeId;
            auth.hapticFeedback('light');
            alert(`Редактирование куба ${cubeId}`);
        });
    });
    
    // Кнопки продажи
    document.querySelectorAll('.sell-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cubeId = btn.dataset.cubeId;
            auth.hapticFeedback('light');
            const price = prompt('Введите цену в TON:');
            if (price && !isNaN(parseFloat(price))) {
                alert(`Куб ${cubeId} выставлен на продажу за ${price} TON`);
            }
        });
    });
    
    // Кнопки передачи
    document.querySelectorAll('.transfer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cubeId = btn.dataset.cubeId;
            auth.hapticFeedback('light');
            const address = prompt('Введите адрес кошелька получателя:');
            if (address && address.length > 10) {
                alert(`Куб ${cubeId} передан на адрес ${address.slice(0, 6)}...${address.slice(-4)}`);
            }
        });
    });
}

// ============================================
// ПОКАЗАТЬ ЭКРАН ВХОДА
// ============================================

function showLoginScreen() {
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appContent) appContent.classList.add('hidden');
}

// ============================================
// ОБРАБОТЧИК ВХОДА
// ============================================

async function handleLogin() {
    console.log('🔐 Login button clicked');
    
    if (loginError) loginError.classList.add('hidden');
    
    const originalText = loginBtn?.innerHTML;
    if (loginBtn) {
        loginBtn.innerHTML = '<div class="spinner"></div> Подключение...';
        loginBtn.disabled = true;
    }
    
    try {
        const user = await auth.login();
        console.log('✅ Login successful:', user.first_name);
        await loadApp(user);
        auth.hapticFeedback('success');
    } catch (error) {
        console.error('❌ Login failed:', error);
        
        let errorMessage = 'Ошибка подключения';
        if (error.message === 'OPEN_IN_TELEGRAM') {
            errorMessage = '❌ Откройте приложение в Telegram';
        } else if (error.message === 'Failed to create user') {
            errorMessage = '❌ Ошибка создания пользователя';
        }
        
        if (loginError) {
            loginError.textContent = errorMessage;
            loginError.classList.remove('hidden');
        }
        
        auth.hapticFeedback('error');
        
        if (loginBtn) {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }
}

// ============================================
// ВЫХОД ИЗ АККАУНТА
// ============================================

async function handleLogout() {
    auth.hapticFeedback('light');
    if (confirm('Выйти из аккаунта?')) {
        auth.logout();
        showLoginScreen();
    }
}

// ============================================
// ПОДКЛЮЧЕНИЕ КОШЕЛЬКА
// ============================================

async function handleConnectWallet() {
    auth.hapticFeedback('light');
    const walletAddress = prompt('Введите адрес TON кошелька:');
    
    if (walletAddress && walletAddress.length > 10) {
        try {
            await auth.updateWallet(walletAddress);
            auth.showPopup('Успех', 'Кошелек успешно подключен!');
            auth.hapticFeedback('success');
            
            const user = await auth.getCurrentUser();
            if (user) updateUserUI(user);
            
            const walletCard = document.getElementById('walletCard');
            if (walletCard) walletCard.classList.add('hidden');
        } catch (error) {
            auth.showPopup('Ошибка', 'Не удалось подключить кошелек');
            auth.hapticFeedback('error');
        }
    }
}

// ============================================
// НАВИГАЦИЯ ПО СТРАНИЦАМ
// ============================================

function showPage(pageId) {
    const pages = ['home', 'market', 'quests', 'games'];
    pages.forEach(p => {
        const page = document.getElementById(`${p}Page`);
        if (page) page.classList.remove('active');
    });
    
    const activePage = document.getElementById(`${pageId}Page`);
    if (activePage) activePage.classList.add('active');
    
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageId) {
            btn.classList.add('active');
        }
    });
    
    auth.hapticFeedback('light');
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================
// НАВЕШИВАНИЕ ОБРАБОТЧИКОВ
// ============================================

function bindEvents() {
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (connectWalletBtn) connectWalletBtn.addEventListener('click', handleConnectWallet);
    
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            if (pageId) showPage(pageId);
        });
    });
}

// ============================================
// ЗАПУСК
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM loaded, initializing...');
    
    bindEvents();
    await init();
});