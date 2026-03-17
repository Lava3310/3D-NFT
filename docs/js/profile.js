import { initTheme, initModal, initNotifications, initBalanceSimulation } from './utils.js';
import { loadUser } from './auth.js';

// ===== Supabase клиент (если не импортирован из auth.js) =====
import { createSupabaseClient } from './utils.js';

const SUPABASE_URL = 'https://kkellolonnuyqdfngmzk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sB1ZOY6NKpznS8on4tWKgw_JdMV5EXt';

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ID пользователя =====
const userId = localStorage.getItem('userId');
if (!userId) {
    window.location.href = 'index.html';
}

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

    // Оценочная стоимость (позже будет считаться)
    document.getElementById('estimatedValue').textContent = user.balance_ton ? `${user.balance_ton * 10} TON` : '0 TON';
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

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', async () => {
    // Базовые инициализации
    initTheme();
    initModal('settingsBtn', 'settingsModal', 'closeSettings');
    initNotifications('notifToggle');
    initBalanceSimulation('balance', 'estimatedValue', 125, 1250);

    // Загружаем профиль
    await loadProfile();

    // Кнопка назад
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'main.html';
        });
    }

    // Подключение кошелька
    const connectPanel = document.getElementById('connectPanel');
    const walletInput = document.getElementById('walletInput');
    const connectSubmit = document.getElementById('connectSubmit');
    const walletDisplay = document.getElementById('walletDisplay');

    if (connectSubmit) {
        connectSubmit.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            if (walletAddress) {
                // Сохраняем в базу
                const { error } = await supabase
                    .from('users')
                    .update({ wallet_address: walletAddress })
                    .eq('id', userId);

                if (error) {
                    alert('Ошибка при сохранении кошелька');
                } else {
                    walletDisplay.textContent = walletAddress;
                    connectPanel.style.display = 'none';
                }
            } else {
                alert('Введите адрес кошелька');
            }
        });
    }

    // Редактирование имени
    const editBtn = document.getElementById('editProfileBtn');
    const userNameEl = document.getElementById('userName');

    if (editBtn) {
        editBtn.addEventListener('click', async () => {
            const currentName = userNameEl.textContent;
            const newName = prompt('Введите новое имя пользователя:', currentName);
            
            if (newName && newName !== currentName) {
                const success = await updateUserName(newName);
                if (success) {
                    userNameEl.textContent = newName;
                }
            }
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