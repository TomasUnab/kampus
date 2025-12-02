# 👥 SISTEMA DE USUARIOS Y ROLES - KAMPUS

## 📋 Credenciales de Acceso

### 🔴 ADMINISTRADOR (Permisos Totales)
```
Email:    admin@kampus.com
Password: admin123
Rol:      admin
Premium:  ✅ Sí
```

**Permisos:**
- ✅ Ver todo el contenido
- ✅ Subir materiales
- ✅ Comentar y descargar
- ✅ **Moderar contenido**
- ✅ **Eliminar comentarios**
- ✅ **Banear usuarios**
- ✅ **Gestionar usuarios** (cambiar roles, dar premium)
- ✅ **Gestionar sistema**
- ✅ **Ver analytics y estadísticas**
- ✅ **Acceso al Dashboard de Moderación**

---

### 🟡 MODERADOR
```
Email:    moderador@kampus.com
Password: mod123
Rol:      moderator
Premium:  ✅ Sí
```

**Permisos:**
- ✅ Ver todo el contenido
- ✅ Subir materiales
- ✅ Comentar y descargar
- ✅ **Moderar contenido**
- ✅ **Eliminar comentarios**
- ✅ **Banear usuarios**
- ✅ **Acceso al Dashboard de Moderación**
- ❌ No puede gestionar usuarios
- ❌ No puede cambiar roles

---

### 🟢 USUARIO NORMAL
```
Email:    demo@kampus.com
Password: demo123
Rol:      user
Premium:  ❌ No
```

**Permisos:**
- ✅ Ver contenido
- ✅ Subir materiales
- ✅ Comentar
- ✅ Descargar
- ❌ No puede moderar
- ❌ No tiene acceso al dashboard de moderación

---

## 🎯 Jerarquía de Roles

```
┌─────────────────────────────────────┐
│           👑 ADMIN                  │
│  - Control total del sistema        │
│  - Gestión de usuarios y roles      │
│  - Acceso a todas las funciones     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         ⚡ MODERATOR                │
│  - Moderación de contenido          │
│  - Gestión de reportes              │
│  - Banear usuarios problemáticos    │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│          👤 USER                    │
│  - Uso básico de la plataforma      │
│  - Subir y descargar materiales     │
│  - Comentar y colaborar             │
└─────────────────────────────────────┘
```

---

## 🛡️ Dashboard de Moderación

**URL:** `/dashboard_moderacion.html`

**Acceso:** Solo Moderadores y Administradores

### Funcionalidades para Moderadores:
- 📋 Ver y gestionar reportes
- ⏳ Aprobar/rechazar contenido en cola
- 🚫 Gestionar blacklist (usuarios, emails, palabras)
- 📊 Ver registro de acciones

### Funcionalidades EXTRA para Administradores:
- 👥 **Gestión de Usuarios:**
  - Ver lista completa de usuarios
  - Cambiar roles (promover a moderador, degradar, etc.)
  - Activar/desactivar premium
  - Banear usuarios
  - Ver información detallada (universidad, carrera, fecha de registro)

---

## 🔧 Métodos Disponibles en JavaScript

### Verificación de Roles
```javascript
// ¿Usuario logueado?
Kampus.isLoggedIn()

// ¿Es admin?
Kampus.isAdmin()

// ¿Es moderador o admin?
Kampus.isModerator()

// Obtener rol actual
Kampus.getUserRole() // 'user', 'moderator', 'admin'

// Verificar permiso específico
Kampus.hasPermission('moderate') // true/false

// Obtener badge de rol (para UI)
Kampus.getRoleBadge()
// Retorna: { text, color, icon }
```

### Gestión de Usuarios (Solo Admin)
```javascript
// Promover usuario
SessionManager.promoteUser(userId, 'moderator')
SessionManager.promoteUser(userId, 'admin')

// Verificar si es admin
SessionManager.isAdmin()

// Verificar si es moderador
SessionManager.isModerator()
```

