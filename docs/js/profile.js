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
    document.getElementById('balance').textContent = user.balance_ton || 0;
    document.getElementById('walletDisplay').textContent = user.wallet_address || 'Кошелёк не подключён';

    // Аватар из Telegram
    const avatarImg = document.getElementById('userAvatar');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    
    if (user.avatar && user.avatar.startsWith('http')) {
        avatarImg.src = user.avatar;
        avatarImg.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    } else {
        avatarPlaceholder.textContent = '👤';
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
    document.getElementById('estimatedValue').textContent = '0 TON';
}

// ===== Загрузка истории транзакций =====
async function loadTransactionHistory() {
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Ошибка загрузки истории:', error);
        return;
    }

    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (!transactions || transactions.length === 0) {
        historyList.innerHTML = '<div class="history-empty">История пока пуста</div>';
        return;
    }

    historyList.innerHTML = '';
    
    transactions.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        let icon = '💰';
        let actionText = '';
        let valueText = '';
        
        switch(tx.type) {
            case 'ton_deposit':
                icon = '📥';
                actionText = 'Пополнение баланса';
                valueText = `+${tx.amount_ton} TON`;
                break;
            case 'ton_withdraw':
                icon = '📤';
                actionText = 'Вывод средств';
                valueText = `-${tx.amount_ton} TON`;
                break;
            case 'voxel_purchase':
                icon = '🧱';
                actionText = `Покупка ${tx.voxel_quantity} ${tx.voxel_type}`;
                valueText = `-${tx.amount_ton} TON`;
                break;
            case 'cube_mint':
                icon = '🎨';
                actionText = 'Создание нового куба';
                valueText = `#${tx.cube_id?.slice(0, 4) || ''}`;
                break;
            case 'spin_win':
                icon = '🎁';
                actionText = 'Выигрыш в колесе';
                valueText = `+${tx.voxel_quantity} ${tx.voxel_type}`;
                break;
            default:
                icon = '📋';
                actionText = tx.type;
                valueText = '';
        }
        
        const date = new Date(tx.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        
        item.innerHTML = `
            <div class="history-icon">${icon}</div>
            <div class="history-details">
                <div class="history-action">${actionText}</div>
                <div class="history-time">${date}</div>
            </div>
            <div class="history-value">${valueText}</div>
        `;
        
        historyList.appendChild(item);
    });
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
    
    // Добавляем транзакцию в историю
    await supabase
        .from('transactions')
        .insert([{
            user_id: userId,
            type: 'wallet_connected',
            metadata: { wallet: walletAddress }
        }]);
    
    await loadTransactionHistory();
    
    return true;
}

// ===== Инициализация TON Connect =====
async function initTonConnect() {
    // Ждём загрузки TON Connect
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!window.TONConnectUI && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.TONConnectUI) {
        console.error('TON Connect UI не загрузился после 2 секунд');
        return;
    }

    try {
        tonConnectUI = new TONConnectUI.TONConnectUI({
            manifestUrl: 'https://lava3310.github.io/3D-NFT/docs/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-button'
        });

        const currentWallet = await tonConnectUI.getCurrentWallet();
        if (currentWallet) {
            const address = currentWallet.account.address;
            await updateWalletInDB(address);
        }

        tonConnectUI.onStatusChange(async (wallet) => {
            if (wallet) {
                const address = wallet.account.address;
                await updateWalletInDB(address);
            } else {
                await supabase
                    .from('users')
                    .update({ wallet_address: null })
                    .eq('id', userId);
                
                document.getElementById('walletDisplay').textContent = 'Кошелёк не подключён';
                await loadTransactionHistory();
            }
        });
    } catch (error) {
        console.error('Ошибка при инициализации TON Connect:', error);
    }
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initModal('settingsBtn', 'settingsModal', 'closeSettings');
    initNotifications('notifToggle');
    initBalanceSimulation('balance', 'estimatedValue', 125, 1250);

    await loadProfile();
    await loadTransactionHistory();

    // Запускаем TON Connect с небольшой задержкой
    setTimeout(() => {
        initTonConnect();
    }, 500);

    // Кнопка назад
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'main.html';
        });
    }

    // Кнопки действий
    document.getElementById('depositBtn')?.addEventListener('click', () => alert('💰 Пополнение скоро будет доступно'));
    document.getElementById('withdrawBtn')?.addEventListener('click', () => alert('💸 Вывод средств скоро будет доступен'));
    
    document.getElementById('termsBtn')?.addEventListener('click', () => {
        alert('📋 Условия использования:\n\n• Создавайте уникальные кубы\n• Участвуйте в аукционах\n• Зарабатывайте TON');
        document.getElementById('settingsModal')?.classList.remove('show');
    });
});