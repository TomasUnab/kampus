/**
 * 🎨 PROFILE UI - Mejoras visuales para el perfil de usuario
 * 
 * Componentes:
 * - Modal de edición de perfil
 * - Gráficas de estadísticas
 * - Timeline de actividad
 * - Tooltips de insignias
 * - Animaciones y efectos
 */

// ✏️ MODAL DE EDICIÓN DE PERFIL
function openEditProfileModal() {
  // Validar que ProfileManager está disponible
  if (!window.ProfileManager || !window.ProfileManager.profile) {
    console.error('❌ ProfileManager no disponible');
    if (window.Toast) {
      Toast.error('Error: Sistema de perfiles no cargado');
    }
    return;
  }
  
  const profile = window.ProfileManager.profile;
  
  const modal = document.createElement('div');
  modal.id = 'edit-profile-modal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">✏️ Editar Perfil</h2>
        <button onclick="closeEditProfileModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- Avatar -->
        <div class="flex items-center gap-6">
          <div class="relative">
            <div id="preview-avatar" class="w-24 h-24 rounded-full bg-cover bg-center border-4 border-primary/20"
                 style="background-image: url('${profile.avatar || 'https://i.pravatar.cc/150?img=9'}')"></div>
            <button onclick="changeAvatar()" class="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary/80 transition-colors shadow-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Foto de perfil</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">JPG, PNG o GIF. Máximo 2MB.</p>
          </div>
        </div>

        <!-- Información básica -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre completo
            </label>
            <input type="text" id="edit-name" value="${profile.name}"
                   class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                   placeholder="Tu nombre completo">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Correo electrónico
            </label>
            <input type="email" id="edit-email" value="${profile.email}"
                   class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                   placeholder="tu.email@universidad.cl">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carrera
              </label>
              <input type="text" id="edit-career" value="${profile.career}"
                     class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                     placeholder="Tu carrera">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Universidad
              </label>
              <select id="edit-university"
                      class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <option ${profile.university === 'Universidad de Chile' ? 'selected' : ''}>Universidad de Chile</option>
                <option ${profile.university === 'Pontificia Universidad Católica' ? 'selected' : ''}>Pontificia Universidad Católica</option>
                <option ${profile.university === 'Universidad de Santiago' ? 'selected' : ''}>Universidad de Santiago</option>
                <option ${profile.university === 'Universidad de Concepción' ? 'selected' : ''}>Universidad de Concepción</option>
                <option ${profile.university === 'Universidad Técnica Federico Santa María' ? 'selected' : ''}>Universidad Técnica Federico Santa María</option>
                <option ${profile.university === 'Universidad Austral de Chile' ? 'selected' : ''}>Universidad Austral de Chile</option>
                <option ${profile.university === 'Universidad Adolfo Ibáñez' ? 'selected' : ''}>Universidad Adolfo Ibáñez</option>
                <option ${profile.university === 'Otra' ? 'selected' : ''}>Otra</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Biografía
            </label>
            <textarea id="edit-bio" rows="3"
                      class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      placeholder="Cuéntanos sobre ti...">${profile.bio || ''}</textarea>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span id="bio-count">0</span>/200 caracteres
            </p>
          </div>
        </div>

        <!-- Redes sociales -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔗 Redes Sociales</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
              <input type="url" id="edit-linkedin" value="${profile.social.linkedin || ''}"
                     class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                     placeholder="linkedin.com/in/tu-perfil">
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <input type="url" id="edit-github" value="${profile.social.github || ''}"
                     class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                     placeholder="github.com/tu-usuario">
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </div>
              <input type="url" id="edit-twitter" value="${profile.social.twitter || ''}"
                     class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                     placeholder="twitter.com/tu-usuario">
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
              </div>
              <input type="url" id="edit-website" value="${profile.social.website || ''}"
                     class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                     placeholder="tu-sitio-web.com">
            </div>
          </div>
        </div>

        <!-- Privacidad -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔒 Privacidad</h3>
          <div class="space-y-3">
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-gray-700 dark:text-gray-300">Perfil público</span>
              <input type="checkbox" id="edit-public" ${profile.preferences.publicProfile ? 'checked' : ''}
                     class="sr-only peer">
              <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-gray-700 dark:text-gray-300">Mostrar email</span>
              <input type="checkbox" id="edit-show-email" ${profile.preferences.showEmail ? 'checked' : ''}
                     class="sr-only peer">
              <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
        <button onclick="closeEditProfileModal()"
                class="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
          Cancelar
        </button>
        <button onclick="saveProfileChanges()"
                class="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/30">
          💾 Guardar cambios
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Contador de caracteres para bio
  const bioTextarea = document.getElementById('edit-bio');
  const bioCount = document.getElementById('bio-count');
  
  function updateBioCount() {
    const length = bioTextarea.value.length;
    bioCount.textContent = length;
    bioCount.className = length > 200 ? 'text-red-500 font-bold' : '';
    if (length > 200) {
      bioTextarea.value = bioTextarea.value.substring(0, 200);
    }
  }
  
  updateBioCount();
  bioTextarea.addEventListener('input', updateBioCount);

  // Cerrar al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeEditProfileModal();
    }
  });

  // Registrar evento
  if (window.Analytics) {
    Analytics.track('profile_edit_opened');
  }
}

