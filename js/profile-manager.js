/**
 * 👤 PROFILE MANAGER - Sistema de gestión de perfiles de usuario
 * 
 * Funcionalidades:
 * - Edición de perfil (nombre, bio, universidad, foto)
 * - Guardado en localStorage
 * - Estadísticas en tiempo real
 * - Timeline de actividad
 * - Sistema de logros/insignias
 */

class ProfileManager {
  constructor() {
    this.storageKey = 'kampus_user_profile';
    this.activityKey = 'kampus_user_activity';
    this.profile = this.loadProfile();
    this.activity = this.loadActivity();
  }

  // 📦 Cargar perfil desde localStorage
  loadProfile() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        // Validar que tenga las propiedades esenciales
        if (parsed && parsed.name && parsed.stats) {
          console.log('✅ Perfil cargado desde localStorage');
          return parsed;
        }
      }
    } catch (e) {
      console.warn('⚠️ Error al cargar perfil:', e);
      localStorage.removeItem(this.storageKey); // Limpiar dato corrupto
    }

    // Perfil por defecto
    console.log('📝 Creando perfil por defecto');
    const defaultProfile = {
      name: 'Sofia Rodriguez',
      email: 'sofia.rodriguez@uchile.cl',
      career: 'Ingeniería Civil',
      university: 'Universidad de Chile',
      bio: 'Estudiante apasionada por las matemáticas y la física. Me encanta compartir conocimiento.',
      avatar: 'https://i.pravatar.cc/150?img=9',
      coverImage: null,
      social: {
        linkedin: '',
        github: '',
        twitter: '',
        website: ''
      },
      stats: {
        reputation: 1250,
        materialsUploaded: 42,
        totalDownloads: 1890,
        averageRating: 4.8,
        favoriteCount: 156,
        contributions: 42,
        badges: 12
      },
      preferences: {
        notifications: true,
        publicProfile: true,
        showEmail: false
      },
      joinDate: '2024-01-15',
      lastActive: new Date().toISOString()
    };
    
    // Guardar perfil por defecto
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(defaultProfile));
    } catch (e) {
      console.error('❌ Error al guardar perfil por defecto:', e);
    }
    
    return defaultProfile;
  }

  // 📦 Guardar perfil en localStorage
  saveProfile() {
    try {
      this.profile.lastActive = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
      
      if (window.Toast) {
        Toast.success('✅ Perfil actualizado correctamente');
      }
      
      if (window.Analytics) {
        Analytics.track('profile_updated', {
          timestamp: new Date().toISOString()
        });
      }

      return true;
    } catch (e) {
      console.error('Error al guardar perfil:', e);
      if (window.Toast) {
        Toast.error('❌ Error al guardar el perfil');
      }
      return false;
    }
  }

  // ✏️ Actualizar información del perfil
  updateProfile(updates) {
    this.profile = { ...this.profile, ...updates };
    return this.saveProfile();
  }

  // 📊 Actualizar estadísticas
  updateStats(statUpdates) {
    this.profile.stats = { ...this.profile.stats, ...statUpdates };
    return this.saveProfile();
  }

  // 🎯 Incrementar estadística
  incrementStat(statName, amount = 1) {
    if (this.profile.stats[statName] !== undefined) {
      this.profile.stats[statName] += amount;
      return this.saveProfile();
    }
    return false;
  }

  // 📅 Sistema de actividad
  loadActivity() {
    const saved = localStorage.getItem(this.activityKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Error al cargar actividad:', e);
      }
    }
    return [];
  }

  // 📝 Registrar actividad
  addActivity(type, description, metadata = {}) {
    const activity = {
      id: Date.now(),
      type, // 'upload', 'download', 'comment', 'rating', 'badge', 'follow'
      description,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.activity.unshift(activity);
    
    // Mantener solo las últimas 100 actividades
    if (this.activity.length > 100) {
      this.activity = this.activity.slice(0, 100);
    }

    try {
      localStorage.setItem(this.activityKey, JSON.stringify(this.activity));
      return true;
    } catch (e) {
      console.error('Error al guardar actividad:', e);
      return false;
    }
  }

  // 📊 Obtener actividades recientes
  getRecentActivity(limit = 10) {
    return this.activity.slice(0, limit);
  }

  // 🏆 Sistema de logros/insignias
  getBadges() {
    const badges = [
      {
        id: 'colaborador_estrella',
        name: 'Colaborador Estrella',
        description: 'Subió más de 50 materiales',
        icon: '⭐',
        earned: this.profile.stats.materialsUploaded >= 50,
        progress: Math.min(100, (this.profile.stats.materialsUploaded / 50) * 100),
        requirement: 50
      },
      {
        id: 'mente_brillante',
        name: 'Mente Brillante',
        description: 'Calificación promedio superior a 4.5',
        icon: '🧠',
        earned: this.profile.stats.averageRating >= 4.5,
        progress: Math.min(100, (this.profile.stats.averageRating / 5) * 100),
        requirement: 4.5
      },
      {
        id: 'pionero_saber',
        name: 'Pionero del Saber',
        description: 'Acumuló más de 1000 puntos de reputación',
        icon: '🚀',
        earned: this.profile.stats.reputation >= 1000,
        progress: Math.min(100, (this.profile.stats.reputation / 1000) * 100),
        requirement: 1000
      },
      {
        id: 'maestro_apuntes',
        name: 'Maestro de Apuntes',
        description: 'Sus materiales fueron descargados más de 1000 veces',
        icon: '📚',
        earned: this.profile.stats.totalDownloads >= 1000,
        progress: Math.min(100, (this.profile.stats.totalDownloads / 1000) * 100),
        requirement: 1000
      },
      {
        id: 'influencer',
        name: 'Influencer Académico',
        description: 'Tiene más de 100 seguidores',
        icon: '👥',
        earned: this.profile.stats.favoriteCount >= 100,
        progress: Math.min(100, (this.profile.stats.favoriteCount / 100) * 100),
        requirement: 100
      },
      {
        id: 'veterano',
        name: 'Veterano de Kampus',
        description: 'Miembro activo por más de 6 meses',
        icon: '🏅',
        earned: this.getDaysSinceJoin() >= 180,
        progress: Math.min(100, (this.getDaysSinceJoin() / 180) * 100),
        requirement: 180
      }
    ];

    return badges;
  }

  // 📅 Días desde que se unió
  getDaysSinceJoin() {
    const joinDate = new Date(this.profile.joinDate);
    const now = new Date();
    const diffTime = Math.abs(now - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // 🎯 Calcular nivel de reputación
  getReputationLevel() {
    const rep = this.profile.stats.reputation;
    
    if (rep < 100) return { level: 'Novato', next: 'Aprendiz', nextAt: 100 };
    if (rep < 500) return { level: 'Aprendiz', next: 'Estudiante', nextAt: 500 };
    if (rep < 1000) return { level: 'Estudiante', next: 'Colaborador', nextAt: 1000 };
    if (rep < 1500) return { level: 'Colaborador', next: 'Erudito', nextAt: 1500 };
    if (rep < 2500) return { level: 'Erudito', next: 'Experto', nextAt: 2500 };
    if (rep < 5000) return { level: 'Experto', next: 'Maestro', nextAt: 5000 };
    if (rep < 10000) return { level: 'Maestro', next: 'Leyenda', nextAt: 10000 };
    
    return { level: 'Leyenda', next: null, nextAt: null };
  }

  // 📊 Obtener datos para gráficas
  getChartData() {
    // Simulación de datos de los últimos 7 días
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    return {
      contributions: {
        labels: days,
        data: [5, 3, 7, 2, 8, 4, 6] // Materiales subidos por día
      },
      downloads: {
        labels: days,
        data: [45, 52, 38, 65, 70, 48, 55] // Descargas por día
      },
      ratings: {
        labels: ['5★', '4★', '3★', '2★', '1★'],
        data: [65, 25, 7, 2, 1] // Porcentaje de cada rating
      }
    };
  }

  // 🔄 Exportar perfil completo
  exportProfile() {
    return {
      profile: this.profile,
      activity: this.activity,
      badges: this.getBadges(),
      level: this.getReputationLevel(),
      exportDate: new Date().toISOString()
    };
  }

  // 🗑️ Limpiar datos
  clearProfile() {
    if (confirm('¿Estás seguro de que quieres restablecer tu perfil? Esta acción no se puede deshacer.')) {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.activityKey);
      this.profile = this.loadProfile();
      this.activity = [];
      
      if (window.Toast) {
        Toast.info('Perfil restablecido a valores por defecto');
      }
      
      // Recargar página
      setTimeout(() => window.location.reload(), 1500);
      
      return true;
    }
    return false;
  }
}

// 🌍 Instancia global
const profileManagerInstance = new ProfileManager();
window.ProfileManager = profileManagerInstance;

// 📊 Log de inicialización
console.log('✅ Profile Manager cargado');
if (profileManagerInstance.profile) {
  console.log('👤 Perfil:', profileManagerInstance.profile.name);
  console.log('📊 Reputación:', profileManagerInstance.profile.stats.reputation);
  console.log('🏆 Nivel:', profileManagerInstance.getReputationLevel().level);
} else {
  console.warn('⚠️ No se pudo cargar el perfil, usando valores por defecto');
}
