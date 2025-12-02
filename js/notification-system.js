// ============================================
// 🔔 SISTEMA DE NOTIFICACIONES - KAMPUS
// Notificaciones in-app, toast y push (opcional)
// ============================================

class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.notificationsKey = 'kampus_notifications';
    this.preferencesKey = 'kampus_notification_preferences';
    this.container = null;
    this.init();
  }

  init() {
    this.loadNotifications();
    this.loadPreferences();
    
    // Crear contenedor cuando el DOM esté listo
    if (document.body) {
      this.createContainer();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        this.createContainer();
      });
    }
    
    (window.KampusLogger?.info || console.log)('🔔 Sistema de Notificaciones inicializado');
  }

  // ==========================================
  // 1. TOAST NOTIFICATIONS (temporal)
  // ==========================================

  toast(message, options = {}) {
    const defaults = {
      type: 'info', // success, error, warning, info
      duration: 3000,
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center
      closable: true
    };

    const config = { ...defaults, ...options };

    const toast = document.createElement('div');
    toast.className = `toast toast-${config.type} toast-${config.position}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${this.getIcon(config.type)}</div>
        <div class="toast-message">${message}</div>
        ${config.closable ? '<button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>' : ''}
      </div>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('toast-styles')) {
      this.injectToastStyles();
    }

    document.body.appendChild(toast);

    // Auto-remover después de duration
    if (config.duration > 0) {
      setTimeout(() => {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 300);
      }, config.duration);
    }

    return toast;
  }

  success(message, duration = 3000) {
    return this.toast(message, { type: 'success', duration });
  }

  error(message, duration = 5000) {
    return this.toast(message, { type: 'error', duration });
  }

  warning(message, duration = 4000) {
    return this.toast(message, { type: 'warning', duration });
  }

  info(message, duration = 3000) {
    return this.toast(message, { type: 'info', duration });
  }

  // ==========================================
  // 2. NOTIFICACIONES PERSISTENTES
  // ==========================================

  notify(notification) {
    const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const notif = {
      id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      icon: notification.icon || this.getIcon(notification.type || 'info'),
      timestamp: Date.now(),
      read: false,
      action: notification.action || null, // { label, callback }
      data: notification.data || {}
    };

    this.notifications.unshift(notif);
    this.saveNotifications();
    this.updateBadge();

    // Mostrar toast si está habilitado
    if (this.getPreference('showToast')) {
      this.toast(notif.message, { type: notif.type });
    }

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('kampusNotification', { detail: notif }));

  (window.KampusLogger?.debug || console.log)('🔔 Nueva notificación:', notif.title);
    return notif;
  }

  // ==========================================
  // 3. GESTIÓN DE NOTIFICACIONES
  // ==========================================

  getAll() {
    return this.notifications;
  }

  getUnread() {
    return this.notifications.filter(n => !n.read);
  }

  getById(id) {
    return this.notifications.find(n => n.id === id);
  }

  markAsRead(id) {
    const notif = this.getById(id);
    if (notif) {
      notif.read = true;
      this.saveNotifications();
      this.updateBadge();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.updateBadge();
  }

  delete(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.updateBadge();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.updateBadge();
  }

  // ==========================================
  // 4. PERSISTENCIA
  // ==========================================

  saveNotifications() {
    localStorage.setItem(this.notificationsKey, JSON.stringify(this.notifications));
  }

  loadNotifications() {
    const stored = localStorage.getItem(this.notificationsKey);
    this.notifications = stored ? JSON.parse(stored) : [];
    
    // Limpiar notificaciones antiguas (> 30 días)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => n.timestamp > thirtyDaysAgo);
    this.saveNotifications();
  }

  // ==========================================
  // 5. BADGE (contador)
  // ==========================================

  updateBadge() {
    const unreadCount = this.getUnread().length;
    const badges = document.querySelectorAll('.notification-badge');
    
    badges.forEach(badge => {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // ==========================================
  // 6. PANEL DE NOTIFICACIONES
  // ==========================================

  createContainer() {
    // Verificar que document.body exista
    if (!document.body) {
  (window.KampusLogger?.warn || console.warn)('⚠️ document.body no está disponible aún');
      return;
    }

    // Evitar crear múltiples contenedores
    if (document.getElementById('notification-panel')) {
      this.container = document.getElementById('notification-panel');
      return;
    }

    // Crear contenedor para panel de notificaciones
    const container = document.createElement('div');
    container.id = 'notification-panel';
    container.className = 'notification-panel hidden';
    container.innerHTML = `
      <div class="notification-header">
        <h3>Notificaciones</h3>
        <button onclick="window.NotificationSystem.markAllAsRead()">Marcar todas como leídas</button>
      </div>
      <div class="notification-list" id="notification-list"></div>
    `;
    
    document.body.appendChild(container);
    this.container = container;
  }

  showPanel() {
    if (!this.container) {
      this.createContainer();
    }
    if (this.container) {
      this.container.classList.remove('hidden');
      this.renderPanel();
    }
  }

  hidePanel() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  togglePanel() {
    if (!this.container) {
      this.createContainer();
    }
    if (this.container) {
      this.container.classList.toggle('hidden');
      if (!this.container.classList.contains('hidden')) {
        this.renderPanel();
      }
    }
  }

  renderPanel() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
      return;
    }

    list.innerHTML = this.notifications.map(n => `
      <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="window.NotificationSystem.markAsRead('${n.id}')">
        <div class="notification-icon">${n.icon}</div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-message">${n.message}</div>
          <div class="notification-time">${this.formatTime(n.timestamp)}</div>
        </div>
        <button class="notification-delete" onclick="event.stopPropagation(); window.NotificationSystem.delete('${n.id}')">×</button>
      </div>
    `).join('');
  }

  // ==========================================
  // 7. PREFERENCIAS
  // ==========================================

  savePreferences(prefs) {
    const currentPrefs = this.loadPreferences();
    const newPrefs = { ...currentPrefs, ...prefs };
    localStorage.setItem(this.preferencesKey, JSON.stringify(newPrefs));
  }

  loadPreferences() {
    const stored = localStorage.getItem(this.preferencesKey);
    return stored ? JSON.parse(stored) : {
      enabled: true,
      showToast: true,
      sound: false,
      newMaterial: true,
      newComment: true,
      newLike: true,
      premiumExpiry: true,
      systemUpdates: true
    };
  }

  getPreference(key) {
    const prefs = this.loadPreferences();
    return prefs[key];
  }

  // ==========================================
  // 8. NOTIFICACIONES PROGRAMADAS
  // ==========================================

  schedule(notification, delay) {
    setTimeout(() => {
      this.notify(notification);
    }, delay);
  }

  // ==========================================
  // 9. PUSH NOTIFICATIONS (opcional)
  // ==========================================

  async requestPermission() {
    if (!('Notification' in window)) {
  (window.KampusLogger?.warn || console.warn)('⚠️ Este navegador no soporta notificaciones push');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async sendPush(title, options = {}) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
  (window.KampusLogger?.warn || console.warn)('⚠️ No hay permiso para notificaciones push');
      return null;
    }

    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/badge.png',
      tag: options.tag || 'kampus-notification',
      requireInteraction: options.requireInteraction || false,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };

    return notification;
  }

  // ==========================================
  // 10. UTILIDADES
  // ==========================================

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'ahora mismo';
  }

  injectToastStyles() {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast {
        position: fixed;
        z-index: 10000;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: toast-slide-in 0.3s ease-out;
        max-width: 400px;
      }
      .toast-top-right { top: 20px; right: 20px; }
      .toast-top-left { top: 20px; left: 20px; }
      .toast-bottom-right { bottom: 20px; right: 20px; }
      .toast-bottom-left { bottom: 20px; left: 20px; }
      .toast-top-center { top: 20px; left: 50%; transform: translateX(-50%); }
      .toast-content { display: flex; align-items: center; gap: 12px; }
      .toast-icon { font-size: 24px; flex-shrink: 0; }
      .toast-message { flex: 1; color: white; }
      .toast-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 24px; }
      .toast-success { background: #10b981; }
      .toast-error { background: #ef4444; }
      .toast-warning { background: #f59e0b; }
      .toast-info { background: #3b82f6; }
      .toast-fadeout { animation: toast-fade-out 0.3s ease-out forwards; }
      @keyframes toast-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes toast-fade-out {
        to { opacity: 0; transform: scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.NotificationSystem = new NotificationSystem();

// Ejemplos de uso
window.testNotifications = () => {
  window.NotificationSystem.success('¡Operación exitosa!');
  setTimeout(() => window.NotificationSystem.error('Ocurrió un error'), 1000);
  setTimeout(() => window.NotificationSystem.warning('Advertencia importante'), 2000);
  setTimeout(() => window.NotificationSystem.info('Información general'), 3000);
};

(window.KampusLogger?.tip || console.log)('Escribe testNotifications() para ver ejemplos');
