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

// ===== Состояние редактирования =====
let isEditing = false;

// ===== Валидация TON кошелька =====
function isValidTonWallet(address) {
    if (!address) return false;
    
    // TON адреса начинаются с EQ, UQ или 0Q
    const validPrefixes = ['EQ', 'UQ', '0Q'];
    const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
    
    if (!hasValidPrefix) return false;
    
    // Длина должна быть 48 символов
    if (address.length !== 48) return false;
    
    // Проверяем, что остальные символы — буквы и цифры (Base64)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    const body = address.slice(2); // убираем префикс
    
    return base64Regex.test(body);
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
    document.getElementById('walletDisplay').textContent = user.wallet_address || 'Кошелёк не подключён';
    document.getElementById('balance').textContent = user.balance_ton || 0;

    // Аватар
    const avatarImg = document.getElementById('userAvatar');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    
    if (user.avatar && user.avatar.startsWith('http')) {
        avatarImg.src = user.avatar;
        avatarImg.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    } else {
        avatarPlaceholder.textContent = user.avatar || '👤';
        avatarPlaceholder.style.display = 'flex';
        avatarImg.style.display = 'none';
    }

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

// ===== Загрузка аватара в Storage =====
async function uploadAvatar(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Ошибка загрузки:', uploadError);
        alert('Ошибка при загрузке файла');
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return publicUrl;
}

// ===== Обновление аватара в БД =====
async function updateAvatar(avatarUrl) {
    const { error } = await supabase
        .from('users')
        .update({ avatar: avatarUrl })
        .eq('id', userId);

    if (error) {
        console.error('Ошибка при обновлении аватара:', error);
        alert('Не удалось обновить аватар');
        return false;
    }
    return true;
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
    // Очищаем от пробелов
    const cleanWallet = newWallet.trim();
    
    // Проверка формата
    if (!isValidTonWallet(cleanWallet)) {
        alert('❌ Неверный формат TON кошелька\n\nАдрес должен:\n• Начинаться с EQ, UQ или 0Q\n• Быть длиной 48 символов\n• Содержать только буквы и цифры');
        return false;
    }
    
    const { error } = await supabase
        .from('users')
        .update({ wallet_address: cleanWallet })
        .eq('id', userId);

    if (error) {
        console.error('Ошибка при обновлении кошелька:', error);
        alert('❌ Ошибка при сохранении кошелька');
        return false;
    }
    
    alert('✅ Кошелёк успешно подключён');
    return true;
}

// ===== Включение/выключение режима редактирования =====
function toggleEditMode(enable) {
    isEditing = enable;
    
    const nameDisplay = document.getElementById('userName');
    const walletDisplay = document.getElementById('walletDisplay');
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    
    const nameInput = document.getElementById('editNameInput');
    const walletInput = document.getElementById('editWalletInput');
    const editActions = document.getElementById('editActions');
    
    if (enable) {
        nameDisplay.style.display = 'none';
        walletDisplay.style.display = 'none';
        if (editAvatarBtn) editAvatarBtn.style.display = 'flex';
        
        nameInput.style.display = 'block';
        walletInput.style.display = 'block';
        editActions.style.display = 'flex';
        
        nameInput.value = nameDisplay.textContent;
        walletInput.value = walletDisplay.textContent === 'Кошелёк не подключён' ? '' : walletDisplay.textContent;
        
    } else {
        nameDisplay.style.display = 'block';
        walletDisplay.style.display = 'block';
        if (editAvatarBtn) editAvatarBtn.style.display = 'none';
        
        nameInput.style.display = 'none';
        walletInput.style.display = 'none';
        editActions.style.display = 'none';
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

    // Кнопка редактирования профиля
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            toggleEditMode(!isEditing);
        });
    }

    // Кнопка редактирования аватара
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    
    if (editAvatarBtn && avatarUpload) {
        editAvatarBtn.addEventListener('click', () => {
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Проверка размера (макс 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой. Максимум 2MB');
                return;
            }
            
            // Проверка типа
            if (!file.type.startsWith('image/')) {
                alert('Можно загружать только изображения');
                return;
            }
            
            const avatarUrl = await uploadAvatar(file);
            if (avatarUrl) {
                const success = await updateAvatar(avatarUrl);
                if (success) {
                    const avatarImg = document.getElementById('userAvatar');
                    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
                    
                    avatarImg.src = avatarUrl;
                    avatarImg.style.display = 'block';
                    avatarPlaceholder.style.display = 'none';
                    
                    // Выходим из режима редактирования после загрузки
                    toggleEditMode(false);
                }
            }
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

    // Подключение кошелька
    const connectSubmit = document.getElementById('connectSubmit');
    const walletInput = document.getElementById('walletInput');
    const walletDisplay = document.getElementById('walletDisplay');
    const connectPanel = document.getElementById('connectPanel');

    if (connectSubmit) {
        // Авто-форматирование поля ввода
        walletInput.addEventListener('input', (e) => {
            // Убираем пробелы и переводим в верхний регистр
            e.target.value = e.target.value.replace(/\s/g, '').toUpperCase();
        });

        connectSubmit.addEventListener('click', async () => {
            const walletAddress = walletInput.value.trim();
            if (!walletAddress) {
                alert('Введите адрес кошелька');
                return;
            }
            
            const success = await updateWallet(walletAddress);
            if (success) {
                walletDisplay.textContent = walletAddress;
                connectPanel.style.display = 'none';
                walletInput.value = ''; // очищаем поле
            }
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