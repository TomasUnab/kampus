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
