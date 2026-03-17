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

// ===== TON Connect =====
let tonConnectUI;

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
}

// ===== Обновление кошелька в БД =====
async function updateWalletInDB(walletAddress) {
    const { error } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', userId);

    if (error) {
        console.error('Ошибка при обновлении кошелька:', error);
        alert('❌ Ошибка при сохранении кошелька');
        return false;
    }
    
    document.getElementById('walletDisplay').textContent = walletAddress;
    alert('✅ Кошелёк успешно подключён');
    return true;
}

// ===== Инициализация TON Connect =====
async function initTonConnect() {
    // Ждём загрузки TON Connect UI
    if (!window.TONConnectUI) {
        console.error('TON Connect UI не загружен');
        return;
    }

    tonConnectUI = new TONConnectUI.TONConnectUI({
        manifestUrl: 'https://lava3310.github.io/3D-NFT/docs/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    // Проверяем, был ли уже подключён кошелёк
    const currentWallet = await tonConnectUI.getCurrentWallet();
    if (currentWallet) {
        const address = currentWallet.account.address;
        await updateWalletInDB(address);
    }

    // Слушаем изменения подключения
    tonConnectUI.onStatusChange(async (wallet) => {
        if (wallet) {
            const address = wallet.account.address;
            await updateWalletInDB(address);
        } else {
            // Отключили кошелёк
            await updateWalletInDB(null);
            document.getElementById('walletDisplay').textContent = 'Кошелёк не подключён';
        }
    });
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

// ===== Включение/выключение режима редактирования =====
function toggleEditMode(enable) {
    isEditing = enable;
    
    const nameDisplay = document.getElementById('userName');
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    
    const nameInput = document.getElementById('editNameInput');
    const editActions = document.getElementById('editActions');
    
    if (enable) {
        nameDisplay.style.display = 'none';
        if (editAvatarBtn) editAvatarBtn.style.display = 'flex';
        
        nameInput.style.display = 'block';
        editActions.style.display = 'flex';
        
        nameInput.value = nameDisplay.textContent;
        
    } else {
        nameDisplay.style.display = 'block';
        if (editAvatarBtn) editAvatarBtn.style.display = 'none';
        
        nameInput.style.display = 'none';
        editActions.style.display = 'none';
    }
}

// ===== Сохранение изменений =====
async function saveChanges() {
    const nameInput = document.getElementById('editNameInput');
    const newName = nameInput.value.trim();
    const currentName = document.getElementById('userName').textContent;
    
    if (!newName) {
        alert('Имя не может быть пустым');
        return;
    }
    
    if (newName === currentName) {
        toggleEditMode(false);
        return;
    }
    
    // Отправляем в базу
    const { error } = await supabase
        .from('users')
        .update({ username: newName })
        .eq('id', userId);

    if (error) {
        console.error('Ошибка при обновлении имени:', error);
        alert('❌ Не удалось обновить имя');
        return;
    }
    
    // Обновляем локально
    document.getElementById('userName').textContent = newName;
    localStorage.setItem('userName', newName);
    
    alert('✅ Имя успешно обновлено');
    toggleEditMode(false);
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initModal('settingsBtn', 'settingsModal', 'closeSettings');
    initNotifications('notifToggle');
    initBalanceSimulation('balance', 'estimatedValue', 125, 1250);

    await loadProfile();

    // Инициализация TON Connect
    await initTonConnect();

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
            
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой. Максимум 2MB');
                return;
            }
            
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