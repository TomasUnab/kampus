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