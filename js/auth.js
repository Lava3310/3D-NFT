import { createSupabaseClient } from './utils.js';

// ===== Supabase =====
const SUPABASE_URL = 'https://kkellolonnuyqdfngmzk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sB1ZOY6NKpznS8on4tWKgw_JdMV5EXt';

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Обработчик Telegram Login =====
window.onTelegramAuth = async function(user) {
    console.log('Telegram user:', user);
    
    try {
        // 1. Проверяем, есть ли пользователь в базе
        let { data: existingUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', user.id)
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
                        telegram_id: user.id,
                        username: user.username || user.first_name,
                        avatar: user.photo_url || '👤',
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
        window.location.href = 'main.html';
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Ошибка при входе: ' + error.message);
    }
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