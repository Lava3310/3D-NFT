import { createSupabaseClient } from './utils.js';

// ===== Supabase =====
const SUPABASE_URL = 'https://kkellolonnuyqdfngmzk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sB1ZOY6NKpznS8on4tWKgw_JdMV5EXt';

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Функция входа =====
export async function loginUser(telegramData) {
    try {
        console.log('Вход с данными:', telegramData);
        
        // 1. Проверяем, есть ли пользователь в базе
        let { data: existingUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramData.id)
            .maybeSingle();
        
        if (error) {
            console.error('Ошибка при поиске пользователя:', error);
            throw error;
        }
        
        // 2. Если нет — создаём
        if (!existingUser) {
            console.log('Создаём нового пользователя');
            
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        telegram_id: telegramData.id,
                        username: telegramData.username || telegramData.first_name,
                        avatar: telegramData.photo_url || '👤',
                        cube_slots: 2,
                        balance_ton: 0
                    }
                ])
                .select()
                .single();
            
            if (insertError) {
                console.error('Ошибка при создании:', insertError);
                throw insertError;
            }
            
            console.log('Новый пользователь создан:', newUser);
            existingUser = newUser;
        } else {
            console.log('Пользователь найден:', existingUser);
        }
        
        // 3. Сохраняем в localStorage
        localStorage.setItem('userId', existingUser.id);
        localStorage.setItem('userName', existingUser.username);
        localStorage.setItem('userAvatar', existingUser.avatar);
        
        console.log('Данные сохранены, переходим на главную');
        
        // 4. Переходим на главную
        console.log(existingUser);
        window.location.href = 'https://lava3310.github.io/3D-NFT/main.html';
        
        return true;
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Ошибка при входе: ' + error.message);
        return false;
    }
}

// ===== Обработчик Telegram Login =====
window.onTelegramAuth = async function(user) {
    console.log('Telegram user:', user);
    
    const telegramData = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url
    };
    
    await loginUser(telegramData);
};

// ===== Функция для вставки виджета =====
export function initTelegramWidget() {
    const container = document.getElementById('telegram-login-container');
    if (!container) {
        console.error('Контейнер для виджета не найден');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаём виджет
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'nft3d_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '40');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    
    container.appendChild(script);
    console.log('Виджет Telegram добавлен');
}

// ===== Загрузка пользователя (для main.js) =====
export async function loadUser(userId) {
    if (!userId) {
        return null;
    }
    
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Ошибка загрузки пользователя:', error);
        return null;
    }
    
    return user;
}

// ===== Telegram OAuth (без виджета, в том же окне) =====
export function handleTelegramLogin() {
    const botName = 'nft3d_bot';
    
    // Генерируем случайный state для безопасности
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('tg_state', state);
    
    // Формируем URL для OAuth
    const redirectUrl = encodeURIComponent('https://lava3310.github.io/3D-NFT/index.html');
    const botId = 8531815975;
    const authUrl = `https://oauth.telegram.org/auth?bot_id=${botId}
    &origin=${encodeURIComponent('https://lava3310.github.io')}&redirect_url=${redirectUrl}&state=${state}&response_type=code`;
    // Перенаправляем в том же окне
    window.location.href = authUrl;
}