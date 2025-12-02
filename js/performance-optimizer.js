// ============================================
// 📊 OPTIMIZACIÓN DE RENDIMIENTO - KAMPUS
// Sistema de optimización para frontend
// ============================================

// ============================================
// Logger con niveles (debug, info, warn, error, silent)
// Configurable vía window.KAMPUS_LOG_LEVEL antes de cargar scripts.
// ============================================
// KampusLogger: logger centralizado
// Uso: window.KAMPUS_LOG_LEVEL = 'warn' (antes de cargar scripts) para limitar salida.
// Niveles disponibles: debug, info, warn, error, silent
const KampusLogger = (() => {
  const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
  const levelName = (window.KAMPUS_LOG_LEVEL || 'info').toLowerCase();
  const current = LEVELS[levelName] !== undefined ? LEVELS[levelName] : LEVELS.info;
  function out(lvl, method, args) {
    if (lvl >= current) {
      // eslint-disable-next-line no-console
      console[method](...args);
    }
  }
  return {
    setLevel(l) { if (LEVELS[l] !== undefined) this.level = LEVELS[l]; },
    debug: (...a) => out(LEVELS.debug, 'log', a),
    info:  (...a) => out(LEVELS.info, 'log', a),
    warn:  (...a) => out(LEVELS.warn, 'warn', a),
    error: (...a) => out(LEVELS.error, 'error', a),
    tip:   (...a) => out(LEVELS.debug, 'log', ['💡', ...a]) // Alias for tips
  };
})();
// Exponer globalmente para otros módulos
window.KampusLogger = KampusLogger;

