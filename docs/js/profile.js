import { initTheme, initModal, initNotifications, initBalanceSimulation } from './utils.js';
import { loadUser } from './auth.js';

// ===== Supabase клиент =====
import { createSupabaseClient } from './utils.js';

const SUPABASE_URL = 'https://kkellolonnuyqdfngmzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZWxsb2xvbm51eXFkZm5nbXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTM4MjAsImV4cCI6MjA1NzY4OTgyMH0.KeR2F8hVeQZGe08ZbcF97gR8hTrvLWslbFv23vEClKc';

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ID пользователя =====
const userId = localStorage.getItem('userId');
if (!userId) {
    window.location.href = 'index.html';
}

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

// ===== Редактирование аватара =====
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

// ===== Включение/выключение режима редактирования =====
function toggleEditMode(enable) {
    isEditing = enable;
    
    const nameDisplay = document.getElementById('userName');
    const walletDisplay = document.getElementById('walletDisplay');
    const avatarDisplay = document.getElementById('userAvatar');
    
    const nameInput = document.getElementById('editNameInput');
    const walletInput = document.getElementById('editWalletInput');
    const avatarInput = document.getElementById('editAvatarInput');
    const editActions = document.getElementById('editActions');
    
    if (enable) {
        // Прячем текст, показываем поля ввода
        nameDisplay.style.display = 'none';
        walletDisplay.style.display = 'none';
        avatarDisplay.style.display = 'none';
        
        nameInput.style.display = 'block';
        walletInput.style.display = 'block';
        avatarInput.style.display = 'block';
        editActions.style.display = 'flex';
        
        // Заполняем поля текущими значениями
        nameInput.value = nameDisplay.textContent;
        walletInput.value = walletDisplay.textContent === 'Кошелёк не подключён' ? '' : walletDisplay.textContent;
        avatarInput.value = avatarDisplay.textContent;
        
    } else {
        // Прячем поля, показываем текст
        nameDisplay.style.display = 'block';
        walletDisplay.style.display = 'block';
        avatarDisplay.style.display = 'block';
        
        nameInput.style.display = 'none';
        walletInput.style.display = 'none';
        avatarInput.style.display = 'none';
        editActions.style.display = 'none';
    }
}

// ===== Сохранение изменений =====
async function saveChanges() {
    const nameInput = document.getElementById('editNameInput');
    const walletInput = document.getElementById('editWalletInput');
    const avatarInput = document.getElementById('editAvatarInput');
    
    const newName = nameInput.value.trim();
    const newWallet = walletInput.value.trim();
    const newAvatar = avatarInput.value.trim() || '👤';
    
    let success = true;
    
    if (newName && newName !== document.getElementById('userName').textContent) {
        success = success && await updateUserName(newName);
    }
    
    if (newWallet && newWallet !== document.getElementById('walletDisplay').textContent) {
        success = success && await updateWallet(newWallet);
    }
    
    if (newAvatar && newAvatar !== document.getElementById('userAvatar').textContent) {
        success = success && await updateAvatar(newAvatar);
    }
    
    if (success) {
        // Обновляем отображение
        document.getElementById('userName').textContent = newName || document.getElementById('userName').textContent;
        document.getElementById('walletDisplay').textContent = newWallet || 'Кошелёк не подключён';
        document.getElementById('userAvatar').textContent = newAvatar;
        
        toggleEditMode(false);
    }
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', async () => {
    // Базовые инициализации
    initTheme();
    initModal('settingsBtn', 'settingsModal', 'closeSettings');
    initNotifications('notifToggle');
    initBalanceSimulation('balance', 'estimatedValue', 125, 1250);

    // Загружаем профиль
    await loadProfile();

    // Кнопка назад (ИСПРАВЛЕНО)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'main.html';
        });
    } else {
        console.error('Кнопка назад не найдена');
    }

    // Кнопка редактирования
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            toggleEditMode(!isEditing);
        });
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

    const termsBtn = document.getElementById('termsBtn');
    if (termsBtn) {
        termsBtn.addEventListener('click', () => {
            alert('📋 Условия использования:\n\n• Создавайте уникальные кубы\n• Участвуйте в аукционах\n• Зарабатывайте TON');
            document.getElementById('settingsModal')?.classList.remove('show');
        });
    }

    // Добавление новой истории (демо)
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