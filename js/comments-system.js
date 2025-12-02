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