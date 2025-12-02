// ============================================
// 💾 SISTEMA DE CACHÉ INTELIGENTE - KAMPUS
// Cache avanzado con expiración y prioridades
// ============================================

class CacheManager {
  constructor() {
    this.cachePrefix = 'kampus_cache_';
    this.metadataKey = 'kampus_cache_metadata';
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB
    this.init();
  }

  init() {
    this.cleanExpiredCache();
    this.setupServiceWorker();
    (window.KampusLogger?.info || console.log)('💾 Cache Manager inicializado');
  }

  // ==========================================
  // 1. CACHÉ BÁSICO CON EXPIRACIÓN
  // ==========================================

  set(key, data, options = {}) {
    const defaults = {
      ttl: 3600000, // 1 hora por defecto
      priority: 'normal', // low, normal, high
      compress: false
    };

    const config = { ...defaults, ...options };

    const cacheEntry = {
      key,
      data: config.compress ? this.compress(data) : data,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.ttl,
      priority: config.priority,
      compressed: config.compress,
      size: JSON.stringify(data).length
    };

    try {
      // Verificar espacio disponible
      if (!this.hasSpace(cacheEntry.size)) {
        this.evictLowPriority(cacheEntry.size);
      }

      localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheEntry));
      this.updateMetadata(key, cacheEntry);
      