### Protección de Rutas
```javascript
// Requerir login
SessionManager.requireAuth()

// Requerir rol específico
SessionManager.requireRole('moderator') // Redirige si no tiene el rol
SessionManager.requireRole('admin')
```

---

## 📦 Estructura de Usuario

Cada usuario tiene los siguientes campos:

```javascript
{
  id: "user_1234567890_abc",
  email: "usuario@kampus.com",
  name: "Nombre Usuario",
  password: "hash_encriptado",
  career: "Ingeniería Civil",
  university: "Universidad de Chile",
  isPremium: false,
  isAdmin: false,
  role: "user", // 'user', 'moderator', 'admin'
  registeredAt: "2025-10-14T12:00:00.000Z",
  avatar: "https://i.pravatar.cc/150?img=1"
}
```

---

## 🚀 Cómo Crear Nuevos Usuarios

### 1. Desde el Login/Registro
- Ir a `/login_/_registro/code.html`
- Completar el formulario de registro
- Por defecto se crea con rol `user`

### 2. Manualmente desde la Consola
```javascript
// Crear usuario normal
SessionManager.register({
  name: 'Nuevo Usuario',
  email: 'nuevo@kampus.com',
  password: 'password123',
  university: 'Universidad de Chile',
  career: 'Derecho',
  role: 'user'
});

// Crear moderador
SessionManager.register({
  name: 'Nuevo Moderador',
  email: 'mod@kampus.com',
  password: 'password123',
  university: 'Universidad de Chile',
  career: 'Moderación',
  role: 'moderator',
  isPremium: true
});

// Crear administrador
SessionManager.register({
  name: 'Nuevo Admin',
  email: 'admin2@kampus.com',
  password: 'password123',
  university: 'Universidad de Chile',
  career: 'Administración',
  role: 'admin',
  isAdmin: true,
  isPremium: true
});
```

---

## 🎨 Badges de Rol (UI)

Los badges se muestran automáticamente en la interfaz:

- **👑 ADMIN** - Rojo (`bg-red-500`)
- **⚡ MOD** - Amarillo (`bg-yellow-500`)
- **👤 USER** - Gris (`bg-gray-500`)

Se pueden obtener con:
```javascript
const badge = Kampus.getRoleBadge();
// badge = { text: 'ADMIN', color: 'bg-red-500 text-white', icon: '👑' }
```

---

## 🔒 Seguridad

### Contraseñas
- Hasheadas con algoritmo simple (base64 + salt)
- En producción usar bcrypt con backend

### Sesiones
- Encriptadas con XOR cipher
- Duración: 7 días
- Almacenadas en localStorage + cookies

### Permisos
- Verificados en cada acción
- Jerarquía de roles estricta
- No se puede degradar a administradores

---

## 📞 Testing Rápido

### Probar Login como Admin:
1. Ir a `/login_/_registro/code.html`
2. Email: `admin@kampus.com`
3. Password: `admin123`
4. Hacer clic en "Iniciar Sesión"
5. Ir a `/dashboard_moderacion.html`
6. Deberías ver la pestaña **👥 Usuarios**

### Probar Login como Moderador:
1. Cerrar sesión si está activa
2. Email: `moderador@kampus.com`
3. Password: `mod123`
4. Ir a `/dashboard_moderacion.html`
5. **NO** deberías ver la pestaña de usuarios

### Probar Login como Usuario Normal:
1. Email: `demo@kampus.com`
2. Password: `demo123`
3. Intentar ir a `/dashboard_moderacion.html`
4. Deberías ser redirigido (acceso denegado)

---

## 💡 Tips

1. **Ver usuarios en consola:**
   ```javascript
   SessionManager.getAllUsers()
   ```

2. **Ver usuario actual:**
   ```javascript
   Kampus.getCurrentUser()
   ```

3. **Ver estadísticas de moderación:**
   ```javascript
   ModerationSystem.getStats()
   ```

4. **Limpiar todos los usuarios:**
   ```javascript
   localStorage.removeItem('kampus_users')
   location.reload()
   ```

---

¡El sistema de roles está completamente funcional! 🎉
