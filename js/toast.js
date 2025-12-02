/**
 * KAMPUS TOAST NOTIFICATIONS
 * Sistema de notificaciones visuales para feedback de usuario
 */

const Toast = {
  /**
   * Mostrar una notificación toast
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duración en ms (default: 3000)
   */
  show: function(message, type = 'success', duration = 3000) {
    // Crear contenedor de toasts si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2';
      document.body.appendChild(container);
    }

    // Configuración de colores e iconos según tipo
    const configs = {
      success: {
        bg: 'bg-green-500',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>`
      },
      error: {
        bg: 'bg-red-500',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" />
        </svg>`
      },
      warning: {
        bg: 'bg-yellow-500',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
        </svg>`
      },
      info: {
        bg: 'bg-blue-500',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
        </svg>`
      }
    };

    const config = configs[type] || configs.info;

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `${config.bg} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md transform transition-all duration-300 ease-out translate-x-[400px] opacity-0`;
    toast.innerHTML = `
      <div class="flex-shrink-0">
        ${config.icon}
      </div>
      <p class="flex-1 font-medium text-sm">${message}</p>
      <button class="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors" onclick="this.parentElement.remove()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
        </svg>
      </button>
    `;

    container.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('translate-x-[400px]', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    }, 10);

    // Auto-remover después de la duración
    setTimeout(() => {
      toast.classList.add('translate-x-[400px]', 'opacity-0');
      setTimeout(() => {
        toast.remove();
        // Limpiar contenedor si está vacío
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, duration);
  },

  // Atajos para tipos comunes
  success: function(message, duration) {
    this.show(message, 'success', duration);
  },

  error: function(message, duration) {
    this.show(message, 'error', duration);
  },

  warning: function(message, duration) {
    this.show(message, 'warning', duration);
  },

  info: function(message, duration) {
    this.show(message, 'info', duration);
  }
};

// Hacer Toast disponible globalmente
window.Toast = Toast;

console.log('✅ Toast Notification System cargado');
