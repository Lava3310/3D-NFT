import { createSupabaseClient } from './utils.js';

// ===== Supabase =====
const SUPABASE_URL = 'https://kkellolonnuyqdfngmzk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sB1ZOY6NKpznS8on4tWKgw_JdMV5EXt';

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Вход =====
export async function loginUser(telegramData) {
    try {
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramData.id)
            .maybeSingle();
        
        if (!user) {
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
            
            if (insertError) throw insertError;
            user = newUser;
        }
        
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userName', user.username);
        localStorage.setItem('userAvatar', user.avatar);
        
        window.location.href = 'main.html';
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при входе');
    }
}

// ===== Загрузка пользователя =====
export async function loadUser(userId) {
    if (!userId) {
        window.location.href = 'index.html';
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