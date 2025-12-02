// ============================================
// 🔐 SISTEMA DE SEGURIDAD MEJORADO - KAMPUS
// Encriptación robusta, validación y sanitización
// ============================================

class SecurityManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupCSP();
    this.setupXSSProtection();
    (window.KampusLogger?.info || console.log)('🔐 Security Manager inicializado');
  }

  // ==========================================
  // ENCRIPTACIÓN ROBUSTA (AES-like simulation)
  // ==========================================
  
  async encrypt(data, password = 'KAMPUS_SECRET_2025') {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      const passwordBuffer = encoder.encode(password);
      
      // Generar salt aleatorio
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Derivar clave usando PBKDF2
      const key = await crypto.subtle.importKey(
        'raw', passwordBuffer, 'PBKDF2', false, ['deriveBits', 'deriveKey']
      );
      
      const derivedKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        key, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
      );
      
      // Generar IV aleatorio
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encriptar
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, derivedKey, dataBuffer
      );
      
      // Combinar salt + iv + datos encriptados
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return btoa(String.fromCharCode(...result));
    } catch (e) {
      (window.KampusLogger?.error || console.error)('❌ Error encriptando:', e);
      return this.fallbackEncrypt(data, password);
    }
  }

  async decrypt(encryptedData, password = 'KAMPUS_SECRET_2025') {
    try {
      const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      
      // Extraer componentes
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      
      // Derivar clave
      const key = await crypto.subtle.importKey(
        'raw', passwordBuffer, 'PBKDF2', false, ['deriveBits', 'deriveKey']
      );
      
      const derivedKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        key, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
      );
      
      // Desencriptar
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, derivedKey, encrypted
      );
      
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (e) {
      (window.KampusLogger?.error || console.error)('❌ Error desencriptando:', e);
      return this.fallbackDecrypt(encryptedData, password);
    }
  }

  // Fallback para navegadores sin Web Crypto API
  fallbackEncrypt(data, key) {
    const jsonStr = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < jsonStr.length; i++) {
      encrypted += String.fromCharCode(
        jsonStr.charCodeAt(i) ^ key.charCodeAt(i % key.length) ^ (i % 255)
      );
    }
    return btoa(encrypted);
  }

  fallbackDecrypt(encryptedData, key) {
    try {
      const encrypted = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length) ^ (i % 255)
        );
      }
      return JSON.parse(decrypted);
    } catch (e) {
      return null;
    }
  }

  // ==========================================
  // VALIDACIÓN ROBUSTA
  // ==========================================
  
  validateEmail(email) {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return regex.test(email) && email.length <= 254;
  }

  validatePassword(password) {
    const errors = [];
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
    if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula');
    if (!/\d/.test(password)) errors.push('Al menos un número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Al menos un símbolo');
    return { valid: errors.length === 0, errors };
  }

  validateInput(input, type, options = {}) {
    const { maxLength = 1000, minLength = 0, required = false } = options;
    
    if (required && (!input || input.trim().length === 0)) {
      return { valid: false, error: 'Campo requerido' };
    }
    
    if (input && input.length > maxLength) {
      return { valid: false, error: `Máximo ${maxLength} caracteres` };
    }
    
    if (input && input.length < minLength) {
      return { valid: false, error: `Mínimo ${minLength} caracteres` };
    }

    switch (type) {
      case 'email':
        return { valid: this.validateEmail(input), error: 'Email inválido' };
      case 'name':
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        return { valid: nameRegex.test(input), error: 'Solo letras y espacios' };
      case 'filename':
        const fileRegex = /^[a-zA-Z0-9._-]+$/;
        return { valid: fileRegex.test(input), error: 'Nombre de archivo inválido' };
      default:
        return { valid: true };
    }
  }

  // ==========================================
  // SANITIZACIÓN XSS
  // ==========================================
  
  sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remover < >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover eventos onclick, onload, etc
      .replace(/script/gi, '') // Remover script
      .trim();
  }

  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // ==========================================
  // PROTECCIÓN CSP Y XSS
  // ==========================================
  
  setupCSP() {
    // Configurar Content Security Policy básico
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' https: data: blob:;";
    document.head.appendChild(meta);
  }

  setupXSSProtection() {
    // Interceptar formularios para sanitizar
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const inputs = form.querySelectorAll('input, textarea');
      
      inputs.forEach(input => {
        if (input.type !== 'password' && input.type !== 'file') {
          input.value = this.sanitizeInput(input.value);
        }
      });
    });
  }

  // ==========================================
  // HASH SEGURO DE CONTRASEÑAS
  // ==========================================
  
  async hashPassword(password, salt = null) {
    try {
      const encoder = new TextEncoder();
      
      if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
      }
      
      const passwordBuffer = encoder.encode(password);
      const key = await crypto.subtle.importKey(
        'raw', passwordBuffer, 'PBKDF2', false, ['deriveBits']
      );
      
      const hashBuffer = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        key, 256
      );
      
      const hashArray = new Uint8Array(hashBuffer);
      const combined = new Uint8Array(salt.length + hashArray.length);
      combined.set(salt, 0);
      combined.set(hashArray, salt.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      // Fallback simple
      return btoa(password.split('').reverse().join('') + 'KAMPUS_SALT_2025');
    }
  }

  async verifyPassword(password, hash) {
    try {
      const combined = new Uint8Array(atob(hash).split('').map(c => c.charCodeAt(0)));
      const salt = combined.slice(0, 16);
      const storedHash = combined.slice(16);
      
      const newHash = await this.hashPassword(password, salt);
      const newHashArray = new Uint8Array(atob(newHash).split('').map(c => c.charCodeAt(0)));
      const newHashOnly = newHashArray.slice(16);
      
      return this.constantTimeEqual(storedHash, newHashOnly);
    } catch (e) {
      // Fallback
      const fallbackHash = btoa(password.split('').reverse().join('') + 'KAMPUS_SALT_2025');
      return hash === fallbackHash;
    }
  }

  constantTimeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  // ==========================================
  // RATE LIMITING
  // ==========================================
  
  checkRateLimit(action, maxAttempts = 5, windowMs = 300000) {
    const key = `rate_limit_${action}`;
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Limpiar intentos antiguos
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      const nextAttempt = validAttempts[0] + windowMs;
      const waitTime = Math.ceil((nextAttempt - now) / 1000);
      return { allowed: false, waitTime };
    }
    
    validAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(validAttempts));
    return { allowed: true };
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.SecurityManager = new SecurityManager();