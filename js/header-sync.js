/**
 * 🔄 HEADER SYNC - Sincronización automática del header
 * 
 * Este script sincroniza automáticamente:
 * - Avatar del usuario
 * - Badge de rol (Admin, Moderador, Premium)
 * - Botón de moderación (solo admin/mod)
 * 
 * Funciona en todas las páginas del proyecto.
 */

(function() {
  'use strict';
  
  // Esperar a que el DOM esté listo
  function initHeaderSync() {
    // Verificar si hay usuario logueado
    if (!window.Kampus || !window.Kampus.isLoggedIn()) {
      (window.KampusLogger?.debug || console.log)('ℹ️ Header Sync: Usuario no logueado');
      return;
    }

    const user = window.Kampus.getCurrentUser();
    if (!user) {
      (window.KampusLogger?.debug || console.log)('⚠️ Header Sync: No se pudo obtener usuario');
      return;
    }
    
    try {
      // Sincronizar avatar
      syncAvatar(user);
      
      // Sincronizar badge de rol
      syncRoleBadge(user);
      
      // Sincronizar botón de moderación (si aplica)
      syncModerationButton(user);
      
      (window.KampusLogger?.debug || console.log)('✅ Header sincronizado para:', user.name);
    } catch (e) {
      (window.KampusLogger?.error || console.error)('❌ Error sincronizando header:', e);
    }
  }

  // Sincronizar avatar
  function syncAvatar(user) {
    const profileData = localStorage.getItem('kampus_user_profile');
    
    if (!profileData) {
      (window.KampusLogger?.debug || console.log)('ℹ️ Header Sync: No hay perfil guardado, usando avatar por defecto');
      return;
    }
    
    try {
      const profile = JSON.parse(profileData);
      
      if (!profile.avatar) {
        (window.KampusLogger?.debug || console.log)('⚠️ Header Sync: Perfil sin avatar');
        return;
      }
      
      // Buscar todos los avatares del header en la página
      const headerAvatars = document.querySelectorAll('[data-header-avatar]');
      
      if (headerAvatars.length === 0) {
        // Si no hay elementos con data-header-avatar, buscar avatares comunes en el header
        const header = document.querySelector('header');
        if (header) {
          const avatarElements = header.querySelectorAll('.w-10.h-10.rounded-full, .size-10.rounded-full');
          avatarElements.forEach(el => {
            if (el.style.backgroundImage || el.querySelector('img')) {
              el.style.backgroundImage = `url('${profile.avatar}')`;
              el.style.backgroundSize = 'cover';
              el.style.backgroundPosition = 'center';
            }
          });
        }
      } else {
        // Actualizar elementos con data-header-avatar
        headerAvatars.forEach(el => {
          el.style.backgroundImage = `url('${profile.avatar}')`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        });
      }
      
      (window.KampusLogger?.debug || console.log)('✅ Header Sync: Avatar actualizado');
      
    } catch (error) {
      (window.KampusLogger?.error || console.error)('❌ Header Sync: Error al parsear perfil', error);
    }
  }

  // Sincronizar badge de rol
  function syncRoleBadge(user) {
    try {
      const badge = window.Kampus?.getRoleBadge();
      if (!badge) return;

      // Buscar contenedor del badge en el header (primero buscar por ID, luego por atributo data)
      let badgeContainer = document.querySelector('#role-badge') || document.querySelector('[data-role-badge]');
      
      if (!badgeContainer) {
        // Si no existe, buscar lugar apropiado para insertarlo
        const header = document.querySelector('header');
        if (!header) return;

        // Buscar un lugar apropiado (junto al avatar o nombre de usuario)
        const userSection = header.querySelector('.flex.items-center.gap-4, .flex.items-center.space-x-4');
        
        if (userSection) {
          // Crear contenedor del badge
          badgeContainer = document.createElement('div');
          badgeContainer.id = 'role-badge';
          badgeContainer.setAttribute('data-role-badge', 'true');
          
          // Insertar antes del último elemento (usualmente el avatar o menú)
          if (userSection.lastElementChild) {
            userSection.insertBefore(badgeContainer, userSection.lastElementChild);
          } else {
            userSection.appendChild(badgeContainer);
          }
        }
      }

      if (badgeContainer) {
        // Mostrar el contenedor y actualizar el contenido
        badgeContainer.classList.remove('hidden');
        badgeContainer.innerHTML = `
          <span class="px-3 py-1 ${badge.color} rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap">
            ${badge.icon} ${badge.text}
          </span>
        `;
        (window.KampusLogger?.debug || console.log)('✅ Header Sync: Badge de rol actualizado');
      }
    } catch (error) {
      (window.KampusLogger?.error || console.error)('❌ Header Sync: Error sincronizando badge', error);
    }
  }

  // Sincronizar botón de moderación
  function syncModerationButton(user) {
    try {
      (window.KampusLogger?.debug || console.log)('🔍 Header Sync: Verificando permisos de moderación...');
      
      // Solo para admins y moderadores
      if (!window.Kampus?.isAdmin() && !window.Kampus?.isModerator()) {
        (window.KampusLogger?.debug || console.log)('ℹ️ Header Sync: Usuario sin permisos de moderación');
        // Ocultar botón si existe pero el usuario ya no es admin/mod
        const existingButton = document.querySelector('#moderation-link, [data-moderation-link]');
        if (existingButton) {
          existingButton.classList.add('hidden');
        }
        return;
      }

      (window.KampusLogger?.debug || console.log)('✅ Header Sync: Usuario tiene permisos de moderación');

      // Buscar si ya existe el botón (por ID primero, luego por atributo data)
      let modButton = document.querySelector('#moderation-link') || document.querySelector('[data-moderation-link]');
      
      if (modButton) {
        // Si existe, mostrarlo y asegurar que tenga flex
        modButton.classList.remove('hidden');
        // Forzar display flex con inline style para sobrescribir cualquier CSS
        modButton.style.display = 'flex';
        (window.KampusLogger?.info || console.log)('✅ Header Sync: Botón de moderación mostrado');
      } else {
        // Si no existe, crearlo
        const header = document.querySelector('header');
        if (!header) return;

        // Buscar navegación
        const nav = header.querySelector('nav');
        
        if (nav) {
          // Crear botón de moderación
          modButton = document.createElement('a');
          modButton.id = 'moderation-link';
          modButton.setAttribute('data-moderation-link', 'true');
          modButton.href = '../dashboard_moderacion.html';
          modButton.className = 'text-sm font-bold bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2';
          modButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span>Panel de Moderación</span>
          `;
          
          // Insertar después de los enlaces principales (no al inicio)
          const links = nav.querySelectorAll('a');
          if (links.length > 0) {
            // Insertar después del último enlace normal
            links[links.length - 1].after(modButton);
          } else {
            nav.appendChild(modButton);
          }
          (window.KampusLogger?.debug || console.log)('✅ Header Sync: Botón de moderación creado');
        }
      }
    } catch (error) {
      (window.KampusLogger?.error || console.error)('❌ Header Sync: Error sincronizando botón moderación', error);
    }
  }
  
  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Pequeño delay para asegurar que Kampus esté cargado
      setTimeout(initHeaderSync, 100);
    });
  } else {
    // DOM ya está listo, ejecutar inmediatamente
    // Pero esperar a que los scripts de KAMPUS estén cargados
    if (window.Kampus) {
      // Pequeño delay para asegurar que todo esté inicializado
      setTimeout(initHeaderSync, 100);
    } else {
      // Esperar a que se cargue KAMPUS
      window.addEventListener('load', () => {
        setTimeout(initHeaderSync, 100);
      });
    }
  }
  
  // Escuchar cambios en el localStorage (para sincronización entre pestañas)
  window.addEventListener('storage', function(e) {
    if (e.key === 'kampus_user_profile' || e.key === 'kampus_current_session_id') {
      (window.KampusLogger?.debug || console.log)('🔄 Header Sync: Datos actualizados en otra pestaña');
      initHeaderSync();
    }
  });

  // Exportar para uso manual
  window.HeaderSync = {
    init: initHeaderSync,
    syncAvatar,
    syncRoleBadge,
    syncModerationButton
  };
  
  (window.KampusLogger?.info || console.log)('✅ Header Sync cargado');
})();