function closeEditProfileModal() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) {
    modal.remove();
  }
}

function changeAvatar() {
  const avatars = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=2',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=4',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=9',
    'https://i.pravatar.cc/150?img=10',
    'https://i.pravatar.cc/150?img=16',
    'https://i.pravatar.cc/150?img=20',
    'https://i.pravatar.cc/150?img=25',
    'https://i.pravatar.cc/150?img=32',
    'https://i.pravatar.cc/150?img=45'
  ];

  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  document.getElementById('preview-avatar').style.backgroundImage = `url('${randomAvatar}')`;
  
  if (window.Toast) {
    Toast.info('💡 Avatar actualizado. Guarda los cambios para aplicar.');
  }
}

function saveProfileChanges() {
  const updates = {
    name: document.getElementById('edit-name').value.trim(),
    email: document.getElementById('edit-email').value.trim(),
    career: document.getElementById('edit-career').value.trim(),
    university: document.getElementById('edit-university').value,
    bio: document.getElementById('edit-bio').value.trim(),
    avatar: document.getElementById('preview-avatar').style.backgroundImage.match(/url\(['"]?([^'"]*)['"]?\)/)?.[1] || window.ProfileManager.profile.avatar,
    social: {
      linkedin: document.getElementById('edit-linkedin').value.trim(),
      github: document.getElementById('edit-github').value.trim(),
      twitter: document.getElementById('edit-twitter').value.trim(),
      website: document.getElementById('edit-website').value.trim()
    },
    preferences: {
      ...window.ProfileManager.profile.preferences,
      publicProfile: document.getElementById('edit-public').checked,
      showEmail: document.getElementById('edit-show-email').checked
    }
  };

  // Validaciones básicas
  if (!updates.name) {
    Toast.error('❌ El nombre es obligatorio');
    return;
  }

  if (updates.email && !updates.email.includes('@')) {
    Toast.error('❌ Email inválido');
    return;
  }

  // Guardar
  if (window.ProfileManager.updateProfile(updates)) {
    closeEditProfileModal();
    
    // Actualizar UI
    updateProfileUI();
    
    // Registrar actividad
    window.ProfileManager.addActivity('profile_edit', 'Perfil actualizado', { fields: Object.keys(updates) });
    
    // Recargar después de un momento para ver los cambios
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
}

// 🔄 Actualizar UI del perfil
function updateProfileUI() {
  if (!window.ProfileManager || !window.ProfileManager.profile) return;
  
  const profile = window.ProfileManager.profile;
  
  // Actualizar nombre
  const nameElements = document.querySelectorAll('[data-profile-name]');
  nameElements.forEach(el => el.textContent = profile.name);
  
  // Actualizar avatar (perfil y header)
  const avatarElements = document.querySelectorAll('[data-profile-avatar], [data-header-avatar]');
  avatarElements.forEach(el => {
    el.style.backgroundImage = `url('${profile.avatar}')`;
  });
  
  // Actualizar carrera
  const careerElements = document.querySelectorAll('[data-profile-career]');
  careerElements.forEach(el => el.textContent = profile.career);
  
  // Actualizar universidad
  const universityElements = document.querySelectorAll('[data-profile-university]');
  universityElements.forEach(el => el.textContent = profile.university);
}

// 🎨 Hacer funciones globales
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.changeAvatar = changeAvatar;
window.saveProfileChanges = saveProfileChanges;
window.updateProfileUI = updateProfileUI;

console.log('✅ Profile UI cargado');
