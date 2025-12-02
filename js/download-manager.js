/**
 * KAMPUS DOWNLOAD MANAGER
 * Sistema de gestión de límites de descarga
 */

const DownloadManager = {
  // Límites por plan
  limits: {
    free: 5,        // 5 descargas por día para usuarios gratuitos
    premium: -1     // -1 = ilimitado para Premium
  },

  /**
   * Verificar si el usuario puede descargar
   * @returns {object} { canDownload: boolean, remaining: number, message: string }
   */
  canDownload: function() {
    // Si es Premium, permitir siempre
    if (this.isPremium()) {
      return {
        canDownload: true,
        remaining: -1,
        message: 'Descargas ilimitadas (Premium)'
      };
    }

    // Para usuarios gratuitos, verificar límite diario
    const today = new Date().toISOString().split('T')[0];
    const downloads = this.getTodayDownloads();
    const remaining = this.limits.free - downloads.length;

    if (remaining > 0) {
      return {
        canDownload: true,
        remaining: remaining,
        message: `Te quedan ${remaining} descargas hoy`
      };
    } else {
      return {
        canDownload: false,
        remaining: 0,
        message: 'Has alcanzado el límite de descargas diarias. Actualiza a Premium para descargas ilimitadas.'
      };
    }
  },

  /**
   * Registrar una descarga
   * @param {object} materialData - Datos del material descargado
   * @returns {boolean} - true si se registró correctamente
   */
  registerDownload: function(materialData = {}) {
    try {
      const check = this.canDownload();
      
      if (!check.canDownload) {
        // Mostrar toast de error
        if (window.Toast) {
          Toast.error(check.message, 5000);
        }
        
        // Registrar evento de límite alcanzado
        if (window.Analytics) {
          Analytics.track(Analytics.events.DOWNLOAD_LIMIT_REACHED, materialData);
        }
        
        return false;
      }

      // Obtener descargas existentes
      const downloads = JSON.parse(localStorage.getItem('kampus_downloads') || '[]');
      
      // Crear registro de descarga
      const downloadRecord = {
        id: Date.now(),
        materialId: materialData.id || 'unknown',
        materialName: materialData.name || 'Material',
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      };
      
      // Agregar al array
      downloads.push(downloadRecord);
      
      // Guardar (mantener solo últimos 100 registros)
      localStorage.setItem('kampus_downloads', JSON.stringify(downloads.slice(-100)));
      
      // Registrar en Analytics
      if (window.Analytics) {
        Analytics.track(Analytics.events.MATERIAL_DOWNLOADED, materialData);
      }
      
      // Mostrar toast de éxito
      if (window.Toast) {
        const newRemaining = check.remaining - 1;
        if (newRemaining > 0 && !this.isPremium()) {
          Toast.success(`Descarga iniciada. Te quedan ${newRemaining} descargas hoy`, 3000);
        } else if (!this.isPremium() && newRemaining === 0) {
          Toast.warning('Has usado todas tus descargas gratuitas de hoy. ¡Actualiza a Premium!', 5000);
        } else {
          Toast.success('Descarga iniciada correctamente', 3000);
        }
      }
      
      console.log('📥 Descarga registrada:', downloadRecord);
      return true;
      
    } catch (error) {
      console.error('❌ Error registrando descarga:', error);
      return false;
    }
  },

  /**
   * Obtener descargas de hoy
   * @returns {array} - Array de descargas del día actual
   */
  getTodayDownloads: function() {
    try {
      const downloads = JSON.parse(localStorage.getItem('kampus_downloads') || '[]');
      const today = new Date().toISOString().split('T')[0];
      return downloads.filter(d => d.date === today);
    } catch (error) {
      console.error('❌ Error obteniendo descargas:', error);
      return [];
    }
  },

  /**
   * Obtener estadísticas de descargas
   */
  getStats: function() {
    try {
      const downloads = JSON.parse(localStorage.getItem('kampus_downloads') || '[]');
      const todayDownloads = this.getTodayDownloads();
      const check = this.canDownload();
      
      return {
        total: downloads.length,
        today: todayDownloads.length,
        remaining: check.remaining,
        canDownload: check.canDownload,
        isPremium: this.isPremium()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  },

  /**
   * Verificar si el usuario es Premium
   */
  isPremium: function() {
    const premiumActive = localStorage.getItem('kampus_premium_active');
    const premiumData = localStorage.getItem('kampus_premium');
    
    if (premiumActive === 'true' && premiumData) {
      try {
        const data = JSON.parse(premiumData);
        const endDate = new Date(data.endDate);
        const now = new Date();
        return endDate > now;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  },

  /**
   * Actualizar UI de botones de descarga
   */
  updateDownloadButtons: function() {
    const check = this.canDownload();
    const downloadButtons = document.querySelectorAll('[data-download-btn], button[class*="download"]');
    
    downloadButtons.forEach(btn => {
      // Si ya no puede descargar
      if (!check.canDownload) {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.disabled = true;
        
        // Agregar tooltip o mensaje
        btn.title = check.message;
        
        // Cambiar texto si tiene texto "Descargar"
        const textContent = btn.textContent;
        if (textContent.includes('Descargar')) {
          btn.innerHTML = btn.innerHTML.replace(/Descargar/, 'Límite alcanzado');
        }
      } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.disabled = false;
        
        // Agregar mensaje de descargas restantes
        if (!this.isPremium() && check.remaining <= 3) {
          btn.title = check.message;
        }
      }
    });
  },

  /**
   * Mostrar widget de límites
   */
  showLimitWidget: function() {
    const check = this.canDownload();
    
    // No mostrar para Premium
    if (this.isPremium()) return;
    
    // Buscar contenedor apropiado (ej: en header o sidebar)
    const header = document.querySelector('header');
    if (!header) return;
    
    // Verificar si ya existe el widget
    if (document.getElementById('download-limit-widget')) return;
    
    // Color según estado
    let colorClass = 'bg-blue-500';
    if (check.remaining <= 2) colorClass = 'bg-yellow-500';
    if (check.remaining === 0) colorClass = 'bg-red-500';
    
    const widget = document.createElement('div');
    widget.id = 'download-limit-widget';
    widget.className = `${colorClass} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5`;
    widget.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
        <path fill-rule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clip-rule="evenodd" />
      </svg>
      <span>${check.remaining}/${this.limits.free} descargas</span>
    `;
    
    widget.title = check.message;
    widget.style.cursor = 'help';
    
    // Insertar en el header
    const headerActions = header.querySelector('.flex.items-center.gap-4');
    if (headerActions) {
      headerActions.insertBefore(widget, headerActions.firstChild);
    }
  }
};

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  DownloadManager.updateDownloadButtons();
  DownloadManager.showLimitWidget();
});

// Hacer DownloadManager disponible globalmente
window.DownloadManager = DownloadManager;

console.log('✅ Download Manager cargado');
