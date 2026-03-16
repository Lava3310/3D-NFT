// ===== Переключение темы =====
export function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeText = document.getElementById('themeText');
    
    if (!themeToggle) return;
    
    let isDark = !document.body.classList.contains('light-theme');
    
    // Устанавливаем начальную иконку
    if (themeText) {
        themeText.textContent = isDark ? '🌙 Тёмная' : '☀️ Светлая';
    } else {
        themeToggle.textContent = isDark ? '🌙' : '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        isDark = !isDark;
        
        if (themeText) {
            themeText.textContent = isDark ? '🌙 Тёмная' : '☀️ Светлая';
        } else {
            themeToggle.textContent = isDark ? '🌙' : '☀️';
        }
    });
}

// ===== Модалки =====
export function initModal(triggerBtn, modalId, closeBtnId) {
    const modal = document.getElementById(modalId);
    const trigger = document.getElementById(triggerBtn);
    const closeBtn = document.getElementById(closeBtnId);
    
    if (!modal || !trigger) return;
    
    trigger.addEventListener('click', () => {
        modal.classList.add('show');
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// ===== Уведомления =====
export function initNotifications(notifId) {
    const notifToggle = document.getElementById(notifId);
    if (!notifToggle) return;
    
    let notifOn = true;
    notifToggle.classList.add('on');
    notifToggle.textContent = 'Вкл';
    
    notifToggle.addEventListener('click', () => {
        notifOn = !notifOn;
        notifToggle.textContent = notifOn ? 'Вкл' : 'Выкл';
        notifToggle.classList.toggle('on', notifOn);
    });
}

// ===== Имитация баланса =====
export function initBalanceSimulation(balanceId, estId, startBalance = 125, startEst = 1250) {
    setInterval(() => {
        const balanceEl = document.getElementById(balanceId);
        const estEl = document.getElementById(estId);
        
        if (balanceEl) {
            const newBalance = (startBalance + Math.random() * 15).toFixed(1);
            balanceEl.textContent = newBalance;
        }
        
        if (estEl) {
            const newEst = (startEst + Math.random() * 200).toFixed(0);
            estEl.textContent = newEst + ' TON';
        }
    }, 8000);
}

// ===== Supabase клиент =====
export function createSupabaseClient(url, key) {
    return supabase.createClient(url, key);
}