// KampusDiagnostics: track errors and last error globally
window.KampusDiagnostics = (() => {
  let errorCount = 0;
  let lastError = null;
  const errorLog = [];
  const maxLogSize = 50;
  
  // Intercept KampusLogger.error calls
  const originalError = KampusLogger.error;
  KampusLogger.error = (...args) => {
    errorCount++;
    lastError = { timestamp: Date.now(), message: args.join(' ') };
    errorLog.push(lastError);
    if (errorLog.length > maxLogSize) errorLog.shift();
    originalError(...args);
  };
  
  return {
    getErrorCount: () => errorCount,
    getLastError: () => lastError,
    getErrorLog: () => [...errorLog],
    clearErrors: () => { errorCount = 0; lastError = null; errorLog.length = 0; },
    summary: () => ({
      totalErrors: errorCount,
      lastError,
      recentErrors: errorLog.slice(-10)
    })
  };
})();

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      resourcesLoaded: 0
    };
    this.observers = [];
    // Marca de inicio temprana para métricas modernas
    this.perfStart = performance.now();
    this.init();
  }

  init() {
    this.measurePageLoad();
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.monitorPerformance();
    KampusLogger.info('📊 Performance Optimizer inicializado');
  }

  // ==========================================
  // 1. MEDICIÓN DE RENDIMIENTO
  // ==========================================

  measurePageLoad() {
    // Usar PerformanceNavigationTiming si está disponible para mayor precisión
    window.addEventListener('load', () => {
      try {
        let pageLoadTime, renderTime;
        if (performance.getEntriesByType) {
          const nav = performance.getEntriesByType('navigation')[0];
          if (nav) {
            pageLoadTime = nav.loadEventEnd; // ya relativo al startTime
            // RenderTime aproximado: DOMContentLoaded evento completo
            renderTime = nav.domComplete - nav.domInteractive; // o nav.domContentLoadedEventEnd - nav.fetchStart
          }
        }
        if (pageLoadTime == null) {
          // Fallback legacy
            const t = performance.timing;
            pageLoadTime = t.loadEventEnd - t.navigationStart;
            renderTime = t.domContentLoadedEventEnd - t.domContentLoadedEventStart;
        }
        if (pageLoadTime < 0 || !isFinite(pageLoadTime)) {
          // Último recurso: diferencia contra marca manual
          pageLoadTime = performance.now() - this.perfStart;
        }
        if (renderTime < 0 || !isFinite(renderTime)) {
          renderTime = 0;
        }
        this.metrics.pageLoadTime = Math.round(pageLoadTime);
        this.metrics.renderTime = Math.round(renderTime);
        KampusLogger.info(`⏱️ Tiempo de carga: ${this.metrics.pageLoadTime} ms`);
        KampusLogger.info(`🎨 Tiempo de render: ${this.metrics.renderTime} ms`);
        this.saveMetrics();
      } catch (e) {
        KampusLogger.warn('⚠️ Error midiendo performance', e);
      }
    });
  }

  saveMetrics() {
    const metrics = JSON.parse(localStorage.getItem('kampus_metrics') || '[]');
    metrics.push({
      timestamp: Date.now(),
      page: window.location.pathname,
      ...this.metrics
    });
    
    // Mantener solo últimas 100 mediciones
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
    
    localStorage.setItem('kampus_metrics', JSON.stringify(metrics));
  }

  getAverageMetrics() {
    const metrics = JSON.parse(localStorage.getItem('kampus_metrics') || '[]');
    if (metrics.length === 0) return null;
    
    const avg = {
      pageLoadTime: 0,
      renderTime: 0,
      count: metrics.length
    };
    
    metrics.forEach(m => {
      avg.pageLoadTime += m.pageLoadTime;
      avg.renderTime += m.renderTime;
    });
    
    avg.pageLoadTime /= metrics.length;
    avg.renderTime /= metrics.length;
    
    return avg;
  }

  // ==========================================
  // 2. LAZY LOADING DE IMÁGENES
  // ==========================================

  setupLazyLoading() {
    // Usar Intersection Observer para cargar imágenes cuando sean visibles
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      });

      // Observar todas las imágenes con data-src
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => imageObserver.observe(img));
      
      this.observers.push(imageObserver);
    }
  }

  // ==========================================
  // 3. OPTIMIZACIÓN DE IMÁGENES
  // ==========================================

  setupImageOptimization() {
    // Detectar soporte WebP
    this.supportsWebP = false;
    const webpTest = new Image();
    webpTest.onload = webpTest.onerror = () => {
      this.supportsWebP = (webpTest.height === 2);
    };
    webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }

  optimizeImageUrl(url, width = null, format = 'auto') {
    // Si es imagen local, retornar original
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // Para servicios como pravatar, imgix, cloudinary, etc
    if (format === 'auto') {
      format = this.supportsWebP ? 'webp' : 'jpg';
    }

    // Agregar parámetros de optimización si es posible
    if (url.includes('pravatar.cc')) {
      return `${url}${url.includes('?') ? '&' : '?'}format=${format}`;
    }

    return url;
  }

  // ==========================================
  // 4. DEBOUNCE Y THROTTLE
  // ==========================================

  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit = 200) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ==========================================
  // 5. MONITOREO DE MEMORIA
  // ==========================================

  monitorPerformance() {
    setInterval(() => {
      if (performance.memory) {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
        
        // Alertar si uso de memoria es alto (> 100MB)
        if (this.metrics.memoryUsage > 100) {
          KampusLogger.warn('⚠️ Alto uso de memoria:', this.metrics.memoryUsage.toFixed(2), 'MB');
        }
      }
    }, 30000); // Cada 30 segundos
  }

  // ==========================================
  // 6. LIMPIEZA DE RECURSOS
  // ==========================================

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    KampusLogger.info('🧹 Recursos liberados');
  }

  // ==========================================
  // 7. VIRTUAL SCROLLING (para listas grandes)
  // ==========================================

  setupVirtualScroll(container, items, itemHeight, renderItem) {
    const containerHeight = container.clientHeight;
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const totalItems = items.length;
    let scrollTop = 0;

    const render = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems + 1, totalItems);
      
      container.innerHTML = '';
      container.style.height = (totalItems * itemHeight) + 'px';
      
      const fragment = document.createDocumentFragment();
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        item.style.position = 'absolute';
        item.style.top = (i * itemHeight) + 'px';
        item.style.height = itemHeight + 'px';
        fragment.appendChild(item);
      }
      
      container.appendChild(fragment);
    };

    container.addEventListener('scroll', this.throttle((e) => {
      scrollTop = e.target.scrollTop;
      render();
    }, 50));

    render();
  }

  // ==========================================
  // 8. PREFETCH DE PÁGINAS
  // ==========================================

  prefetchPage(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    KampusLogger.debug('🔮 Prefetching:', url);
  }

  // ==========================================
  // 9. COMPRESIÓN DE DATOS
  // ==========================================

  compressData(data) {
    // Comprimir JSON eliminando espacios
    return JSON.stringify(data);
  }

  decompressData(compressed) {
    return JSON.parse(compressed);
  }

  // ==========================================
  // 10. REPORTE DE RENDIMIENTO
  // ==========================================

  generateReport() {
    const avgMetrics = this.getAverageMetrics();
    
    const report = {
      currentPage: {
        url: window.location.href,
        loadTime: this.metrics.pageLoadTime,
        renderTime: this.metrics.renderTime,
        memoryUsage: this.metrics.memoryUsage
      },
      averages: avgMetrics,
      recommendations: []
    };

    // Generar recomendaciones
    if (avgMetrics) {
      if (avgMetrics.pageLoadTime > 3000) {
        report.recommendations.push('⚠️ Tiempo de carga alto (>3s). Considera optimizar imágenes y scripts.');
      }
      if (this.metrics.memoryUsage > 50) {
        report.recommendations.push('⚠️ Alto uso de memoria. Considera limpiar listeners y objetos no usados.');
      }
      if (avgMetrics.renderTime > 100) {
        report.recommendations.push('⚠️ Tiempo de render alto. Simplifica el DOM o usa virtual scrolling.');
      }
    }

    return report;
  }

  displayReport() {
    const report = this.generateReport();
    KampusLogger.info('📊 REPORTE DE RENDIMIENTO');
    KampusLogger.info('='.repeat(50));
    // Format table as string instead of console.table
    KampusLogger.info('Página actual:');
    KampusLogger.info(`  URL: ${report.currentPage.url}`);
    KampusLogger.info(`  Tiempo de carga: ${report.currentPage.loadTime} ms`);
    KampusLogger.info(`  Tiempo de render: ${report.currentPage.renderTime} ms`);
    KampusLogger.info(`  Uso de memoria: ${report.currentPage.memoryUsage.toFixed(2)} MB`);
    if (report.averages) {
      KampusLogger.info('\n📈 Promedios históricos:');
      KampusLogger.info(`  Tiempo de carga promedio: ${Math.round(report.averages.pageLoadTime)} ms`);
      KampusLogger.info(`  Tiempo de render promedio: ${Math.round(report.averages.renderTime)} ms`);
      KampusLogger.info(`  Total de mediciones: ${report.averages.count}`);
    }
    if (report.recommendations.length > 0) {
      KampusLogger.info('\n💡 Recomendaciones:');
      report.recommendations.forEach(r => KampusLogger.info(r));
    }
    KampusLogger.info('='.repeat(50));
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.PerformanceOptimizer = new PerformanceOptimizer();

// Comando para ver reporte
window.showPerformanceReport = () => {
  window.PerformanceOptimizer.displayReport();
};

KampusLogger.tip('Escribe showPerformanceReport() en consola para ver métricas');
