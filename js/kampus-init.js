// ============================================
// 🚀 KAMPUS - INICIALIZACIÓN DE SISTEMAS
// Carga e inicializa todos los sistemas principales
// ============================================

(function() {
  'use strict';

  // ==========================================
  // 1. VERIFICAR DEPENDENCIAS
  // ==========================================
  
  const requiredSystems = [
    'SessionManager',
    'PerformanceOptimizer', 
    'CacheManager',
    'NotificationSystem',
    'ModerationSystem'
  ];

  function checkSystems() {
    const missing = requiredSystems.filter(system => !window[system]);
    
    if (missing.length > 0) {
  (window.KampusLogger?.warn || console.warn)('⚠️ Sistemas faltantes:', missing.join(', '));
  (window.KampusLogger?.info || console.log)('💡 Asegúrate de cargar todos los scripts antes de kampus-init.js');
    } else {
  (window.KampusLogger?.info || console.log)('✅ Todos los sistemas cargados correctamente');
    }
  }

  // ==========================================
  // 2. CONFIGURACIÓN GLOBAL
  // ==========================================

  window.KampusConfig = {
    // Sesiones
    sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 días
    
    // Cache
    cache: {
      maxSize: 50 * 1024 * 1024, // 50MB
      ttl: {
        search: 5 * 60 * 1000, // 5 minutos
        material: 60 * 60 * 1000, // 1 hora
        image: 24 * 60 * 60 * 1000, // 24 horas
        user: 30 * 60 * 1000 // 30 minutos
      }
    },

    // Notificaciones
    notifications: {
      position: 'top-right',
      duration: 3000,
      maxPersistent: 100
    },

    // Moderación
    moderation: {
      autoApprove: true, // Auto-aprobar contenido con score < 3
      requireReview: true, // Enviar a cola si score >= 3
      autoBlock: true, // Auto-bloquear si score >= 10
      rateLimits: {
        upload: { limit: 10, window: 3600000 }, // 10 uploads por hora
        comment: { limit: 30, window: 3600000 }, // 30 comentarios por hora
        report: { limit: 5, window: 3600000 } // 5 reportes por hora
      }
    },

    // Performance
    performance: {
      lazyLoadImages: true,
      virtualScroll: true,
      virtualScrollThreshold: 100 // items
    }
  };

  // ==========================================
  // 3. HELPERS GLOBALES
  // ==========================================

  window.Kampus = {
    // Usuario actual
    getCurrentUser() {
      return window.SessionManager?.getCurrentUser() || null;
    },

    // Verificar si está logueado
    isLoggedIn() {
      return window.SessionManager?.isLoggedIn() || false;
    },

    // Verificar premium
    isPremium() {
      const user = this.getCurrentUser();
      return user?.isPremium || false;
    },

    // ==========================================
    // VERIFICACIÓN DE ROLES Y PERMISOS
    // ==========================================

    // Verificar si es administrador
    isAdmin() {
      return window.SessionManager?.isAdmin() || false;
    },

    // Verificar si es moderador o admin
    isModerator() {
      return window.SessionManager?.isModerator() || false;
    },

    // Obtener rol del usuario actual
    getUserRole() {
      return window.SessionManager?.getUserRole() || null;
    },

    // Verificar permiso específico
    hasPermission(permission) {
      return window.SessionManager?.hasPermission(permission) || false;
    },

    // Requerir rol mínimo
    requireRole(role, redirectUrl) {
      return window.SessionManager?.requireRole(role, redirectUrl) || false;
    },

    // Obtener badge de rol (para UI)
    getRoleBadge() {
      const user = this.getCurrentUser();
      if (!user) return null;

      const badges = {
        'admin': { text: 'ADMIN', color: 'bg-red-500 text-white', icon: '👑' },
        'moderator': { text: 'MOD', color: 'bg-yellow-500 text-white', icon: '⚡' },
        'user': { text: 'USER', color: 'bg-gray-500 text-white', icon: '👤' }
      };

      return badges[user.role] || badges['user'];
    },

    // Mostrar notificación
    notify(message, type = 'info') {
      if (window.NotificationSystem) {
        window.NotificationSystem[type](message);
      } else {
        alert(message);
      }
    },

    // Cache helper
    cache: {
      get(key) {
        return window.CacheManager?.get(key);
      },
      set(key, value, options = {}) {
        return window.CacheManager?.set(key, value, options);
      },
      getOrFetch(key, fetchFn, options = {}) {
        return window.CacheManager?.getOrFetch(key, fetchFn, options);
      }
    },

    // Moderar contenido
    moderateContent(content) {
      if (!window.ModerationSystem) return { approved: true };
      
      const analysis = window.ModerationSystem.analyzeContent(content);
      const config = window.KampusConfig.moderation;

      // Auto-aprobar
      if (config.autoApprove && analysis.approved) {
        return { approved: true, analysis };
      }

      // Enviar a cola de revisión
      if (config.requireReview && analysis.requiresReview) {
        window.ModerationSystem.addToQueue(content);
        return { approved: false, requiresReview: true, analysis };
      }

      // Auto-bloquear
      if (config.autoBlock && analysis.blocked) {
        this.notify('Contenido bloqueado por el sistema de moderación', 'error');
        return { approved: false, blocked: true, analysis };
      }

      return { approved: true, analysis };
    },

    // Rate limit check
    checkRateLimit(action, limit, window) {
      const user = this.getCurrentUser();
      if (!user || !window.ModerationSystem) return { exceeded: false };

      const rateLimitConfig = window.KampusConfig.moderation.rateLimits[action];
      if (rateLimitConfig) {
        limit = rateLimitConfig.limit;
        window = rateLimitConfig.window;
      }

      return window.ModerationSystem.checkRateLimit(user.id, action, limit, window);
    }
  };

  // ==========================================
  // 4. INICIALIZACIÓN AUTOMÁTICA
  // ==========================================

  function init() {
  (window.KampusLogger?.info || console.log)('🚀 Iniciando KAMPUS...');
    
    // Verificar sistemas
    checkSystems();

    // Configurar performance
    if (window.PerformanceOptimizer && window.KampusConfig.performance.lazyLoadImages) {
      window.PerformanceOptimizer.setupLazyLoading();
    }

    // Limpiar cache antiguo
    if (window.CacheManager) {
      window.CacheManager.cleanExpiredCache(); // Nombre correcto del método
    }

    // Limpiar notificaciones antiguas
    if (window.NotificationSystem) {
      const oldNotifs = window.NotificationSystem.notifications.filter(n => {
        const age = Date.now() - n.timestamp;
        return age > (30 * 24 * 60 * 60 * 1000); // 30 días
      });
      oldNotifs.forEach(n => window.NotificationSystem.delete(n.id));
    }

    // Mostrar info de usuario
    const user = window.Kampus.getCurrentUser();
    if (user) {
  (window.KampusLogger?.info || console.log)('👤 Usuario:', user.name, user.isPremium ? '⭐ PREMIUM' : '');
    }

  (window.KampusLogger?.info || console.log)('✅ KAMPUS inicializado correctamente');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==========================================
  // 5. COMANDOS DE CONSOLA
  // ==========================================

  window.kampusStatus = () => {
    (window.KampusLogger?.info || console.log)('='.repeat(60));
    (window.KampusLogger?.info || console.log)('📊 KAMPUS - ESTADO DEL SISTEMA');
    (window.KampusLogger?.info || console.log)('='.repeat(60));
    
    const user = window.Kampus.getCurrentUser();
    (window.KampusLogger?.info || console.log)('\n👤 Usuario:');
    if (user) {
      (window.KampusLogger?.info || console.log)(`  Nombre: ${user.name}`);
      (window.KampusLogger?.info || console.log)(`  Email: ${user.email}`);
      (window.KampusLogger?.info || console.log)(`  Rol: ${user.role}`);
      (window.KampusLogger?.info || console.log)(`  Premium: ${user.isPremium ? 'Sí' : 'No'}`);
    } else {
      (window.KampusLogger?.info || console.log)('  No logueado');
    }

    if (window.CacheManager) {
      (window.KampusLogger?.info || console.log)('\n💾 Cache:');
      const cacheStats = window.CacheManager.getStats();
      (window.KampusLogger?.info || console.log)(`  Total entradas: ${cacheStats.totalEntries}`);
      (window.KampusLogger?.info || console.log)(`  Tamaño: ${cacheStats.totalSizeFormatted}`);
      (window.KampusLogger?.info || console.log)(`  Uso: ${cacheStats.percentUsed}`);
    }

    if (window.NotificationSystem) {
      (window.KampusLogger?.info || console.log)('\n🔔 Notificaciones:');
      const notifs = window.NotificationSystem.getAll();
      (window.KampusLogger?.info || console.log)(`  Total: ${notifs.length}, No leídas: ${notifs.filter(n => !n.read).length}`);
    }

    if (window.ModerationSystem) {
      (window.KampusLogger?.info || console.log)('\n🛡️ Moderación:');
      const stats = window.ModerationSystem.getStats();
      (window.KampusLogger?.info || console.log)(`  Reportes Pendientes: ${stats.reports.pending}`);
      (window.KampusLogger?.info || console.log)(`  Cola de Moderación: ${stats.queue.pending}`);
      (window.KampusLogger?.info || console.log)(`  Usuarios Bloqueados: ${stats.blacklist.users}`);
    }

    if (window.PerformanceOptimizer) {
      (window.KampusLogger?.info || console.log)('\n⚡ Performance:');
      const metrics = window.PerformanceOptimizer.metrics;
      (window.KampusLogger?.info || console.log)(`  Tiempo de Carga: ${metrics.pageLoadTime}ms`);
      (window.KampusLogger?.info || console.log)(`  Uso de Memoria: ${metrics.memoryUsage.toFixed(2)}MB`);
    }
    
    if (window.KampusDiagnostics) {
      (window.KampusLogger?.info || console.log)('\n⚠️ Diagnósticos:');
      (window.KampusLogger?.info || console.log)(`  Errores totales: ${window.KampusDiagnostics.getErrorCount()}`);
      const lastError = window.KampusDiagnostics.getLastError();
      if (lastError) {
        (window.KampusLogger?.info || console.log)(`  Último error: ${lastError.message}`);
      }
    }

    (window.KampusLogger?.info || console.log)('\n' + '='.repeat(60));
  };

  (window.KampusLogger?.tip || console.log)('Escribe kampusStatus() para ver el estado completo del sistema');

})();
