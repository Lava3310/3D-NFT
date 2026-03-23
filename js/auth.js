// js/auth.js
import { supabase } from './supabase.js';

// ============================================
// КЛАСС ДЛЯ РАБОТЫ С АВТОРИЗАЦИЕЙ
// ============================================

class TelegramAuth {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.listeners = [];
    }

    // ===== 1. ПОЛУЧИТЬ ДАННЫЕ ИЗ TELEGRAM WEBAPP =====
    getTelegramData() {
        // Проверяем, открыто ли в Telegram
        if (typeof window === 'undefined') return null;
        
        const webApp = window.Telegram?.WebApp;
        
        if (!webApp) {
            console.warn('⚠️ Not in Telegram WebApp');
            return null;
        }
        
        const user = webApp.initDataUnsafe?.user;
        const initData = webApp.initData;
        
        if (!user || !initData) {
            console.warn('⚠️ No user data from Telegram');
            return null;
        }
        
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name || '',
            username: user.username || null,
            photo_url: user.photo_url || null,
            auth_date: user.auth_date,
            initData: initData,
            hash: webApp.initDataUnsafe?.hash
        };
    }

    // ===== 2. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОЛЬЗОВАТЕЛЯ =====
    async checkUserExists(telegramId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, telegram_id, first_name, telegram_username, avatar_url, wallet_address, created_at')
                .eq('telegram_id', telegramId)
                .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Error checking user:', error);
                return false;
            }
            
            return data || false;
        } catch (error) {
            console.error('Error in checkUserExists:', error);
            return false;
        }
    }

    // ===== 3. СОЗДАНИЕ НОВОГО ПОЛЬЗОВАТЕЛЯ =====
    async createUser(telegramData) {
        const newUser = {
            telegram_id: telegramData.id,
            telegram_username: telegramData.username,
            first_name: telegramData.first_name,
            avatar_url: telegramData.photo_url,
            wallet_address: null
        };
        
        try {
            const { data, error } = await supabase
                .from('users')
                .insert(newUser)
                .select()
                .single();
            
            if (error) {
                console.error('Error creating user:', error);
                throw new Error('Failed to create user');
            }
            
            console.log('✅ New user created:', data.telegram_username || data.first_name);
            return data;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    // ===== 4. ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
    async updateUserData(userId, telegramData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    telegram_username: telegramData.username,
                    first_name: telegramData.first_name,
                    avatar_url: telegramData.photo_url,
                    updated_at: new Date()
                })
                .eq('id', userId)
                .select()
                .single();
            
            if (error) {
                console.error('Error updating user:', error);
                return null;
            }
            
            console.log('🔄 User data updated');
            return data;
        } catch (error) {
            console.error('Error in updateUserData:', error);
            return null;
        }
    }

    // ===== 5. ОСНОВНАЯ ФУНКЦИЯ ВХОДА =====
    async login() {
        console.log('🔐 Starting Telegram login...');
        
        // Получаем данные из Telegram
        const telegramData = this.getTelegramData();
        
        if (!telegramData) {
            throw new Error('OPEN_IN_TELEGRAM');
        }
        
        console.log('📱 Telegram user data:', {
            id: telegramData.id,
            name: telegramData.first_name,
            username: telegramData.username
        });
        
        // Проверяем существование пользователя
        const existingUser = await this.checkUserExists(telegramData.id);
        
        let user;
        
        if (existingUser) {
            // Пользователь существует - проверяем нужно ли обновить данные
            const needUpdate = existingUser.first_name !== telegramData.first_name ||
                              existingUser.telegram_username !== telegramData.username ||
                              existingUser.avatar_url !== telegramData.photo_url;
            
            if (needUpdate) {
                user = await this.updateUserData(existingUser.id, telegramData);
            } else {
                user = existingUser;
            }
            
            console.log('👤 Existing user logged in:', user.telegram_username || user.first_name);
        } else {
            // Новый пользователь - создаем
            user = await this.createUser(telegramData);
            console.log('✨ New user created and logged in');
        }
        
        // Сохраняем в localStorage
        this.saveToLocalStorage(user);
        this.currentUser = user;
        
        // Расширяем Telegram WebApp
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.expand();
            window.Telegram.WebApp.ready();
            
            // Устанавливаем основную кнопку если нужно
            window.Telegram.WebApp.MainButton?.hide();
        }
        
        // Уведомляем слушателей
        this.notifyListeners(user);
        
        return user;
    }

    // ===== 6. СОХРАНЕНИЕ В LOCALSTORAGE =====
    saveToLocalStorage(user) {
        const userData = {
            id: user.id,
            telegram_id: user.telegram_id,
            first_name: user.first_name,
            username: user.telegram_username,
            avatar: user.avatar_url,
            wallet: user.wallet_address,
            created_at: user.created_at
        };
        
        localStorage.setItem('voxel_user', JSON.stringify(userData));
        console.log('💾 User saved to localStorage');
    }

    // ===== 7. ПОЛУЧЕНИЕ ИЗ LOCALSTORAGE =====
    getLocalUser() {
        const cached = localStorage.getItem('voxel_user');
        if (!cached) return null;
        
        try {
            return JSON.parse(cached);
        } catch (e) {
            console.error('Error parsing cached user:', e);
            return null;
        }
    }

    // ===== 8. ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ =====
    async getCurrentUser() {
        // Сначала проверяем кэш
        const cached = this.getLocalUser();
        if (cached && !this.isInitialized) {
            this.currentUser = cached;
            this.isInitialized = true;
            return cached;
        }
        
        // Если есть текущий пользователь в памяти
        if (this.currentUser) {
            return this.currentUser;
        }
        
        // Пытаемся получить из Telegram
        try {
            const telegramData = this.getTelegramData();
            if (telegramData) {
                const user = await this.checkUserExists(telegramData.id);
                if (user) {
                    this.saveToLocalStorage(user);
                    this.currentUser = user;
                    return user;
                }
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
        
        return null;
    }

    // ===== 9. ОБНОВЛЕНИЕ КОШЕЛЬКА =====
    async updateWallet(walletAddress) {
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('Not authenticated');
        }
        
        // Валидация адреса кошелька (простая проверка)
        if (!walletAddress || walletAddress.length < 10) {
            throw new Error('Invalid wallet address');
        }
        
        try {
            const { error } = await supabase
                .from('users')
                .update({ wallet_address: walletAddress })
                .eq('id', user.id);
            
            if (error) {
                console.error('Error updating wallet:', error);
                throw new Error('Failed to update wallet');
            }
            
            // Обновляем кэш
            user.wallet = walletAddress;
            this.saveToLocalStorage(user);
            this.currentUser = user;
            
            console.log('💰 Wallet updated:', walletAddress);
            return true;
        } catch (error) {
            console.error('Error in updateWallet:', error);
            throw error;
        }
    }

    // ===== 10. ВЫХОД ИЗ АККАУНТА =====
    logout() {
        localStorage.removeItem('voxel_user');
        this.currentUser = null;
        this.isInitialized = false;
        
        console.log('👋 User logged out');
        
        // Уведомляем слушателей
        this.notifyListeners(null);
        
        // Закрываем WebApp если есть
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
        }
    }

    // ===== 11. ПРОВЕРКА АВТОРИЗАЦИИ =====
    isAuthenticated() {
        return !!this.getLocalUser();
    }

    // ===== 12. ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
    async refreshUser() {
        const cached = this.getLocalUser();
        if (!cached) return null;
        
        try {
            const user = await this.checkUserExists(cached.telegram_id);
            if (user) {
                this.saveToLocalStorage(user);
                this.currentUser = user;
                return user;
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
        
        return null;
    }

    // ===== 13. ДОБАВЛЕНИЕ СЛУШАТЕЛЯ =====
    addListener(callback) {
        this.listeners.push(callback);
    }

    // ===== 14. УДАЛЕНИЕ СЛУШАТЕЛЯ =====
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    // ===== 15. УВЕДОМЛЕНИЕ СЛУШАТЕЛЕЙ =====
    notifyListeners(user) {
        this.listeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error in listener:', error);
            }
        });
    }

    // ===== 16. ПОЛУЧЕНИЕ TELEGRAM WEBAPP =====
    getWebApp() {
        return window.Telegram?.WebApp || null;
    }

    // ===== 17. ПОКАЗАТЬ ГЛАВНУЮ КНОПКУ =====
    showMainButton(text, callback) {
        const webApp = this.getWebApp();
        if (webApp && webApp.MainButton) {
            webApp.MainButton.setText(text);
            webApp.MainButton.show();
            webApp.MainButton.onClick(callback);
        }
    }

    // ===== 18. СКРЫТЬ ГЛАВНУЮ КНОПКУ =====
    hideMainButton() {
        const webApp = this.getWebApp();
        if (webApp && webApp.MainButton) {
            webApp.MainButton.hide();
        }
    }

    // ===== 19. ПОКАЗАТЬ ВСПЛЫВАЮЩЕЕ СООБЩЕНИЕ =====
    showPopup(title, message) {
        const webApp = this.getWebApp();
        if (webApp && webApp.showPopup) {
            webApp.showPopup({
                title: title,
                message: message,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(`${title}\n${message}`);
        }
    }

    // ===== 20. ПОКАЗАТЬ HAPTIC FEEDBACK =====
    hapticFeedback(type = 'light') {
        const webApp = this.getWebApp();
        if (webApp && webApp.HapticFeedback) {
            switch(type) {
                case 'light':
                    webApp.HapticFeedback.impactOccurred('light');
                    break;
                case 'medium':
                    webApp.HapticFeedback.impactOccurred('medium');
                    break;
                case 'heavy':
                    webApp.HapticFeedback.impactOccurred('heavy');
                    break;
                case 'success':
                    webApp.HapticFeedback.notificationOccurred('success');
                    break;
                case 'error':
                    webApp.HapticFeedback.notificationOccurred('error');
                    break;
                case 'warning':
                    webApp.HapticFeedback.notificationOccurred('warning');
                    break;
            }
        }
    }
}

// ============================================
// ЭКСПОРТ И ИНИЦИАЛИЗАЦИЯ
// ============================================

export const auth = new TelegramAuth();

// Автоматическая инициализация при загрузке
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        console.log('🚀 Auth module loaded');
        
        // Если есть сохраненный пользователь, восстанавливаем
        const savedUser = auth.getLocalUser();
        if (savedUser) {
            console.log('📦 Restored user from cache:', savedUser.first_name);
            auth.currentUser = savedUser;
            auth.isInitialized = true;
        }
        
        // Добавляем в глобальный объект для отладки
        window.__auth = auth;
    });
}