      (window.KampusLogger?.debug || console.log)('✅ Cache guardado:', key, `(${(cacheEntry.size / 1024).toFixed(2)}KB)`);
      return true;
    } catch (e) {
      (window.KampusLogger?.error || console.error)('❌ Error al guardar cache:', e);
      return false;
    }
  }

  get(key, defaultValue = null) {
    const cacheKey = this.cachePrefix + key;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return defaultValue;
    }

    try {
      const entry = JSON.parse(cached);

      // Verificar expiración
      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        (window.KampusLogger?.debug || console.log)('⏰ Cache expirado:', key);
        return defaultValue;
      }

      // Actualizar último acceso
      this.touchEntry(key);

      // Retornar datos (descomprimir si es necesario)
      const data = entry.compressed ? this.decompress(entry.data) : entry.data;
      (window.KampusLogger?.debug || console.log)('✅ Cache recuperado:', key);
      return data;

    } catch (e) {
      (window.KampusLogger?.error || console.error)('❌ Error al leer cache:', e);
      return defaultValue;
    }
  }

  delete(key) {
    localStorage.removeItem(this.cachePrefix + key);
    this.removeMetadata(key);
  }

  // ==========================================
  // 2. CACHÉ CON CALLBACK (fetch on miss)
  // ==========================================

  async getOrFetch(key, fetchFn, options = {}) {
    // Intentar obtener de cache
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en cache, ejecutar función
    (window.KampusLogger?.info || console.log)('🔄 Cache miss, fetching:', key);
    try {
      const data = await fetchFn();
      this.set(key, data, options);
      return data;
    } catch (e) {
      (window.KampusLogger?.error || console.error)('❌ Error al fetch:', e);
      throw e;
    }
  }

  // ==========================================
  // 3. CACHÉ DE BÚSQUEDAS
  // ==========================================

  cacheSearch(query, results, ttl = 300000) { // 5 minutos
    const key = 'search_' + this.hashString(query);
    this.set(key, results, { ttl, priority: 'normal' });
  }

  getCachedSearch(query) {
    const key = 'search_' + this.hashString(query);
    return this.get(key);
  }

  // ==========================================
  // 4. CACHÉ DE MATERIALES
  // ==========================================

  cacheMaterial(materialId, data, ttl = 3600000) { // 1 hora
    this.set(`material_${materialId}`, data, { 
      ttl, 
      priority: 'high',
      compress: true 
    });
  }

  getCachedMaterial(materialId) {
    return this.get(`material_${materialId}`);
  }

  // ==========================================
  // 5. CACHÉ DE IMÁGENES (Base64)
  // ==========================================

  async cacheImage(url, ttl = 86400000) { // 24 horas
    const key = 'img_' + this.hashString(url);
    
    // Verificar si ya está en cache
    const cached = this.get(key);
    if (cached) return cached;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      
      this.set(key, base64, { ttl, priority: 'low', compress: false });
      return base64;
    } catch (e) {
      console.error('❌ Error al cachear imagen:', e);
      return url;
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ==========================================
  // 6. GESTIÓN DE METADATA
  // ==========================================

  updateMetadata(key, entry) {
    const metadata = this.getMetadata();
    metadata[key] = {
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt,
      priority: entry.priority,
      size: entry.size,
      lastAccess: Date.now()
    };
    localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
  }

  removeMetadata(key) {
    const metadata = this.getMetadata();
    delete metadata[key];
    localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
  }

  getMetadata() {
    const metadata = localStorage.getItem(this.metadataKey);
    return metadata ? JSON.parse(metadata) : {};
  }

  touchEntry(key) {
    const metadata = this.getMetadata();
    if (metadata[key]) {
      metadata[key].lastAccess = Date.now();
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    }
  }

  // ==========================================
  // 7. LIMPIEZA Y EVICCIÓN
  // ==========================================

  cleanExpiredCache() {
    const metadata = this.getMetadata();
    const now = Date.now();
    let cleaned = 0;

    Object.keys(metadata).forEach(key => {
      if (now > metadata[key].expiresAt) {
        this.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log('🧹 Limpieza de cache:', cleaned, 'entradas eliminadas');
    }
  }

  hasSpace(requiredSize) {
    const currentSize = this.getTotalCacheSize();
    return (currentSize + requiredSize) <= this.maxCacheSize;
  }

  getTotalCacheSize() {
    const metadata = this.getMetadata();
    return Object.values(metadata).reduce((total, entry) => total + entry.size, 0);
  }

  evictLowPriority(requiredSize) {
    const metadata = this.getMetadata();
    const entries = Object.entries(metadata);

    // Ordenar por prioridad (low primero) y último acceso
    entries.sort((a, b) => {
      const priorityOrder = { low: 0, normal: 1, high: 2 };
      const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a[1].lastAccess - b[1].lastAccess;
    });

    let freedSpace = 0;
    let evicted = 0;

    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSize) break;
      
      this.delete(key);
      freedSpace += entry.size;
      evicted++;
    }

    (window.KampusLogger?.info || console.log)('🗑️ Eviction:', evicted, 'entradas eliminadas,', (freedSpace / 1024).toFixed(2), 'KB liberados');
  }

  clearAll() {
    const metadata = this.getMetadata();
    Object.keys(metadata).forEach(key => {
      localStorage.removeItem(this.cachePrefix + key);
    });
    localStorage.removeItem(this.metadataKey);
    (window.KampusLogger?.info || console.log)('🗑️ Todo el cache ha sido limpiado');
  }

  clearByPattern(pattern) {
    const metadata = this.getMetadata();
    const regex = new RegExp(pattern);
    let cleared = 0;

    Object.keys(metadata).forEach(key => {
      if (regex.test(key)) {
        this.delete(key);
        cleared++;
      }
    });

    (window.KampusLogger?.info || console.log)('🗑️ Cache limpiado:', cleared, 'entradas eliminadas (patrón:', pattern + ')');
  }

  // ==========================================
  // 8. UTILIDADES
  // ==========================================

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  compress(data) {
    // Compresión simple (en producción usar pako.js o similar)
    return JSON.stringify(data);
  }

  decompress(data) {
    return JSON.parse(data);
  }

  // ==========================================
  // 9. SERVICE WORKER (opcional)
  // ==========================================

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      // Registrar service worker si existe
      // (crear archivo service-worker.js por separado)
      // navigator.serviceWorker.register('/service-worker.js');
    }
  }

  // ==========================================
  // 10. ESTADÍSTICAS
  // ==========================================

  getStats() {
    const metadata = this.getMetadata();
    const entries = Object.values(metadata);

    const stats = {
      totalEntries: entries.length,
      totalSize: this.getTotalCacheSize(),
      totalSizeFormatted: (this.getTotalCacheSize() / 1024 / 1024).toFixed(2) + ' MB',
      maxSize: this.maxCacheSize,
      percentUsed: ((this.getTotalCacheSize() / this.maxCacheSize) * 100).toFixed(2) + '%',
      byPriority: {
        low: entries.filter(e => e.priority === 'low').length,
        normal: entries.filter(e => e.priority === 'normal').length,
        high: entries.filter(e => e.priority === 'high').length
      },
      oldestEntry: entries.reduce((oldest, entry) => 
        !oldest || entry.timestamp < oldest.timestamp ? entry : oldest
      , null),
      newestEntry: entries.reduce((newest, entry) => 
        !newest || entry.timestamp > newest.timestamp ? entry : newest
      , null)
    };

    return stats;
  }

  displayStats() {
    const stats = this.getStats();
    (window.KampusLogger?.info || console.log)('📊 ESTADÍSTICAS DE CACHÉ');
    (window.KampusLogger?.info || console.log)('='.repeat(50));
    (window.KampusLogger?.info || console.log)('Total de entradas:', stats.totalEntries);
    (window.KampusLogger?.info || console.log)('Tamaño total:', stats.totalSizeFormatted);
    (window.KampusLogger?.info || console.log)('Uso:', stats.percentUsed);
    (window.KampusLogger?.info || console.log)('\nPor prioridad:');
    (window.KampusLogger?.info || console.log)(`  Low: ${stats.byPriority.low}`);
    (window.KampusLogger?.info || console.log)(`  Normal: ${stats.byPriority.normal}`);
    (window.KampusLogger?.info || console.log)(`  High: ${stats.byPriority.high}`);
    (window.KampusLogger?.info || console.log)('='.repeat(50));
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.CacheManager = new CacheManager();

// Limpiar cache expirado cada 5 minutos
setInterval(() => {
  window.CacheManager.cleanExpiredCache();
}, 5 * 60 * 1000);

// Comando para ver estadísticas
window.showCacheStats = () => {
  window.CacheManager.displayStats();
};

(window.KampusLogger?.tip || console.log)('Escribe showCacheStats() en consola para ver estadísticas de caché');
