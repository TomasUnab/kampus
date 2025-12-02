// ============================================
// 🔔 SISTEMA DE NOTIFICACIONES PUSH - KAMPUS
// ============================================

class PushNotificationManager {
  constructor() {
    this.subscriptionsKey = 'kampus_push_subscriptions';
    this.notificationsKey = 'kampus_notifications';
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      await this.registerServiceWorker();
      this.setupEventListeners();
      (window.KampusLogger?.info || console.log)('🔔 Push Notifications inicializado');
    } else {
      (window.KampusLogger?.warn || console.warn)('❌ Push notifications no soportadas');
    }
  }

  // ==========================================
  // SERVICE WORKER
  // ==========================================

  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      this.swRegistration = registration;
      (window.KampusLogger?.info || console.log)('✅ Service Worker registrado');
      
      // Verificar si ya está suscrito
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        this.currentSubscription = subscription;
      }
    } catch (error) {
      (window.KampusLogger?.error || console.error)('❌ Error registrando SW:', error);
    }
  }

  // ==========================================
  // SUSCRIPCIÓN A PUSH
  // ==========================================

  async requestPermission() {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPush() {
    if (!this.swRegistration) {
      throw new Error('Service Worker no disponible');
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Permisos de notificación denegados');
    }

    try {
      // Clave pública VAPID (en producción usar clave real)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKVXTJtkKSBtJWfLsMGWT0HDgfTzOqHLgSXt4EKYgBeXds';
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      this.currentSubscription = subscription;
      await this.saveSubscription(subscription);
      
      (window.KampusLogger?.info || console.log)('✅ Suscrito a push notifications');
      return subscription;
    } catch (error) {
      (window.KampusLogger?.error || console.error)('❌ Error suscribiendo:', error);
      throw error;
    }
  }

  async unsubscribeFromPush() {
    if (this.currentSubscription) {
      await this.currentSubscription.unsubscribe();
      this.currentSubscription = null;
      this.removeSubscription();
      (window.KampusLogger?.info || console.log)('✅ Desuscrito de push notifications');
    }
  }

  // ==========================================
  // GESTIÓN DE NOTIFICACIONES
  // ==========================================

  async sendNotification(title, options = {}) {
    const user = window.SessionManager?.getCurrentUser();
    if (!user) return;

    const notification = {
      id: this.generateId(),
      userId: user.id,
      title,
      body: options.body || '',
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/badge-72x72.png',
      tag: options.tag || 'kampus-notification',
      timestamp: Date.now(),
      read: false,
      data: options.data || {}
    };

    // Guardar en localStorage
    this.saveNotification(notification);

    // Mostrar notificación del navegador
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        vibrate: [100, 50, 100],
        data: notification.data
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        if (options.onClick) options.onClick(notification);
      };

      // Auto-cerrar después de 5 segundos
      setTimeout(() => browserNotification.close(), 5000);
    }

    // Actualizar UI
    this.updateNotificationUI();
    return notification;
  }

  // ==========================================
  // TIPOS DE NOTIFICACIONES
  // ==========================================

  notifyNewComment(materialTitle, commenterName) {
    return this.sendNotification(
      'Nuevo comentario',
      {
        body: `${commenterName} comentó en "${materialTitle}"`,
        tag: 'new-comment',
        data: { type: 'comment', materialTitle }
      }
    );
  }

  notifyNewRating(materialTitle, rating) {
    return this.sendNotification(
      'Nueva valoración',
      {
        body: `Tu material "${materialTitle}" recibió ${rating} estrellas`,
        tag: 'new-rating',
        data: { type: 'rating', materialTitle, rating }
      }
    );
  }

  notifyMaterialApproved(materialTitle) {
    return this.sendNotification(
      'Material aprobado',
      {
        body: `Tu material "${materialTitle}" ha sido aprobado`,
        tag: 'material-approved',
        data: { type: 'approval', materialTitle }
      }
    );
  }

  notifyDownloadMilestone(materialTitle, downloads) {
    return this.sendNotification(
      'Hito de descargas',
      {
        body: `"${materialTitle}" alcanzó ${downloads} descargas`,
        tag: 'download-milestone',
        data: { type: 'milestone', materialTitle, downloads }
      }
    );
  }

  notifySystemUpdate(version, features) {
    return this.sendNotification(
      `Kampus actualizado a v${version}`,
      {
        body: `Nuevas funciones: ${features.join(', ')}`,
        tag: 'system-update',
        data: { type: 'update', version, features }
      }
    );
  }

  // ==========================================
  // UI DE NOTIFICACIONES
  // ==========================================

  updateNotificationUI() {
    const notifications = this.getUnreadNotifications();
    const badge = document.querySelector('.notification-badge');
    const dropdown = document.querySelector('.notification-dropdown');

    if (badge) {
      if (notifications.length > 0) {
        badge.textContent = notifications.length > 99 ? '99+' : notifications.length;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (dropdown) {
      this.renderNotificationDropdown(dropdown);
    }
  }

  renderNotificationDropdown(container) {
    const notifications = this.getAllNotifications().slice(0, 10);
    
    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="px-4 py-8 text-center text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
          </svg>
          <p>No hay notificaciones</p>
        </div>
      `;
      return;
    }

    const notificationHTML = notifications.map(notification => `
      <div class="notification-item px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
           onclick="window.PushNotificationManager.markAsRead('${notification.id}')">
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            ${this.getNotificationIcon(notification.data?.type)}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">${notification.title}</p>
            <p class="text-sm text-gray-600 dark:text-gray-300 truncate">${notification.body}</p>
            <p class="text-xs text-gray-400 mt-1">${this.timeAgo(notification.timestamp)}</p>
          </div>
          ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
        <button onclick="window.PushNotificationManager.markAllAsRead()" 
                class="text-xs text-blue-600 hover:text-blue-800">
          Marcar todas como leídas
        </button>
      </div>
      <div class="max-h-96 overflow-y-auto">
        ${notificationHTML}
      </div>
    `;
  }

  getNotificationIcon(type) {
    const icons = {
      comment: '💬',
      rating: '⭐',
      approval: '✅',
      milestone: '🎉',
      update: '🔄',
      default: '🔔'
    };
    return `<span class="text-lg">${icons[type] || icons.default}</span>`;
  }

  // ==========================================
  // GESTIÓN DE ESTADO
  // ==========================================

  markAsRead(notificationId) {
    const notifications = this.getAllNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveAllNotifications(notifications);
      this.updateNotificationUI();
    }
  }

  markAllAsRead() {
    const notifications = this.getAllNotifications();
    notifications.forEach(n => n.read = true);
    this.saveAllNotifications(notifications);
    this.updateNotificationUI();
  }

  getUnreadNotifications() {
    return this.getAllNotifications().filter(n => !n.read);
  }

  // ==========================================
  // CONFIGURACIÓN DE USUARIO
  // ==========================================

  showNotificationSettings() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">Configuración de Notificaciones</h3>
        <div class="space-y-4">
          <label class="flex items-center gap-3">
            <input type="checkbox" id="notify-comments" class="rounded">
            <span>Nuevos comentarios en mis materiales</span>
          </label>
          <label class="flex items-center gap-3">
            <input type="checkbox" id="notify-ratings" class="rounded">
            <span>Nuevas valoraciones</span>
          </label>
          <label class="flex items-center gap-3">
            <input type="checkbox" id="notify-approvals" class="rounded">
            <span>Aprobaciones de materiales</span>
          </label>
          <label class="flex items-center gap-3">
            <input type="checkbox" id="notify-milestones" class="rounded">
            <span>Hitos de descargas</span>
          </label>
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="window.PushNotificationManager.saveSettings()" 
                  class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
            Guardar
          </button>
          <button onclick="this.closest('.fixed').remove()" 
                  class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
            Cancelar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.loadSettings();
  }

  saveSettings() {
    const settings = {
      comments: document.getElementById('notify-comments').checked,
      ratings: document.getElementById('notify-ratings').checked,
      approvals: document.getElementById('notify-approvals').checked,
      milestones: document.getElementById('notify-milestones').checked
    };
    localStorage.setItem('kampus_notification_settings', JSON.stringify(settings));
    document.querySelector('.fixed').remove();
    window.showToast?.('Configuración guardada', 'success');
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('kampus_notification_settings') || '{}');
    document.getElementById('notify-comments').checked = settings.comments !== false;
    document.getElementById('notify-ratings').checked = settings.ratings !== false;
    document.getElementById('notify-approvals').checked = settings.approvals !== false;
    document.getElementById('notify-milestones').checked = settings.milestones !== false;
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  setupEventListeners() {
    // Botón de suscripción
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-subscribe-push]')) {
        this.subscribeToPush().catch(console.error);
      }
      if (e.target.matches('[data-notification-settings]')) {
        this.showNotificationSettings();
      }
    });
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
      { label: 'año', seconds: 31536000 },
      { label: 'mes', seconds: 2592000 },
      { label: 'día', seconds: 86400 },
      { label: 'hora', seconds: 3600 },
      { label: 'minuto', seconds: 60 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count > 0) {
        return `hace ${count} ${interval.label}${count > 1 ? 's' : ''}`;
      }
    }
    return 'hace un momento';
  }

  // ==========================================
  // PERSISTENCIA
  // ==========================================

  async saveSubscription(subscription) {
    const user = window.SessionManager?.getCurrentUser();
    if (!user) return;

    const subscriptions = JSON.parse(localStorage.getItem(this.subscriptionsKey) || '{}');
    subscriptions[user.id] = subscription;
    localStorage.setItem(this.subscriptionsKey, JSON.stringify(subscriptions));
  }

  removeSubscription() {
    const user = window.SessionManager?.getCurrentUser();
    if (!user) return;

    const subscriptions = JSON.parse(localStorage.getItem(this.subscriptionsKey) || '{}');
    delete subscriptions[user.id];
    localStorage.setItem(this.subscriptionsKey, JSON.stringify(subscriptions));
  }

  saveNotification(notification) {
    const notifications = this.getAllNotifications();
    notifications.unshift(notification);
    
    // Mantener solo las últimas 100 notificaciones
    if (notifications.length > 100) {
      notifications.splice(100);
    }
    
    this.saveAllNotifications(notifications);
  }

  getAllNotifications() {
    const user = window.SessionManager?.getCurrentUser();
    if (!user) return [];

    const allNotifications = JSON.parse(localStorage.getItem(this.notificationsKey) || '{}');
    return allNotifications[user.id] || [];
  }

  saveAllNotifications(notifications) {
    const user = window.SessionManager?.getCurrentUser();
    if (!user) return;

    const allNotifications = JSON.parse(localStorage.getItem(this.notificationsKey) || '{}');
    allNotifications[user.id] = notifications;
    localStorage.setItem(this.notificationsKey, JSON.stringify(allNotifications));
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.PushNotificationManager = new PushNotificationManager();