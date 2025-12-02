/**
 * KAMPUS ANALYTICS
 * Sistema básico de tracking de eventos y comportamiento de usuario
 */

const Analytics = {
  /**
   * Registrar un evento
   * @param {string} event - Nombre del evento
   * @param {object} data - Datos adicionales del evento
   */
  track: function(event, data = {}) {
    try {
      // Obtener eventos existentes
      const events = JSON.parse(localStorage.getItem('kampus_events') || '[]');
      
      // Crear registro del evento
      const eventRecord = {
        event: event,
        data: data,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        userAgent: navigator.userAgent
      };
      
      // Agregar al array (mantener solo los últimos 200)
      events.push(eventRecord);
      const recentEvents = events.slice(-200);
      
      // Guardar en localStorage
      localStorage.setItem('kampus_events', JSON.stringify(recentEvents));
      
      console.log('📊 Analytics:', event, data);
      
      return true;
    } catch (error) {
      console.error('❌ Error en Analytics:', error);
      return false;
    }
  },

  /**
   * Obtener estadísticas de eventos
   */
  getStats: function() {
    try {
      const events = JSON.parse(localStorage.getItem('kampus_events') || '[]');
      
      // Contar eventos por tipo
      const eventCounts = {};
      events.forEach(e => {
        eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
      });
      
      // Obtener eventos de hoy
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.timestamp.startsWith(today));
      
      return {
        totalEvents: events.length,
        eventCounts: eventCounts,
        todayEvents: todayEvents.length,
        recentEvents: events.slice(-10).reverse()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  },

  /**
   * Limpiar eventos antiguos
   */
  clearOldEvents: function(daysToKeep = 30) {
    try {
      const events = JSON.parse(localStorage.getItem('kampus_events') || '[]');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const filteredEvents = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= cutoffDate;
      });
      
      localStorage.setItem('kampus_events', JSON.stringify(filteredEvents));
      
      const removed = events.length - filteredEvents.length;
      console.log(`🗑️ Analytics: ${removed} eventos antiguos eliminados`);
      
      return removed;
    } catch (error) {
      console.error('❌ Error limpiando eventos:', error);
      return 0;
    }
  },

  /**
   * Exportar datos de analytics
   */
  export: function() {
    try {
      const events = JSON.parse(localStorage.getItem('kampus_events') || '[]');
      const stats = this.getStats();
      
      const exportData = {
        generatedAt: new Date().toISOString(),
        totalEvents: events.length,
        stats: stats,
        events: events
      };
      
      // Crear archivo para descarga
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kampus-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('📥 Analytics exportados correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error exportando analytics:', error);
      return false;
    }
  },

  // Eventos pre-definidos comunes
  events: {
    PREMIUM_ACTIVATED: 'premium_activated',
    PREMIUM_EXPIRED: 'premium_expired',
    MATERIAL_DOWNLOADED: 'material_downloaded',
    MATERIAL_UPLOADED: 'material_uploaded',
    MATERIAL_VIEWED: 'material_viewed',
    MATERIAL_FAVORITED: 'material_favorited',
    AI_SUMMARY_GENERATED: 'ai_summary_generated',
    SEARCH_PERFORMED: 'search_performed',
    PROFILE_UPDATED: 'profile_updated',
    PAYMENT_INITIATED: 'payment_initiated',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    PAGE_VIEW: 'page_view',
    DOWNLOAD_LIMIT_REACHED: 'download_limit_reached'
  }
};

// Auto-tracking de vistas de página
window.addEventListener('DOMContentLoaded', () => {
  Analytics.track(Analytics.events.PAGE_VIEW, {
    page: document.title,
    referrer: document.referrer
  });
});

// Limpiar eventos viejos al cargar (1 vez al día)
const lastCleanup = localStorage.getItem('kampus_analytics_last_cleanup');
const today = new Date().toISOString().split('T')[0];
if (lastCleanup !== today) {
  Analytics.clearOldEvents(30);
  localStorage.setItem('kampus_analytics_last_cleanup', today);
}

// Hacer Analytics disponible globalmente
window.Analytics = Analytics;

console.log('✅ Analytics System cargado');
