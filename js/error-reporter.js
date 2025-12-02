// ============================================
// 📡 ERROR REPORTER - KAMPUS
// Envía errores a endpoint remoto en batch
// ============================================

class ErrorReporter {
  constructor() {
    this.endpoint = window.KAMPUS_ERROR_ENDPOINT || null; // ej: 'https://api.kampus.com/errors'
    this.batchSize = 10;
    this.flushInterval = 60000; // 1 min
    this.errorQueue = [];
    this.enabled = !!this.endpoint;
    
    if (this.enabled) {
      this.init();
    }
  }

  init() {
    // Flush periódico
    setInterval(() => this.flush(), this.flushInterval);
    
    // Flush antes de cerrar página
    window.addEventListener('beforeunload', () => this.flush(true));
    
    // Interceptar errores globales
    window.addEventListener('error', (e) => {
      this.captureError({
        type: 'global',
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        col: e.colno,
        stack: e.error?.stack
      });
    });
    
    // Promesas no manejadas
    window.addEventListener('unhandledrejection', (e) => {
      this.captureError({
        type: 'promise',
        message: e.reason?.message || String(e.reason),
        stack: e.reason?.stack
      });
    });
    
    (window.KampusLogger?.debug || console.log)('📡 Error Reporter inicializado');
  }

  captureError(error) {
    if (!this.enabled) return;
    
    const enrichedError = {
      ...error,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      user: window.Kampus?.getCurrentUser?.()?.email || 'anonymous'
    };
    
    this.errorQueue.push(enrichedError);
    
    // Si llegamos al batch size, enviar inmediatamente
    if (this.errorQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(sync = false) {
    if (!this.enabled || this.errorQueue.length === 0) return;
    
    const batch = [...this.errorQueue];
    this.errorQueue = [];
    
    const payload = {
      app: 'kampus',
      version: '1.0.0',
      errors: batch
    };
    
    try {
      if (sync && navigator.sendBeacon) {
        // Envío síncrono (útil en beforeunload)
        navigator.sendBeacon(
          this.endpoint,
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
      } else {
        // Envío asíncrono normal
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
      }
      (window.KampusLogger?.debug || console.log)(`📡 Enviados ${batch.length} errores`);
    } catch (e) {
      // Si falla el envío, reencolar (máx 50 para evitar crecimiento infinito)
      if (this.errorQueue.length < 50) {
        this.errorQueue.unshift(...batch);
      }
      (window.KampusLogger?.error || console.error)('❌ Error al enviar errores:', e);
    }
  }

  // Manual capture
  report(error) {
    this.captureError({
      type: 'manual',
      message: error.message || String(error),
      stack: error.stack
    });
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.ErrorReporter = new ErrorReporter();

// Helper para reportar manualmente
window.reportError = (error) => {
  window.ErrorReporter.report(error);
};
