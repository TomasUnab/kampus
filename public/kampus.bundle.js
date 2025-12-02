// KAMPUS Bundle - Generated 
 
// ===== js\security-manager.js ===== 
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
// ===== js\session-manager.js ===== 
// ============================================
// 🔐 SISTEMA DE SESIONES Y AUTENTICACIÓN
// Sin Backend - Solo Frontend
// ============================================

class SessionManager {
  constructor() {
    this.sessionKey = 'kampus_session';
    this.usersKey = 'kampus_users';
    this.currentSessionKey = 'kampus_current_session_id';
    this.init();
  }

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  init() {
    // Verificar si hay una sesión activa al cargar
    const sessionId = this.getCurrentSessionId();
    if (sessionId) {
      const session = this.getSession(sessionId);
      if (session && this.isSessionValid(session)) {
  (window.KampusLogger?.debug || console.log)('✅ Sesión activa encontrada:', session.user.email);
      } else {
        this.logout();
      }
    }
  }

  // ==========================================
  // GENERACIÓN DE IDs Y TOKENS
  // ==========================================
  
  // Genera un Session ID único para cada usuario
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    return `sess_${timestamp}_${random}${random2}`;
  }

  // Genera un User ID único
  generateUserId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `user_${timestamp}_${random}`;
  }

  // Genera un token JWT-like simple (sin backend)
  generateToken(userId, email) {
    const header = btoa(JSON.stringify({ alg: 'KAMPUS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      userId,
      email,
      iat: Date.now(),
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
    }));
    const signature = this.simpleHash(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
  }

  // Hash simple para "firmar" tokens
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return btoa(hash.toString(36));
  }

  // ==========================================
  // ENCRIPTACIÓN SIMPLE (XOR)
  // ==========================================
  
  encrypt(data, key = 'KAMPUS_SECRET_2025') {
    const jsonStr = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < jsonStr.length; i++) {
      encrypted += String.fromCharCode(
        jsonStr.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  decrypt(encryptedData, key = 'KAMPUS_SECRET_2025') {
    try {
      const encrypted = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return JSON.parse(decrypted);
    } catch (e) {
  (window.KampusLogger?.error || console.error)('Error al desencriptar:', e);
      return null;
    }
  }

  // ==========================================
  // GESTIÓN DE COOKIES
  // ==========================================
  
  setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
  }

  getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') cookie = cookie.substring(1);
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
    return null;
  }

  deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // ==========================================
  // REGISTRO DE USUARIOS
  // ==========================================
  
  register(userData) {
    // Validar datos
    if (!userData.email || !userData.password || !userData.name) {
      return { success: false, error: 'Todos los campos son requeridos' };
    }

    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return { success: false, error: 'Email inválido' };
    }

    // Verificar si el usuario ya existe
    const users = this.getAllUsers();
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'El email ya está registrado' };
    }

    // Crear nuevo usuario
    const userId = this.generateUserId();
    const newUser = {
      id: userId,
      email: userData.email,
      name: userData.name,
      password: this.hashPassword(userData.password), // Hash simple
      career: userData.career || '',
      university: userData.university || '',
      isPremium: userData.isPremium || false,
      isAdmin: userData.isAdmin || false, // Nuevo campo de rol
      role: userData.role || 'user', // user, moderator, admin
      registeredAt: new Date().toISOString(),
      avatar: userData.avatar || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
    };

    // Guardar usuario (encriptado)
    users.push(newUser);
    this.saveUsers(users);

  (window.KampusLogger?.info || console.log)('✅ Usuario registrado:', userData.email, '| Rol:', newUser.role);
    return { success: true, userId, email: userData.email, role: newUser.role };
  }

  // ==========================================
  // LOGIN
  // ==========================================
  
  login(email, password) {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (user.password !== this.hashPassword(password)) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    // Crear sesión
    const sessionId = this.generateSessionId();
    const token = this.generateToken(user.id, user.email);

    const session = {
      sessionId,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        career: user.career,
        university: user.university,
        isPremium: user.isPremium,
        isAdmin: user.isAdmin || false,
        role: user.role || 'user',
        avatar: user.avatar
      },
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 días
      lastActivity: Date.now()
    };

    // Guardar sesión encriptada
    this.saveSession(sessionId, session);

    // Guardar Session ID en cookie
    this.setCookie(this.currentSessionKey, sessionId, 7);

    // También en localStorage como backup
    localStorage.setItem(this.currentSessionKey, sessionId);

  (window.KampusLogger?.info || console.log)('✅ Login exitoso:', email, '| Rol:', session.user.role);
  (window.KampusLogger?.debug || console.log)('📋 Session ID:', sessionId);

    return { success: true, session, sessionId, role: session.user.role };
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  
  logout() {
    const sessionId = this.getCurrentSessionId();
    if (sessionId) {
      // Eliminar sesión
      localStorage.removeItem(`${this.sessionKey}_${sessionId}`);
      
      // Eliminar cookie
      this.deleteCookie(this.currentSessionKey);
      
      // Eliminar referencia
      localStorage.removeItem(this.currentSessionKey);
      
  (window.KampusLogger?.info || console.log)('✅ Sesión cerrada');
    }
  }

  // ==========================================
  // GESTIÓN DE SESIONES
  // ==========================================
  
  getCurrentSessionId() {
    // Primero intentar desde cookie
    let sessionId = this.getCookie(this.currentSessionKey);
    
    // Si no hay cookie, buscar en localStorage
    if (!sessionId) {
      sessionId = localStorage.getItem(this.currentSessionKey);
    }
    
    return sessionId;
  }

  saveSession(sessionId, session) {
    const encrypted = this.encrypt(session);
    localStorage.setItem(`${this.sessionKey}_${sessionId}`, encrypted);
  }

  getSession(sessionId) {
    const encrypted = localStorage.getItem(`${this.sessionKey}_${sessionId}`);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  getCurrentSession() {
    const sessionId = this.getCurrentSessionId();
    if (!sessionId) return null;
    return this.getSession(sessionId);
  }

  getCurrentUser() {
    const session = this.getCurrentSession();
    return session ? session.user : null;
  }

  isSessionValid(session) {
    if (!session) return false;
    return Date.now() < session.expiresAt;
  }

  isLoggedIn() {
    const session = this.getCurrentSession();
    return session && this.isSessionValid(session);
  }

  // Actualizar última actividad
  updateActivity() {
    const sessionId = this.getCurrentSessionId();
    if (sessionId) {
      const session = this.getSession(sessionId);
      if (session) {
        session.lastActivity = Date.now();
        this.saveSession(sessionId, session);
      }
    }
  }

  // ==========================================
  // GESTIÓN DE USUARIOS
  // ==========================================
  
  saveUsers(users) {
    const encrypted = this.encrypt(users);
    localStorage.setItem(this.usersKey, encrypted);
  }

  getAllUsers() {
    const encrypted = localStorage.getItem(this.usersKey);
    if (!encrypted) return [];
    return this.decrypt(encrypted) || [];
  }

  getUserById(userId) {
    const users = this.getAllUsers();
    return users.find(u => u.id === userId);
  }

  updateCurrentUser(updates) {
    const session = this.getCurrentSession();
    if (!session) return { success: false, error: 'No hay sesión activa' };

    // Actualizar en la lista de usuarios
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === session.userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    this.saveUsers(users);

    // Actualizar sesión
    session.user = { ...session.user, ...updates };
    this.saveSession(session.sessionId, session);

  (window.KampusLogger?.debug || console.log)('✅ Usuario actualizado');
    return { success: true, user: session.user };
  }

  // ==========================================
  // UTILIDADES
  // ==========================================
  
  hashPassword(password) {
    // Hash simple para demo (en producción usar bcrypt con backend)
    return btoa(password.split('').reverse().join('') + 'KAMPUS_SALT');
  }

  // Requerir login (usar en páginas protegidas)
  requireAuth(redirectUrl = '../login_/code.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  // Verificar si el usuario es premium
  isPremium() {
    const user = this.getCurrentUser();
    return user ? user.isPremium : false;
  }

  // Actualizar a premium
  upgradeToPremium() {
    return this.updateCurrentUser({ isPremium: true });
  }

  // ==========================================
  // VERIFICACIÓN DE ROLES Y PERMISOS
  // ==========================================

  // Verificar si el usuario es administrador
  isAdmin() {
    const user = this.getCurrentUser();
    return user ? (user.isAdmin || user.role === 'admin') : false;
  }

  // Verificar si el usuario es moderador o admin
  isModerator() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role === 'moderator' || user.role === 'admin' || user.isAdmin;
  }

  // Obtener rol del usuario actual
  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  // Verificar permisos específicos
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;

    const permissions = {
      'user': ['view', 'upload', 'comment', 'download'],
      'moderator': ['view', 'upload', 'comment', 'download', 'moderate', 'delete_comments', 'ban_users'],
      'admin': ['view', 'upload', 'comment', 'download', 'moderate', 'delete_comments', 'ban_users', 'manage_users', 'manage_system', 'view_analytics']
    };

    const userPermissions = permissions[user.role] || permissions['user'];
    return userPermissions.includes(permission);
  }

  // Requerir rol específico (middleware para páginas)
  requireRole(requiredRole, redirectUrl = '../login_/_registro/code.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectUrl;
      return false;
    }

    const user = this.getCurrentUser();
    const roleHierarchy = { 'user': 0, 'moderator': 1, 'admin': 2 };
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
  (window.KampusLogger?.warn || console.warn)('❌ Acceso denegado: Se requiere rol', requiredRole);
      window.location.href = '../../dashboard_principal/code.html';
      return false;
    }

    return true;
  }

  // Promover usuario a un rol superior
  promoteUser(userId, newRole) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Solo administradores pueden promover usuarios' };
    }

    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(newRole)) {
      return { success: false, error: 'Rol inválido' };
    }

    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    users[userIndex].role = newRole;
    users[userIndex].isAdmin = newRole === 'admin';
    this.saveUsers(users);

  (window.KampusLogger?.info || console.log)('✅ Usuario promovido:', users[userIndex].email, 'a', newRole);
    return { success: true, user: users[userIndex] };
  }

  // Debug: Ver todas las sesiones
  getAllSessions() {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.sessionKey + '_')) {
        const sessionId = key.replace(this.sessionKey + '_', '');
        sessions.push({
          sessionId,
          session: this.getSession(sessionId)
        });
      }
    }
    return sessions;
  }

  // Limpiar sesiones expiradas
  cleanExpiredSessions() {
    const sessions = this.getAllSessions();
    sessions.forEach(({ sessionId, session }) => {
      if (!this.isSessionValid(session)) {
        localStorage.removeItem(`${this.sessionKey}_${sessionId}`);
  (window.KampusLogger?.debug || console.log)('🗑️ Sesión expirada eliminada:', sessionId);
      }
    });
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.SessionManager = new SessionManager();

// Actualizar actividad cada 5 minutos
setInterval(() => {
  if (window.SessionManager.isLoggedIn()) {
    window.SessionManager.updateActivity();
  }
}, 5 * 60 * 1000);

// Limpiar sesiones expiradas al cargar
window.addEventListener('load', () => {
  window.SessionManager.cleanExpiredSessions();
});

(window.KampusLogger?.info || console.log)('🔐 Sistema de sesiones inicializado');
 
// ===== js\cache-manager.js ===== 
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
 
// ===== js\performance-optimizer.js ===== 
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
 
// ===== js\notification-system.js ===== 
// ============================================
// 🔔 SISTEMA DE NOTIFICACIONES - KAMPUS
// Notificaciones in-app, toast y push (opcional)
// ============================================

class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.notificationsKey = 'kampus_notifications';
    this.preferencesKey = 'kampus_notification_preferences';
    this.container = null;
    this.init();
  }

  init() {
    this.loadNotifications();
    this.loadPreferences();
    
    // Crear contenedor cuando el DOM esté listo
    if (document.body) {
      this.createContainer();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        this.createContainer();
      });
    }
    
    (window.KampusLogger?.info || console.log)('🔔 Sistema de Notificaciones inicializado');
  }

  // ==========================================
  // 1. TOAST NOTIFICATIONS (temporal)
  // ==========================================

  toast(message, options = {}) {
    const defaults = {
      type: 'info', // success, error, warning, info
      duration: 3000,
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center
      closable: true
    };

    const config = { ...defaults, ...options };

    const toast = document.createElement('div');
    toast.className = `toast toast-${config.type} toast-${config.position}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${this.getIcon(config.type)}</div>
        <div class="toast-message">${message}</div>
        ${config.closable ? '<button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>' : ''}
      </div>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('toast-styles')) {
      this.injectToastStyles();
    }

    document.body.appendChild(toast);

    // Auto-remover después de duration
    if (config.duration > 0) {
      setTimeout(() => {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 300);
      }, config.duration);
    }

    return toast;
  }

  success(message, duration = 3000) {
    return this.toast(message, { type: 'success', duration });
  }

  error(message, duration = 5000) {
    return this.toast(message, { type: 'error', duration });
  }

  warning(message, duration = 4000) {
    return this.toast(message, { type: 'warning', duration });
  }

  info(message, duration = 3000) {
    return this.toast(message, { type: 'info', duration });
  }

  // ==========================================
  // 2. NOTIFICACIONES PERSISTENTES
  // ==========================================

  notify(notification) {
    const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const notif = {
      id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      icon: notification.icon || this.getIcon(notification.type || 'info'),
      timestamp: Date.now(),
      read: false,
      action: notification.action || null, // { label, callback }
      data: notification.data || {}
    };

    this.notifications.unshift(notif);
    this.saveNotifications();
    this.updateBadge();

    // Mostrar toast si está habilitado
    if (this.getPreference('showToast')) {
      this.toast(notif.message, { type: notif.type });
    }

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('kampusNotification', { detail: notif }));

  (window.KampusLogger?.debug || console.log)('🔔 Nueva notificación:', notif.title);
    return notif;
  }

  // ==========================================
  // 3. GESTIÓN DE NOTIFICACIONES
  // ==========================================

  getAll() {
    return this.notifications;
  }

  getUnread() {
    return this.notifications.filter(n => !n.read);
  }

  getById(id) {
    return this.notifications.find(n => n.id === id);
  }

  markAsRead(id) {
    const notif = this.getById(id);
    if (notif) {
      notif.read = true;
      this.saveNotifications();
      this.updateBadge();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.updateBadge();
  }

  delete(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.updateBadge();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.updateBadge();
  }

  // ==========================================
  // 4. PERSISTENCIA
  // ==========================================

  saveNotifications() {
    localStorage.setItem(this.notificationsKey, JSON.stringify(this.notifications));
  }

  loadNotifications() {
    const stored = localStorage.getItem(this.notificationsKey);
    this.notifications = stored ? JSON.parse(stored) : [];
    
    // Limpiar notificaciones antiguas (> 30 días)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => n.timestamp > thirtyDaysAgo);
    this.saveNotifications();
  }

  // ==========================================
  // 5. BADGE (contador)
  // ==========================================

  updateBadge() {
    const unreadCount = this.getUnread().length;
    const badges = document.querySelectorAll('.notification-badge');
    
    badges.forEach(badge => {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // ==========================================
  // 6. PANEL DE NOTIFICACIONES
  // ==========================================

  createContainer() {
    // Verificar que document.body exista
    if (!document.body) {
  (window.KampusLogger?.warn || console.warn)('⚠️ document.body no está disponible aún');
      return;
    }

    // Evitar crear múltiples contenedores
    if (document.getElementById('notification-panel')) {
      this.container = document.getElementById('notification-panel');
      return;
    }

    // Crear contenedor para panel de notificaciones
    const container = document.createElement('div');
    container.id = 'notification-panel';
    container.className = 'notification-panel hidden';
    container.innerHTML = `
      <div class="notification-header">
        <h3>Notificaciones</h3>
        <button onclick="window.NotificationSystem.markAllAsRead()">Marcar todas como leídas</button>
      </div>
      <div class="notification-list" id="notification-list"></div>
    `;
    
    document.body.appendChild(container);
    this.container = container;
  }

  showPanel() {
    if (!this.container) {
      this.createContainer();
    }
    if (this.container) {
      this.container.classList.remove('hidden');
      this.renderPanel();
    }
  }

  hidePanel() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  togglePanel() {
    if (!this.container) {
      this.createContainer();
    }
    if (this.container) {
      this.container.classList.toggle('hidden');
      if (!this.container.classList.contains('hidden')) {
        this.renderPanel();
      }
    }
  }

  renderPanel() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
      return;
    }

    list.innerHTML = this.notifications.map(n => `
      <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="window.NotificationSystem.markAsRead('${n.id}')">
        <div class="notification-icon">${n.icon}</div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-message">${n.message}</div>
          <div class="notification-time">${this.formatTime(n.timestamp)}</div>
        </div>
        <button class="notification-delete" onclick="event.stopPropagation(); window.NotificationSystem.delete('${n.id}')">×</button>
      </div>
    `).join('');
  }

  // ==========================================
  // 7. PREFERENCIAS
  // ==========================================

  savePreferences(prefs) {
    const currentPrefs = this.loadPreferences();
    const newPrefs = { ...currentPrefs, ...prefs };
    localStorage.setItem(this.preferencesKey, JSON.stringify(newPrefs));
  }

  loadPreferences() {
    const stored = localStorage.getItem(this.preferencesKey);
    return stored ? JSON.parse(stored) : {
      enabled: true,
      showToast: true,
      sound: false,
      newMaterial: true,
      newComment: true,
      newLike: true,
      premiumExpiry: true,
      systemUpdates: true
    };
  }

  getPreference(key) {
    const prefs = this.loadPreferences();
    return prefs[key];
  }

  // ==========================================
  // 8. NOTIFICACIONES PROGRAMADAS
  // ==========================================

  schedule(notification, delay) {
    setTimeout(() => {
      this.notify(notification);
    }, delay);
  }

  // ==========================================
  // 9. PUSH NOTIFICATIONS (opcional)
  // ==========================================

  async requestPermission() {
    if (!('Notification' in window)) {
  (window.KampusLogger?.warn || console.warn)('⚠️ Este navegador no soporta notificaciones push');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async sendPush(title, options = {}) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
  (window.KampusLogger?.warn || console.warn)('⚠️ No hay permiso para notificaciones push');
      return null;
    }

    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/badge.png',
      tag: options.tag || 'kampus-notification',
      requireInteraction: options.requireInteraction || false,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };

    return notification;
  }

  // ==========================================
  // 10. UTILIDADES
  // ==========================================

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'ahora mismo';
  }

  injectToastStyles() {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast {
        position: fixed;
        z-index: 10000;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: toast-slide-in 0.3s ease-out;
        max-width: 400px;
      }
      .toast-top-right { top: 20px; right: 20px; }
      .toast-top-left { top: 20px; left: 20px; }
      .toast-bottom-right { bottom: 20px; right: 20px; }
      .toast-bottom-left { bottom: 20px; left: 20px; }
      .toast-top-center { top: 20px; left: 50%; transform: translateX(-50%); }
      .toast-content { display: flex; align-items: center; gap: 12px; }
      .toast-icon { font-size: 24px; flex-shrink: 0; }
      .toast-message { flex: 1; color: white; }
      .toast-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 24px; }
      .toast-success { background: #10b981; }
      .toast-error { background: #ef4444; }
      .toast-warning { background: #f59e0b; }
      .toast-info { background: #3b82f6; }
      .toast-fadeout { animation: toast-fade-out 0.3s ease-out forwards; }
      @keyframes toast-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes toast-fade-out {
        to { opacity: 0; transform: scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.NotificationSystem = new NotificationSystem();

// Ejemplos de uso
window.testNotifications = () => {
  window.NotificationSystem.success('¡Operación exitosa!');
  setTimeout(() => window.NotificationSystem.error('Ocurrió un error'), 1000);
  setTimeout(() => window.NotificationSystem.warning('Advertencia importante'), 2000);
  setTimeout(() => window.NotificationSystem.info('Información general'), 3000);
};

(window.KampusLogger?.tip || console.log)('Escribe testNotifications() para ver ejemplos');
 
// ===== js\moderation-system.js ===== 
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
 
// ===== js\comments-system.js ===== 
// ============================================
// 💬 SISTEMA DE COMENTARIOS Y VALORACIONES
// ============================================

class CommentsSystem {
  constructor() {
    this.commentsKey = 'kampus_comments';
    this.ratingsKey = 'kampus_ratings';
    this.init();
  }

  init() {
    this.setupEventListeners();
    (window.KampusLogger?.info || console.log)('💬 Sistema de comentarios inicializado');
  }

  // ==========================================
  // COMENTARIOS
  // ==========================================

  addComment(materialId, comment) {
    const user = window.SessionManager?.getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    // Validar y sanitizar
    const validation = window.SecurityManager?.validateInput(comment, 'text', { 
      required: true, minLength: 5, maxLength: 500 
    });
    if (!validation?.valid) {
      return { success: false, error: validation?.error || 'Comentario inválido' };
    }

    const sanitizedComment = window.SecurityManager?.sanitizeInput(comment) || comment;
    
    const newComment = {
      id: this.generateId(),
      materialId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: sanitizedComment,
      timestamp: Date.now(),
      likes: 0,
      replies: []
    };

    const comments = this.getAllComments();
    comments.push(newComment);
    this.saveComments(comments);

    return { success: true, comment: newComment };
  }

  getCommentsByMaterial(materialId) {
    return this.getAllComments().filter(c => c.materialId === materialId);
  }

  likeComment(commentId) {
    const comments = this.getAllComments();
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.likes++;
      this.saveComments(comments);
      return comment.likes;
    }
    return 0;
  }

  // ==========================================
  // VALORACIONES
  // ==========================================

  addRating(materialId, rating, review = '') {
    const user = window.SessionManager?.getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Valoración debe ser entre 1 y 5' };
    }

    const ratings = this.getAllRatings();
    const existingIndex = ratings.findIndex(r => r.materialId === materialId && r.userId === user.id);
    
    const newRating = {
      id: existingIndex >= 0 ? ratings[existingIndex].id : this.generateId(),
      materialId,
      userId: user.id,
      userName: user.name,
      rating,
      review: window.SecurityManager?.sanitizeInput(review) || review,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      ratings[existingIndex] = newRating;
    } else {
      ratings.push(newRating);
    }

    this.saveRatings(ratings);
    return { success: true, rating: newRating };
  }

  getMaterialRating(materialId) {
    const ratings = this.getAllRatings().filter(r => r.materialId === materialId);
    if (ratings.length === 0) return { average: 0, count: 0 };

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: (sum / ratings.length).toFixed(1),
      count: ratings.length,
      ratings
    };
  }

  // ==========================================
  // RENDERIZADO
  // ==========================================

  renderComments(materialId, container) {
    const comments = this.getCommentsByMaterial(materialId);
    const rating = this.getMaterialRating(materialId);
    
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Valoración promedio -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-primary">${rating.average}</div>
              <div class="flex justify-center">${this.renderStars(rating.average)}</div>
              <div class="text-sm text-gray-500">${rating.count} valoraciones</div>
            </div>
            <div class="flex-1">
              <button onclick="window.CommentsSystem.showRatingModal('${materialId}')" 
                      class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                Valorar material
              </button>
            </div>
          </div>
        </div>

        <!-- Formulario de comentario -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h3 class="font-bold mb-4">Agregar comentario</h3>
          <div class="space-y-3">
            <textarea id="comment-input-${materialId}" 
                      class="w-full p-3 border rounded-lg resize-none" 
                      rows="3" placeholder="Escribe tu comentario..."></textarea>
            <button onclick="window.CommentsSystem.submitComment('${materialId}')"
                    class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
              Comentar
            </button>
          </div>
        </div>

        <!-- Lista de comentarios -->
        <div class="space-y-4">
          ${comments.map(comment => this.renderComment(comment)).join('')}
        </div>
      </div>
    `;
  }

  renderComment(comment) {
    const timeAgo = this.timeAgo(comment.timestamp);
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <div class="flex gap-3">
          <img src="${comment.userAvatar}" alt="${comment.userName}" 
               class="w-10 h-10 rounded-full">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-medium">${comment.userName}</span>
              <span class="text-sm text-gray-500">${timeAgo}</span>
            </div>
            <p class="text-gray-700 dark:text-gray-300 mb-3">${comment.content}</p>
            <div class="flex items-center gap-4">
              <button onclick="window.CommentsSystem.likeComment('${comment.id}')"
                      class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                </svg>
                <span id="likes-${comment.id}">${comment.likes}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars += '<span class="text-yellow-400">★</span>';
      } else if (i === fullStars && hasHalfStar) {
        stars += '<span class="text-yellow-400">☆</span>';
      } else {
        stars += '<span class="text-gray-300">☆</span>';
      }
    }
    return stars;
  }

  // ==========================================
  // MODALES Y EVENTOS
  // ==========================================

  showRatingModal(materialId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">Valorar material</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Calificación</label>
            <div class="flex gap-1" id="rating-stars">
              ${[1,2,3,4,5].map(i => `
                <button onclick="window.CommentsSystem.setRating(${i})" 
                        class="text-2xl text-gray-300 hover:text-yellow-400" 
                        data-rating="${i}">☆</button>
              `).join('')}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Reseña (opcional)</label>
            <textarea id="review-input" class="w-full p-3 border rounded-lg" 
                      rows="3" placeholder="Comparte tu experiencia..."></textarea>
          </div>
          <div class="flex gap-3">
            <button onclick="window.CommentsSystem.submitRating('${materialId}')"
                    class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
              Enviar
            </button>
            <button onclick="this.closest('.fixed').remove()"
                    class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  setRating(rating) {
    this.selectedRating = rating;
    const stars = document.querySelectorAll('#rating-stars button');
    stars.forEach((star, index) => {
      star.textContent = index < rating ? '★' : '☆';
      star.className = index < rating ? 
        'text-2xl text-yellow-400' : 
        'text-2xl text-gray-300 hover:text-yellow-400';
    });
  }

  submitRating(materialId) {
    if (!this.selectedRating) {
      window.showToast?.('Selecciona una calificación', 'error');
      return;
    }

    const review = document.getElementById('review-input').value;
    const result = this.addRating(materialId, this.selectedRating, review);
    
    if (result.success) {
      window.showToast?.('Valoración enviada', 'success');
      document.querySelector('.fixed').remove();
      // Recargar comentarios si están visibles
      const container = document.querySelector(`[data-material-id="${materialId}"]`);
      if (container) this.renderComments(materialId, container);
    } else {
      window.showToast?.(result.error, 'error');
    }
  }

  submitComment(materialId) {
    const input = document.getElementById(`comment-input-${materialId}`);
    const comment = input.value.trim();
    
    if (!comment) {
      window.showToast?.('Escribe un comentario', 'error');
      return;
    }

    const result = this.addComment(materialId, comment);
    if (result.success) {
      input.value = '';
      window.showToast?.('Comentario agregado', 'success');
      // Recargar comentarios
      const container = document.querySelector(`[data-material-id="${materialId}"]`);
      if (container) this.renderComments(materialId, container);
    } else {
      window.showToast?.(result.error, 'error');
    }
  }

  setupEventListeners() {
    // Auto-setup en páginas de material
    document.addEventListener('DOMContentLoaded', () => {
      const commentsContainer = document.querySelector('[data-comments-container]');
      if (commentsContainer) {
        const materialId = commentsContainer.dataset.materialId;
        if (materialId) {
          this.renderComments(materialId, commentsContainer);
        }
      }
    });
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

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

  getAllComments() {
    const encrypted = localStorage.getItem(this.commentsKey);
    if (!encrypted) return [];
    return window.SecurityManager?.decrypt ? 
      window.SecurityManager.decrypt(encrypted) || [] : 
      JSON.parse(encrypted);
  }

  saveComments(comments) {
    const data = window.SecurityManager?.encrypt ? 
      window.SecurityManager.encrypt(comments) : 
      JSON.stringify(comments);
    localStorage.setItem(this.commentsKey, data);
  }

  getAllRatings() {
    const encrypted = localStorage.getItem(this.ratingsKey);
    if (!encrypted) return [];
    return window.SecurityManager?.decrypt ? 
      window.SecurityManager.decrypt(encrypted) || [] : 
      JSON.parse(encrypted);
  }

  saveRatings(ratings) {
    const data = window.SecurityManager?.encrypt ? 
      window.SecurityManager.encrypt(ratings) : 
      JSON.stringify(ratings);
    localStorage.setItem(this.ratingsKey, data);
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.CommentsSystem = new CommentsSystem(); 
// ===== js\push-notifications.js ===== 
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
// ===== js\lazy-loader.js ===== 
// ============================================
// 🚀 LAZY LOADER - KAMPUS
// Carga diferida de imágenes y contenido
// ============================================

class LazyLoader {
  constructor() {
    this.imageObserver = null;
    this.contentObserver = null;
    this.init();
  }

  init() {
    this.setupImageLazyLoading();
    this.setupContentLazyLoading();
    this.setupModuleLazyLoading();
    (window.KampusLogger?.info || console.log)('🚀 Lazy Loader inicializado');
  }

  // ==========================================
  // LAZY LOADING DE IMÁGENES
  // ==========================================

  setupImageLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      this.fallbackImageLoading();
      return;
    }

    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.imageObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    this.observeImages();
  }

  observeImages() {
    const lazyImages = document.querySelectorAll('img[data-src], [data-bg-src]');
    lazyImages.forEach(img => this.imageObserver.observe(img));
  }

  loadImage(element) {
    const src = element.dataset.src;
    const bgSrc = element.dataset.bgSrc;

    if (src && element.tagName === 'IMG') {
      // Precargar imagen
      const img = new Image();
      img.onload = () => {
        element.src = src;
        element.classList.add('loaded');
        element.removeAttribute('data-src');
      };
      img.onerror = () => {
        element.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
        element.classList.add('error');
      };
      img.src = src;
    }

    if (bgSrc) {
      element.style.backgroundImage = `url(${bgSrc})`;
      element.classList.add('loaded');
      element.removeAttribute('data-bg-src');
    }
  }

  fallbackImageLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  // ==========================================
  // LAZY LOADING DE CONTENIDO
  // ==========================================

  setupContentLazyLoading() {
    if (!('IntersectionObserver' in window)) return;

    this.contentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadContent(entry.target);
          this.contentObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0.1
    });

    this.observeContent();
  }

  observeContent() {
    const lazyContent = document.querySelectorAll('[data-lazy-content]');
    lazyContent.forEach(element => this.contentObserver.observe(element));
  }

  async loadContent(element) {
    const contentType = element.dataset.lazyContent;
    const contentId = element.dataset.contentId;

    element.innerHTML = '<div class="animate-pulse bg-gray-200 h-20 rounded"></div>';

    try {
      let content = '';
      
      switch (contentType) {
        case 'comments':
          content = await this.loadComments(contentId);
          break;
        case 'materials':
          content = await this.loadMaterials(contentId);
          break;
        case 'user-stats':
          content = await this.loadUserStats(contentId);
          break;
        default:
          content = '<p>Contenido no disponible</p>';
      }

      element.innerHTML = content;
      element.classList.add('loaded');
    } catch (error) {
      element.innerHTML = '<p class="text-red-500">Error cargando contenido</p>';
      (window.KampusLogger?.error || console.error)('Error lazy loading:', error);
    }
  }

  async loadComments(materialId) {
    // Simular carga de comentarios
    await this.delay(500);
    return `
      <div class="space-y-3">
        <div class="bg-gray-50 p-3 rounded">
          <p class="font-medium">Usuario 1</p>
          <p class="text-sm text-gray-600">Excelente material, muy útil.</p>
        </div>
        <div class="bg-gray-50 p-3 rounded">
          <p class="font-medium">Usuario 2</p>
          <p class="text-sm text-gray-600">Gracias por compartir!</p>
        </div>
      </div>
    `;
  }

  async loadMaterials(category) {
    await this.delay(800);
    return `
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white p-4 rounded shadow">
          <h4 class="font-bold">Material 1</h4>
          <p class="text-sm text-gray-600">Descripción del material</p>
        </div>
        <div class="bg-white p-4 rounded shadow">
          <h4 class="font-bold">Material 2</h4>
          <p class="text-sm text-gray-600">Descripción del material</p>
        </div>
      </div>
    `;
  }

  async loadUserStats(userId) {
    await this.delay(300);
    return `
      <div class="flex justify-around text-center">
        <div>
          <div class="text-2xl font-bold text-primary">15</div>
          <div class="text-sm text-gray-600">Materiales</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-primary">342</div>
          <div class="text-sm text-gray-600">Descargas</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-primary">4.8</div>
          <div class="text-sm text-gray-600">Rating</div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // LAZY LOADING DE MÓDULOS JS
  // ==========================================

  setupModuleLazyLoading() {
    // Cargar módulos bajo demanda
    document.addEventListener('click', (e) => {
      const lazyModule = e.target.closest('[data-lazy-module]');
      if (lazyModule) {
        const moduleName = lazyModule.dataset.lazyModule;
        this.loadModule(moduleName);
      }
    });
  }

  async loadModule(moduleName) {
    if (window[moduleName]) return window[moduleName];

    const moduleMap = {
      'ChatSystem': '/js/chat-system.js',
      'AdvancedSearch': '/js/advanced-search.js',
      'FileUploader': '/js/file-uploader.js',
      'Analytics': '/js/analytics.js'
    };

    const modulePath = moduleMap[moduleName];
    if (!modulePath) {
      (window.KampusLogger?.warn || console.warn)('Módulo no encontrado:', moduleName);
      return null;
    }

    try {
      await this.loadScript(modulePath);
      (window.KampusLogger?.info || console.log)('✅ Módulo cargado:', moduleName);
      return window[moduleName];
    } catch (error) {
      (window.KampusLogger?.error || console.error)('❌ Error cargando módulo:', error);
      return null;
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ==========================================
  // VIRTUAL SCROLLING
  // ==========================================

  setupVirtualScroll(container, items, itemHeight = 100) {
    const containerHeight = container.clientHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
    let scrollTop = 0;
    let startIndex = 0;

    const render = () => {
      startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);

      container.innerHTML = '';
      container.style.height = items.length * itemHeight + 'px';
      container.style.position = 'relative';

      for (let i = startIndex; i < endIndex; i++) {
        const item = this.createVirtualItem(items[i], i, itemHeight);
        container.appendChild(item);
      }
    };

    container.addEventListener('scroll', window.PerformanceOptimizer?.throttle(() => {
      scrollTop = container.scrollTop;
      render();
    }, 16) || (() => {}));

    render();
  }

  createVirtualItem(data, index, height) {
    const item = document.createElement('div');
    item.style.position = 'absolute';
    item.style.top = index * height + 'px';
    item.style.height = height + 'px';
    item.style.width = '100%';
    item.className = 'virtual-item p-4 border-b';
    
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${data.avatar || 'https://i.pravatar.cc/40'}" 
             class="w-10 h-10 rounded-full" alt="">
        <div>
          <h4 class="font-medium">${data.title || 'Item ' + index}</h4>
          <p class="text-sm text-gray-600">${data.description || 'Descripción del item'}</p>
        </div>
      </div>
    `;
    
    return item;
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Reobservar nuevas imágenes añadidas dinámicamente
  refreshObservers() {
    if (this.imageObserver) {
      this.observeImages();
    }
    if (this.contentObserver) {
      this.observeContent();
    }
  }

  // Limpiar observadores
  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    if (this.contentObserver) {
      this.contentObserver.disconnect();
    }
  }
}

// ==========================================
// INSTANCIA GLOBAL
// ==========================================
window.LazyLoader = new LazyLoader();

// Reobservar cuando se añada contenido dinámico
const originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function(child) {
  const result = originalAppendChild.call(this, child);
  if (window.LazyLoader && child.nodeType === 1) {
    setTimeout(() => window.LazyLoader.refreshObservers(), 100);
  }
  return result;
}; 
// ===== js\error-reporter.js ===== 
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
 
// ===== js\kampus-init.js ===== 
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
 
