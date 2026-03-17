import { initTheme, initModal, initNotifications, initBalanceSimulation } from './utils.js';
import { loadUser } from './auth.js';

// ===== Supabase клиент =====
import { createSupabaseClient } from './utils.js';

const SUPABASE_URL = 'https://kkellolonnuyqdfngmzk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sB1ZOY6NKpznS8on4tWKgw_JdMV5EXt';

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ID пользователя =====
const userId = localStorage.getItem('userId');
if (!userId) {
    window.location.href = 'index.html';
}

// ===== Список доступных эмодзи для аватара =====
const avatarEmojis = ['👤', '😎', '🦸', '🐉', '🚀', '🌟', '🎮', '💎', '🔥', '🌈'];

// ===== Состояние редактирования =====
let isEditing = false;

// ===== Загрузка профиля =====
async function loadProfile() {
    const user = await loadUser(userId);
    if (!user) {
        alert('Ошибка загрузки профиля');
        return;
    }

    // Основные данные
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userAvatar').textContent = user.avatar || '👤';
    document.getElementById('walletDisplay').textContent = user.wallet_address || 'Кошелёк не подключён';
    document.getElementById('balance').textContent = user.balance_ton || 0;

    // Дата регистрации
    const registerElement = document.getElementById('registerDate');
    if (registerElement) {
        const date = new Date(user.created_at).toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        registerElement.textContent = `На сайте с ${date}`;
    }

    // Оценочная стоимость
    document.getElementById('estimatedValue').textContent = user.balance_ton ? `${user.balance_ton * 10} TON` : '0 TON';

    // Скрываем панель кошелька, если он уже подключён
    if (user.wallet_address) {
        const connectPanel = document.getElementById('connectPanel');
        if (connectPanel) connectPanel.style.display = 'none';
    }
}

// ===== Редактирование имени =====
async function updateUserName(newName) {
    const { error } = await supabase
        .from('users')
        .update({ username: newName })
        .eq('id', userId);

    if (error) {
        console.error('Ошибка при обновлении имени:', error);
        alert('Не удалось обновить имя');
        return false;
    }

    localStorage.setItem('userName', newName);
    return true;
}

// ===== Редактирование кошелька =====
async function updateWallet(newWallet) {
    const { error } = await supabase
        .from('users')
        .update({ wallet_address: newWallet })
        .eq('id', userId);

    if (error) {
        console.error('Ошибка при обновлении кошелька:', error);
        alert('Не удалось обновить кошелёк');
        return false;
    }
    return true;
}

// ===== Редактирование аватара (эмодзи) =====
async function updateAvatar(newAvatar) {
    const { error } = await supabase
        .from('users')
        .update({ avatar: newAvatar })
        .eq('id', userId);

    if (error) {
        console.error('Ошибка при обновлении аватара:', error);
        alert('Не удалось обновить аватар');
        return false;
    }
    return true;
}

// ===== Показать выбор эмодзи =====
function showEmojiPicker() {
    const container = document.getElementById('emojiPicker');
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    
    avatarEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.onclick = async () => {
            const success = await updateAvatar(emoji);
            if (success) {
                document.getElementById('userAvatar').textContent = emoji;
                container.style.display = 'none';
                toggleEditMode(false);
            }
        };
        container.appendChild(btn);
    });
}

// ===== Включение/выключение режима редактирования =====
function toggleEditMode(enable) {
    isEditing = enable;
    
    const nameDisplay = document.getElementById('userName');
    const walletDisplay = document.getElementById('walletDisplay');
    const avatarDisplay = document.getElementById('userAvatar');
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    
    const nameInput = document.getElementById('editNameInput');
    const walletInput = document.getElementById('editWalletInput');
    const editActions = document.getElementById('editActions');
    
    if (enable) {
        nameDisplay.style.display = 'none';
        walletDisplay.style.display = 'none';
        avatarDisplay.style.display = 'none';
        if (editAvatarBtn) editAvatarBtn.style.display = 'none';
        
        nameInput.style.display = 'block';
        walletInput.style.display = 'block';
        editActions.style.display = 'flex';
        
        nameInput.value = nameDisplay.textContent;
        walletInput.value = walletDisplay.textContent === 'Кошелёк не подключён' ? '' : walletDisplay.textContent;
        
    } else {
        nameDisplay.style.display = 'block';
        walletDisplay.style.display = 'block';
        avatarDisplay.style.display = 'block';
        if (editAvatarBtn) editAvatarBtn.style.display = 'block';
        
        nameInput.style.display = 'none';
        walletInput.style.display = 'none';
        editActions.style.display = 'none';
        
        // Скрываем панель выбора эмодзи
        const emojiPicker = document.getElementById('emojiPicker');
        if (emojiPicker) emojiPicker.style.display = 'none';
    }
}

// ===== Сохранение изменений =====
async function saveChanges() {
    const nameInput = document.getElementById('editNameInput');
    const walletInput = document.getElementById('editWalletInput');
    
    const newName = nameInput.value.trim();
    const newWallet = walletInput.value.trim();
    
    let success = true;
    
    if (newName && newName !== document.getElementById('userName').textContent) {
        success = success && await updateUserName(newName);
    }
    
    if (newWallet && newWallet !== document.getElementById('walletDisplay').textContent) {
        success = success && await updateWallet(newWallet);
    }
    
    if (success) {
        if (newName) document.getElementById('userName').textContent = newName;
        if (newWallet) document.getElementById('walletDisplay').textContent = newWallet;
        
        toggleEditMode(false);
    }
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initModal('settingsBtn', 'settingsModal', 'closeSettings');
    initNotifications('notifToggle');
    initBalanceSimulation('balance', 'estimatedValue', 125, 1250);

    await loadProfile();

    // Кнопка назад
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'main.html';
        });
    }

    // Кнопка редактирования
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            toggleEditMode(!isEditing);
        });
    }

    // Кнопка редактирования аватара
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', showEmojiPicker);
    }

    // Кнопка сохранения
    const saveBtn = document.getElementById('saveEditBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveChanges);
    }

    // Кнопка отмены
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            toggleEditMode(false);
        });
    }

    // Кнопки действий
    document.getElementById('depositBtn')?.addEventListener('click', () => alert('💰 Пополнение скоро будет доступно'));
    document.getElementById('withdrawBtn')?.addEventListener('click', () => alert('💸 Вывод средств скоро будет доступен'));
    
    document.getElementById('termsBtn')?.addEventListener('click', () => {
        alert('📋 Условия использования:\n\n• Создавайте уникальные кубы\n• Участвуйте в аукционах\n• Зарабатывайте TON');
        document.getElementById('settingsModal')?.classList.remove('show');
    });

    // Демо-история
    setTimeout(() => {
        const historyList = document.getElementById('historyList');
        if (historyList) {
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
        }
    }, 5000);
});