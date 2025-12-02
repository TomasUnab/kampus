// ============================================
// 🛡️ SISTEMA DE MODERACIÓN AVANZADA - KAMPUS
// Detección de spam, contenido inapropiado y reportes
// ============================================

class ModerationSystem {
  constructor() {
    this.reportsKey = 'kampus_reports';
    this.blacklistKey = 'kampus_blacklist';
    this.moderationLogKey = 'kampus_moderation_log';
    this.init();
  }

  init() {
    this.loadBlacklist();
    (window.KampusLogger?.info || console.log)('🛡️ Sistema de Moderación inicializado');
  }

  // ==========================================
  // 1. FILTRO DE PALABRAS PROHIBIDAS
  // ==========================================

  badWords = [
    // Agregar palabras prohibidas aquí
    'spam', 'scam', 'hack', 'virus'
  ];

  containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return this.badWords.some(word => lowerText.includes(word));
  }

  filterBadWords(text) {
    let filtered = text;
    this.badWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '***');
    });
    return filtered;
  }

  // ==========================================
  // 2. DETECCIÓN DE SPAM
  // ==========================================

  isSpam(content, metadata = {}) {
    const checks = {
      tooManyLinks: this.hasTooManyLinks(content),
      repeatedText: this.hasRepeatedText(content),
      capsLock: this.hasTooManyCaps(content),
      suspiciousPatterns: this.hasSuspiciousPatterns(content),
      tooFrequent: metadata.lastPostTime && (Date.now() - metadata.lastPostTime < 10000) // < 10 segundos
    };

    const spamScore = Object.values(checks).filter(Boolean).length;
    
    return {
      isSpam: spamScore >= 2,
      score: spamScore,
      reasons: Object.entries(checks).filter(([_, value]) => value).map(([key]) => key)
    };
  }

  hasTooManyLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches && matches.length > 3;
  }

  hasRepeatedText(text) {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.values(wordCount).some(count => count > 5);
  }

  hasTooManyCaps(text) {
    const caps = text.replace(/[^A-Z]/g, '').length;
    const total = text.replace(/[^A-Za-z]/g, '').length;
    return total > 10 && (caps / total) > 0.7; // >70% mayúsculas
  }

  hasSuspiciousPatterns(text) {
    const suspiciousPatterns = [
      /click\s+here/i,
      /gana\s+dinero/i,
      /free\s+money/i,
      /descarga\s+aqui/i,
      /haz\s+click/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  // ==========================================
  // 3. SISTEMA DE REPORTES
  // ==========================================

  report(item) {
    const reportId = 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const report = {
      id: reportId,
      itemId: item.itemId,
      itemType: item.itemType, // material, comment, user
      reason: item.reason,
      description: item.description || '',
      reportedBy: item.reportedBy,
      reportedAt: Date.now(),
      status: 'pending', // pending, reviewing, resolved, dismissed
      severity: this.calculateSeverity(item.reason),
      metadata: item.metadata || {}
    };

    const reports = this.getReports();
    reports.push(report);
    localStorage.setItem(this.reportsKey, JSON.stringify(reports));

    // Log de moderación
    this.logAction('report_created', report);

    // Notificación a moderadores
    if (window.NotificationSystem) {
      window.NotificationSystem.notify({
        title: '🚨 Nuevo Reporte',
        message: `${item.itemType} reportado por ${item.reason}`,
        type: 'warning',
        data: { reportId }
      });
    }

  (window.KampusLogger?.info || console.log)('🚨 Nuevo reporte:', reportId);
    return report;
  }

  getReports(filters = {}) {
    const stored = localStorage.getItem(this.reportsKey);
    let reports = stored ? JSON.parse(stored) : [];

    // Aplicar filtros
    if (filters.status) {
      reports = reports.filter(r => r.status === filters.status);
    }
    if (filters.itemType) {
      reports = reports.filter(r => r.itemType === filters.itemType);
    }
    if (filters.severity) {
      reports = reports.filter(r => r.severity === filters.severity);
    }

    return reports;
  }

  getReportById(reportId) {
    const reports = this.getReports();
    return reports.find(r => r.id === reportId);
  }

  updateReportStatus(reportId, status, resolution = '') {
    const reports = this.getReports();
    const report = reports.find(r => r.id === reportId);
    
    if (report) {
      report.status = status;
      report.resolution = resolution;
      report.resolvedAt = Date.now();
      
      localStorage.setItem(this.reportsKey, JSON.stringify(reports));
      this.logAction('report_updated', { reportId, status, resolution });
      
      return true;
    }
    return false;
  }

  calculateSeverity(reason) {
    const severityMap = {
      'spam': 'low',
      'inappropriate': 'medium',
      'harassment': 'high',
      'illegal': 'critical',
      'copyright': 'high',
      'misleading': 'medium',
      'other': 'low'
    };
    return severityMap[reason] || 'medium';
  }

  // ==========================================
  // 4. BLACKLIST (usuarios/contenido bloqueado)
  // ==========================================

  loadBlacklist() {
    const stored = localStorage.getItem(this.blacklistKey);
    this.blacklist = stored ? JSON.parse(stored) : {
      users: [],
      emails: [],
      ips: [],
      keywords: []
    };
  }

  saveBlacklist() {
    localStorage.setItem(this.blacklistKey, JSON.stringify(this.blacklist));
  }

  addToBlacklist(type, value, reason = '') {
    if (!this.blacklist[type]) {
  (window.KampusLogger?.error || console.error)('Tipo de blacklist inválido:', type);
      return false;
    }

    this.blacklist[type].push({
      value,
      reason,
      addedAt: Date.now()
    });

    this.saveBlacklist();
    this.logAction('blacklist_add', { type, value, reason });
    
  (window.KampusLogger?.info || console.log)('🚫 Añadido a blacklist:', type, value);
    return true;
  }

  removeFromBlacklist(type, value) {
    if (!this.blacklist[type]) return false;

    this.blacklist[type] = this.blacklist[type].filter(item => item.value !== value);
    this.saveBlacklist();
    this.logAction('blacklist_remove', { type, value });
    
    return true;
  }

  isBlacklisted(type, value) {
    if (!this.blacklist[type]) return false;
    return this.blacklist[type].some(item => item.value === value);
  }

  // ==========================================
  // 5. ANÁLISIS DE CONTENIDO
  // ==========================================

  analyzeContent(content) {
    const analysis = {
      badWords: this.containsBadWords(content.text),
      spam: this.isSpam(content.text, content.metadata),
      blacklisted: false,
      score: 0,
      issues: []
    };

    if (analysis.badWords) {
      analysis.issues.push('Contiene palabras prohibidas');
      analysis.score += 3;
    }

    if (analysis.spam.isSpam) {
      analysis.issues.push('Detectado como spam');
      analysis.score += analysis.spam.score;
    }

    if (content.userId && this.isBlacklisted('users', content.userId)) {
      analysis.blacklisted = true;
      analysis.issues.push('Usuario en blacklist');
      analysis.score += 10;
    }

    analysis.approved = analysis.score < 3;
    analysis.requiresReview = analysis.score >= 3 && analysis.score < 10;
    analysis.blocked = analysis.score >= 10;

    return analysis;
  }

  // ==========================================
  // 6. COLA DE MODERACIÓN
  // ==========================================

  addToQueue(item) {
    const queue = this.getModerationQueue();
    
    const queueItem = {
      id: 'queue_' + Date.now(),
      ...item,
      addedAt: Date.now(),
      status: 'pending',
      analysis: this.analyzeContent(item)
    };

    queue.push(queueItem);
    localStorage.setItem('kampus_moderation_queue', JSON.stringify(queue));
    
    return queueItem;
  }

  getModerationQueue(status = null) {
    const stored = localStorage.getItem('kampus_moderation_queue');
    let queue = stored ? JSON.parse(stored) : [];
    
    if (status) {
      queue = queue.filter(item => item.status === status);
    }
    
    return queue;
  }

  processQueueItem(itemId, action, reason = '') {
    const queue = this.getModerationQueue();
    const item = queue.find(i => i.id === itemId);
    
    if (!item) return false;

    item.status = action; // approved, rejected
    item.processedAt = Date.now();
    item.reason = reason;
    
    localStorage.setItem('kampus_moderation_queue', JSON.stringify(queue));
    this.logAction('queue_processed', { itemId, action, reason });
    
    return true;
  }

  // ==========================================
  // 7. VALIDACIÓN DE ARCHIVOS
  // ==========================================

  validateFile(file) {
    const validation = {
      valid: true,
      issues: []
    };

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      validation.valid = false;
      validation.issues.push('Tipo de archivo no permitido');
    }

    // Validar tamaño (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      validation.valid = false;
      validation.issues.push('Archivo muy grande (>50MB)');
    }

    // Validar nombre
    if (this.containsBadWords(file.name)) {
      validation.valid = false;
      validation.issues.push('Nombre de archivo contiene palabras prohibidas');
    }

    return validation;
  }

  // ==========================================
  // 8. RATE LIMITING
  // ==========================================

  checkRateLimit(userId, action, limit = 10, windowMs = 60000) {
    const key = `ratelimit_${userId}_${action}`;
    const stored = localStorage.getItem(key);
    const now = Date.now();

    let data = stored ? JSON.parse(stored) : { count: 0, windowStart: now };

    // Reset si pasó la ventana de tiempo
    if (now - data.windowStart > windowMs) {
      data = { count: 0, windowStart: now };
    }

    data.count++;
    localStorage.setItem(key, JSON.stringify(data));

    const exceeded = data.count > limit;
    
    if (exceeded) {
  (window.KampusLogger?.warn || console.warn)('⚠️ Rate limit excedido:', userId, action);
      this.logAction('rate_limit_exceeded', { userId, action, count: data.count });
    }

    return {
      exceeded,
      remaining: Math.max(0, limit - data.count),
      resetAt: data.windowStart + windowMs
    };
  }

  // ==========================================
  // 9. LOG DE MODERACIÓN
  // ==========================================

  logAction(action, data) {
    const log = this.getModerationLog();
    
    log.push({
      action,
      data,
      timestamp: Date.now(),
      moderator: window.SessionManager?.getCurrentUser()?.id || 'system'
    });

    // Mantener solo últimas 1000 entradas
    if (log.length > 1000) {
      log.splice(0, log.length - 1000);
    }

    localStorage.setItem(this.moderationLogKey, JSON.stringify(log));
  }

  getModerationLog(filters = {}) {
    const stored = localStorage.getItem(this.moderationLogKey);
    let log = stored ? JSON.parse(stored) : [];

    if (filters.action) {
      log = log.filter(entry => entry.action === filters.action);
    }

    if (filters.from) {
      log = log.filter(entry => entry.timestamp >= filters.from);
    }

    if (filters.to) {
      log = log.filter(entry => entry.timestamp <= filters.to);
    }

    return log;
  }

  // ==========================================
  // 10. ESTADÍSTICAS DE MODERACIÓN
  // ==========================================

  getStats() {
    const reports = this.getReports();
    const queue = this.getModerationQueue();
    const log = this.getModerationLog();

    return {
      reports: {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        bySeverity: {
          low: reports.filter(r => r.severity === 'low').length,
          medium: reports.filter(r => r.severity === 'medium').length,
          high: reports.filter(r => r.severity === 'high').length,
          critical: reports.filter(r => r.severity === 'critical').length
        }
      },
      queue: {
        total: queue.length,
        pending: queue.filter(i => i.status === 'pending').length,
        approved: queue.filter(i => i.status === 'approved').length,
        rejected: queue.filter(i => i.status === 'rejected').length
      },
      blacklist: {
        users: this.blacklist.users.length,
        emails: this.blacklist.emails.length,
        keywords: this.blacklist.keywords.length
      },
      actions: {
        total: log.length,
        last24h: log.filter(entry => entry.timestamp > Date.now() - 86400000).length
      }
    };
  }

  displayStats() {
    const stats = this.getStats();
    (window.KampusLogger?.info || console.log)('🛡️ ESTADÍSTICAS DE MODERACIÓN');
    (window.KampusLogger?.info || console.log)('='.repeat(50));
    (window.KampusLogger?.info || console.log)('\n📋 Reportes:');
    (window.KampusLogger?.info || console.log)(`  Total: ${stats.reports.total}`);
    (window.KampusLogger?.info || console.log)(`  Pendientes: ${stats.reports.pending}`);
    (window.KampusLogger?.info || console.log)(`  En Revisión: ${stats.reports.reviewing}`);
    (window.KampusLogger?.info || console.log)(`  Resueltos: ${stats.reports.resolved}`);
    (window.KampusLogger?.info || console.log)('\n⏳ Cola de Moderación:');
    (window.KampusLogger?.info || console.log)(`  Pendientes: ${stats.queue.pending}`);
    (window.KampusLogger?.info || console.log)(`  Aprobados: ${stats.queue.approved}`);
    (window.KampusLogger?.info || console.log)(`  Rechazados: ${stats.queue.rejected}`);
    (window.KampusLogger?.info || console.log)('\n🚫 Blacklist:');
    (window.KampusLogger?.info || console.log)(`  Usuarios: ${stats.blacklist.users}`);
    (window.KampusLogger?.info || console.log)(`  Emails: ${stats.blacklist.emails}`);
    (window.KampusLogger?.info || console.log)(`  Keywords: ${stats.blacklist.keywords}`);
    (window.KampusLogger?.info || console.log)('\n📊 Acciones:');
    (window.KampusLogger?.info || console.log)(`  Últimas 24h: ${stats.actions.last24h}`);
    (window.KampusLogger?.info || console.log)(`  Última semana: ${stats.actions.lastWeek}`);
    (window.KampusLogger?.info || console.log)('='.repeat(50));
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.ModerationSystem = new ModerationSystem();

// Comando para ver estadísticas
window.showModerationStats = () => {
  window.ModerationSystem.displayStats();
};

// Ejemplo de uso
window.testModeration = () => {
  const testContent = {
    text: 'CLICK HERE FOR FREE MONEY!!! spam spam spam',
    userId: 'user_123',
    metadata: { lastPostTime: Date.now() - 5000 }
  };
  
  const analysis = window.ModerationSystem.analyzeContent(testContent);
  (window.KampusLogger?.debug || console.log)('Análisis de contenido:', analysis);
};

(window.KampusLogger?.tip || console.log)('Escribe showModerationStats() para ver estadísticas de moderación');
