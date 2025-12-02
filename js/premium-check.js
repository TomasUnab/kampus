/**
 * KAMPUS PREMIUM - Sistema de Verificación
 * Este archivo maneja la lógica de verificación y funcionalidades Premium
 */

// FLAGS DE CONTROL para evitar ejecuciones múltiples
let PREMIUM_BADGE_ADDED = false;
let PREMIUM_BANNER_ADDED = false;

/**
 * Validar integridad de datos Premium
 * @param {object} data - Datos de Premium a validar
 * @returns {boolean} - true si los datos son válidos
 */
function validatePremiumData(data) {
  if (!data || typeof data !== 'object') {
    console.error('❌ Datos Premium inválidos: no es un objeto');
    return false;
  }
  
  // Verificar campos requeridos
  const requiredFields = ['startDate', 'endDate', 'plan', 'price'];
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`❌ Datos Premium corruptos: falta campo "${field}"`);
      return false;
    }
  }
  
  // Verificar que las fechas sean válidas
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('❌ Datos Premium corruptos: fechas inválidas');
    return false;
  }
  
  // Verificar que endDate sea posterior a startDate
  if (endDate <= startDate) {
    console.error('❌ Datos Premium corruptos: fecha de fin anterior a fecha de inicio');
    return false;
  }
  
  // Verificar que el precio sea válido
  if (typeof data.price !== 'number' || data.price < 0) {
    console.error('❌ Datos Premium corruptos: precio inválido');
    return false;
  }
  
  console.log('✅ Datos Premium validados correctamente');
  return true;
}

// Verificar si el usuario tiene Premium activo
function isPremiumActive() {
  const premiumActive = localStorage.getItem('kampus_premium_active');
  const premiumData = localStorage.getItem('kampus_premium');
  
  if (premiumActive === 'true' && premiumData) {
    try {
      const data = JSON.parse(premiumData);
      
      // Validar integridad de datos
      if (!validatePremiumData(data)) {
        console.warn('⚠️ Datos Premium corruptos, limpiando...');
        localStorage.removeItem('kampus_premium_active');
        localStorage.removeItem('kampus_premium');
        
        // Notificar al usuario
        if (window.Toast) {
          Toast.error('Tu sesión Premium ha expirado o fue corrompida. Por favor, reactiva tu plan.', 5000);
        }
        
        return false;
      }
      
      const endDate = new Date(data.endDate);
      const now = new Date();
      
      // Verificar si no ha expirado
      if (endDate > now) {
        return true;
      } else {
        // Premium expirado, limpiar
        console.log('⏰ Premium expirado');
        localStorage.removeItem('kampus_premium_active');
        localStorage.removeItem('kampus_premium');
        
        // Registrar evento de expiración
        if (window.Analytics) {
          Analytics.track(Analytics.events.PREMIUM_EXPIRED, data);
        }
        
        // Notificar al usuario
        if (window.Toast) {
          Toast.warning('Tu plan Premium ha expirado. Renueva para seguir disfrutando de los beneficios.', 5000);
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error al verificar Premium:', error);
      localStorage.removeItem('kampus_premium_active');
      localStorage.removeItem('kampus_premium');
      return false;
    }
  }
  
  return false;
}

// Obtener datos de Premium
function getPremiumData() {
  const premiumData = localStorage.getItem('kampus_premium');
  if (premiumData) {
    try {
      const data = JSON.parse(premiumData);
      
      // Validar antes de retornar
      if (validatePremiumData(data)) {
        return data;
      }
    } catch (error) {
      console.error('❌ Error al obtener datos Premium:', error);
    }
  }
  return null;
}

// Agregar badge Premium al header
function addPremiumBadgeToHeader() {
  if (!isPremiumActive()) return;
  
  // ⛔ PROTECCIÓN: Si ya se agregó el badge, NO hacer nada
  if (PREMIUM_BADGE_ADDED) {
    console.log('⛔ Badge Premium ya fue agregado, saltando...');
    return;
  }
  
  console.log('🎯 addPremiumBadgeToHeader ejecutándose en:', window.location.pathname);
  
  // ELIMINAR todos los badges Premium existentes primero (protección ULTRA agresiva)
  const existingBadges = document.querySelectorAll(
    '#premium-badge-header, #profile-premium-badge, [id*="premium-badge"], ' +
    'header [class*="bg-gradient-to-r"], ' +
    'header [class*="from-yellow"], ' +
    'header [class*="from-orange"], ' +
    'header a[href*="premium_activo"], ' +
    'header div[onclick*="premium_activo"]'
  );
  
  if (existingBadges.length > 0) {
    console.log('🗑️ Eliminando', existingBadges.length, 'badges Premium encontrados');
    existingBadges.forEach((badge, index) => {
      console.log(`  ${index + 1}. Eliminando badge:`, badge.className || badge.id || 'sin clase/id');
      badge.remove();
    });
  } else {
    console.log('✓ No se encontraron badges duplicados para eliminar');
  }
  
  // Buscar el logo de Kampus de forma MÁS FLEXIBLE
  // Opción 1: Buscar h1 con "Kampus"
  let logoElement = document.querySelector('header h1');
  
  // Opción 2: Si no hay h1, buscar div que contenga SVG + texto Kampus
  if (!logoElement) {
    const headers = document.querySelectorAll('header div.flex.items-center');
    for (const header of headers) {
      if (header.textContent.includes('Kampus')) {
        logoElement = header;
        break;
      }
    }
  }
  
  if (!logoElement) {
    console.log('❌ No se encontró el logo de Kampus');
    return;
  }
  
  // Crear badge Premium pequeño y discreto
  const premiumBadge = document.createElement('div');
  premiumBadge.id = 'premium-badge-header';
  premiumBadge.className = 'inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full shadow-md font-bold text-xs hover:scale-105 transition-transform cursor-pointer ml-3';
  premiumBadge.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3">
      <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
    </svg>
    <span>Premium</span>
  `;
  premiumBadge.onclick = () => window.location.href = '../premium_activo/code.html';
  
  // Estrategia simple: Insertar siempre ANTES del <nav>
  const navElement = document.querySelector('header nav');
  
  if (navElement) {
    // Insertar antes del nav
    navElement.parentElement.insertBefore(premiumBadge, navElement);
    console.log('✅ Badge Premium insertado antes del nav');
    PREMIUM_BADGE_ADDED = true; // ✅ Marcar como agregado
  } else {
    // Si no hay nav, insertar después del logo
    logoElement.parentElement.insertBefore(premiumBadge, logoElement.nextSibling);
    console.log('✅ Badge Premium insertado después del logo');
    PREMIUM_BADGE_ADDED = true; // ✅ Marcar como agregado
  }
}

// Agregar enlace Premium a la navegación
function addPremiumNavLink() {
  if (!isPremiumActive()) return;
  
  // Buscar el nav
  const nav = document.querySelector('nav.hidden.md\\:flex, nav');
  if (!nav) return;
  
  // Verificar si ya existe el enlace
  if (document.getElementById('premium-nav-link')) return;
  
  // Crear enlace Premium con icono más limpio
  const premiumLink = document.createElement('a');
  premiumLink.id = 'premium-nav-link';
  premiumLink.className = 'text-sm font-bold text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors flex items-center gap-1.5';
  premiumLink.href = '../premium_activo/code.html';
  premiumLink.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
      <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
    </svg>
    <span>Premium</span>
  `;
  
  // Insertar en la navegación
  nav.appendChild(premiumLink);
}

// Mostrar botón "Generar Resumen IA" en vista previa
function enableAISummaryButton() {
  if (!isPremiumActive()) {
    console.log('⚠️ enableAISummaryButton: Usuario no tiene Premium activo');
    return;
  }
  
  console.log('🔍 enableAISummaryButton: Buscando contenedor de botones...');
  
  // Buscar el contenedor de acciones específico (donde están los botones de Descargar y Guardar)
  // Primero intentar por ID, luego por clase
  let actionsContainer = document.getElementById('material-actions-container');
  
  if (!actionsContainer) {
    console.log('⚠️ No se encontró contenedor por ID, intentando por clase...');
    // Fallback: buscar por clases (para compatibilidad con versiones anteriores)
    actionsContainer = document.querySelector('.flex.items-center.gap-4.pt-2, .flex.items-center.gap-3.pt-2');
  }
  
  if (!actionsContainer) {
    console.log('❌ No se encontró contenedor de botones de acción en vista previa');
    console.log('📄 Página actual:', window.location.pathname);
    return;
  }
  
  console.log('✅ Contenedor encontrado:', actionsContainer);
  
  // Verificar si ya existe el botón de IA
  if (document.getElementById('ai-summary-btn')) {
    console.log('ℹ️ Botón de IA ya existe');
    return;
  }
  
  console.log('✅ Agregando botón de Resumen IA Premium...');
  
  // Crear botón de resumen IA con estilo consistente (ajustado a px-4 py-2)
  const aiButton = document.createElement('button');
  aiButton.id = 'ai-summary-btn';
  aiButton.className = 'flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-sm hover:from-purple-700 hover:to-purple-800 transition-all shadow-md';
  aiButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
      <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
    </svg>
    <span>Resumen IA</span>
  `;
  
  aiButton.onclick = function() {
    // Crear modal de resumen IA
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-background-dark rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10">
                <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.36.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z"/>
              </svg>
              <div>
                <h3 class="text-2xl font-bold">Resumen IA Premium</h3>
                <p class="text-sm text-purple-100">Generado con GPT-4</p>
              </div>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-purple-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8">
                <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 animate-spin">
              <path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clip-rule="evenodd" />
            </svg>
            <span class="font-medium">Analizando material con IA...</span>
          </div>
          
          <div id="ai-summary-content" class="space-y-4">
            <!-- El contenido se generará aquí -->
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Simular generación de resumen
    setTimeout(() => {
      const content = document.getElementById('ai-summary-content');
      content.innerHTML = `
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
          <h4 class="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-purple-600">
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
            Resumen Ejecutivo
          </h4>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
            Este material cubre los conceptos fundamentales de álgebra lineal, incluyendo vectores, matrices, 
            sistemas de ecuaciones lineales y transformaciones. Se presenta una introducción teórica seguida 
            de ejemplos prácticos y ejercicios resueltos paso a paso.
          </p>
        </div>
        
        <div class="space-y-3">
          <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-purple-600">
              <path fill-rule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
            </svg>
            Puntos Clave
          </h4>
          <ul class="space-y-2">
            <li class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5">
                <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
              </svg>
              <span><strong>Vectores:</strong> Definición, operaciones básicas (suma, resta, producto escalar) y propiedades geométricas.</span>
            </li>
            <li class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5">
                <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
              </svg>
              <span><strong>Matrices:</strong> Tipos de matrices, operaciones (suma, multiplicación) y determinantes.</span>
            </li>
            <li class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5">
                <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
              </svg>
              <span><strong>Sistemas Lineales:</strong> Métodos de resolución (Gauss, Gauss-Jordan) y criterios de compatibilidad.</span>
            </li>
            <li class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5">
                <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
              </svg>
              <span><strong>Transformaciones:</strong> Concepto de transformación lineal, matriz asociada y aplicaciones.</span>
            </li>
          </ul>
        </div>
        
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 class="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-600">
              <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 01-.937-.171.75.75 0 11.374-1.453 5.261 5.261 0 002.626 0 .75.75 0 11.374 1.452 6.712 6.712 0 01-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
              <path fill-rule="evenodd" d="M9.013 19.9a.75.75 0 01.877-.597 11.319 11.319 0 004.22 0 .75.75 0 11.28 1.473 12.819 12.819 0 01-4.78 0 .75.75 0 01-.597-.876zM9.754 22.344a.75.75 0 01.824-.668 13.682 13.682 0 002.844 0 .75.75 0 11.156 1.492 15.156 15.156 0 01-3.156 0 .75.75 0 01-.668-.824z" clip-rule="evenodd" />
            </svg>
            Recomendaciones de Estudio
          </h4>
          <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Practica los ejercicios resueltos antes de intentar los propuestos</li>
            <li>• Revisa las propiedades de vectores y matrices regularmente</li>
            <li>• Utiliza software como MATLAB o Python para verificar resultados</li>
          </ul>
        </div>
        
        <div class="flex gap-3 pt-4">
          <button onclick="this.closest('.fixed').remove()" class="flex-1 py-3 px-6 rounded-lg border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cerrar
          </button>
          <button class="flex-1 py-3 px-6 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clip-rule="evenodd" />
            </svg>
            Descargar Resumen
          </button>
        </div>
      `;
    }, 2000);
  };
  
  // Insertar el botón ANTES del botón de Descargar
  const downloadBtn = actionsContainer.querySelector('button');
  if (downloadBtn) {
    actionsContainer.insertBefore(aiButton, downloadBtn);
    console.log('✅ Botón de Resumen IA insertado correctamente');
  } else {
    console.log('⚠️ No se encontró botón de descarga para insertar antes');
  }
}

// Remover límites de descarga
function removeDownloadLimits() {
  if (!isPremiumActive()) return;
  
  // Buscar mensajes de límite de descarga
  const limitMessages = document.querySelectorAll('.text-sm.text-gray-500, .text-xs.text-gray-400');
  limitMessages.forEach(msg => {
    if (msg.textContent.includes('descargas restantes') || msg.textContent.includes('límite')) {
      msg.remove();
    }
  });
  
  // Cambiar textos de botones
  const downloadButtons = document.querySelectorAll('button');
  downloadButtons.forEach(btn => {
    if (btn.textContent.includes('Descargar')) {
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.disabled = false;
    }
  });
}

// Ocultar anuncios
function hideAds() {
  if (!isPremiumActive()) return;
  
  // Buscar elementos de anuncios (por clases comunes)
  const adElements = document.querySelectorAll('.ad, .advertisement, [class*="ad-"], [class*="banner"]');
  adElements.forEach(ad => {
    ad.style.display = 'none';
  });
  
  // Ocultar spotlights promocionales de Premium
  const premiumSpotlights = document.querySelectorAll('[class*="spotlight"], [class*="premium-promo"], [class*="upgrade-banner"]');
  premiumSpotlights.forEach(spotlight => {
    spotlight.style.display = 'none';
  });
  
  // Buscar y ocultar cualquier elemento que contenga "Miembro Premium" pero NO sea nuestro banner
  setTimeout(() => {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const text = el.textContent;
      // Si contiene "workspace_premium" en texto visible y no es nuestro banner
      if (text && text.includes('workspace_premium') && !el.id.includes('dashboard-premium-banner') && !el.id.includes('premium-badge')) {
        const parent = el.closest('div[class*="fixed"], div[class*="absolute"]');
        if (parent && parent.style.zIndex && parseInt(parent.style.zIndex) > 40) {
          parent.style.display = 'none';
        }
      }
    });
  }, 100);
}

// Mostrar badge Premium en perfil
function addPremiumBadgeToProfile() {
  if (!isPremiumActive()) return;
  
  // ⚠️ SOLO ejecutar en página de perfil
  if (!window.location.pathname.includes('perfil')) {
    return;
  }
  
  // Buscar el contenedor del nombre en el perfil
  const profileName = document.querySelector('h1.text-2xl, h1.text-3xl');
  if (!profileName) return;
  
  // Verificar si ya existe
  if (document.getElementById('profile-premium-badge')) return;
  
  // Crear badge Premium para perfil con SVG (no Material Icons)
  const badge = document.createElement('span');
  badge.id = 'profile-premium-badge';
  badge.className = 'inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold ml-3 shadow-lg';
  badge.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
      <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
    </svg>
    <span>Premium</span>
  `;
  
  profileName.appendChild(badge);
}

// Agregar sección Premium en perfil
function addPremiumSectionToProfile() {
  if (!isPremiumActive()) return;
  
  const premiumData = getPremiumData();
  if (!premiumData) return;
  
  // Buscar SOLO en página de perfil (buscar el sidebar específico)
  const profileSidebar = document.querySelector('.grid.md\\:grid-cols-3 > div:first-child, aside');
  if (!profileSidebar) return;
  
  // Verificar si ya existe
  if (document.getElementById('premium-profile-section')) return;
  
  // Crear sección Premium con SVG
  const premiumSection = document.createElement('div');
  premiumSection.id = 'premium-profile-section';
  premiumSection.className = 'bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-2xl p-6 shadow-2xl';
  
  const endDate = new Date(premiumData.endDate);
  const formattedDate = endDate.toLocaleDateString('es-CL', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  
  premiumSection.innerHTML = `
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="bg-white/90 rounded-xl p-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-orange-600">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900">Miembro Premium</h3>
          <p class="text-sm text-gray-800">Plan activo</p>
        </div>
      </div>
      <span class="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">ACTIVO</span>
    </div>
    
    <div class="bg-white/20 backdrop-blur rounded-lg p-4 mb-4">
      <p class="text-sm text-gray-900 mb-1">Válido hasta:</p>
      <p class="text-lg font-bold text-gray-900">${formattedDate}</p>
    </div>
    
    <div class="space-y-2 mb-4">
      <div class="flex items-center gap-2 text-gray-900 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
        <span>Descargas ilimitadas</span>
      </div>
      <div class="flex items-center gap-2 text-gray-900 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
        <span>Resúmenes por IA</span>
      </div>
      <div class="flex items-center gap-2 text-gray-900 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
        <span>Sin anuncios</span>
      </div>
      <div class="flex items-center gap-2 text-gray-900 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
        <span>Soporte prioritario</span>
      </div>
    </div>
    
    <button onclick="window.location.href='../premium_activo/code.html'" class="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
        <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
      </svg>
      <span>Gestionar Premium</span>
    </button>
  `;
  
  // Insertar al inicio del sidebar
  profileSidebar.insertBefore(premiumSection, profileSidebar.firstChild);
}

// Agregar banner Premium en dashboard
function addPremiumBannerToDashboard() {
  if (!isPremiumActive()) return;
  
  // ⛔ PROTECCIÓN: Si ya se agregó el banner, NO hacer nada
  if (PREMIUM_BANNER_ADDED) {
    console.log('⛔ Banner Premium ya fue agregado, saltando...');
    return;
  }
  
  const premiumData = getPremiumData();
  if (!premiumData) return;
  
  // Buscar el contenedor principal del dashboard
  const mainContent = document.querySelector('.layout-container');
  if (!mainContent) return;
  
  // Verificar si ya existe
  if (document.getElementById('dashboard-premium-banner')) return;
  
  // Buscar el header para insertar después
  const header = mainContent.querySelector('header');
  if (!header) return;
  
  const endDate = new Date(premiumData.endDate);
  const formattedDate = endDate.toLocaleDateString('es-CL', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Crear banner Premium limpio con SVG
  const premiumBanner = document.createElement('div');
  premiumBanner.id = 'dashboard-premium-banner';
  premiumBanner.className = 'w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 px-10 py-6 relative overflow-hidden';
  premiumBanner.innerHTML = `
    <div class="relative flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="bg-white/90 rounded-xl p-3 shadow-lg flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-orange-600">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl font-bold text-gray-900">Miembro Premium</h2>
            <span class="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">ACTIVO</span>
          </div>
          <p class="text-sm text-gray-800 font-medium">Plan activo · Válido hasta: <span class="font-bold">${formattedDate}</span></p>
        </div>
      </div>
      
      <div class="flex items-center gap-3 flex-wrap">
        <div class="hidden md:flex items-center gap-6">
          <div class="flex items-center gap-2 text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-semibold">Descargas ilimitadas</span>
          </div>
          <div class="flex items-center gap-2 text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
            <span class="text-sm font-semibold">Resúmenes por IA</span>
          </div>
          <div class="flex items-center gap-2 text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-semibold">Sin anuncios</span>
          </div>
          <div class="flex items-center gap-2 text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-semibold">Soporte prioritario</span>
          </div>
        </div>
        <button onclick="window.location.href='../premium_activo/code.html'" class="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
          </svg>
          <span>Gestionar</span>
        </button>
      </div>
    </div>
  `;
  
  // Insertar después del header
  header.insertAdjacentElement('afterend', premiumBanner);
  PREMIUM_BANNER_ADDED = true; // ✅ Marcar como agregado
  console.log('✅ Banner Premium agregado al dashboard');
}

// Inicializar todas las funciones Premium
function initPremiumFeatures() {
  if (!isPremiumActive()) {
    console.log('ℹ️ Usuario no tiene Premium activo');
    return;
  }
  
  console.log('✅ Inicializando funciones Premium...');
  
  // Ejecutar todas las funciones
  addPremiumBadgeToHeader(); // Reactiva badge en header
  // addPremiumNavLink(); // Comentado para evitar duplicación
  addPremiumBannerToDashboard();
  enableAISummaryButton();
  removeDownloadLimits();
  hideAds();
  // addPremiumBadgeToProfile(); // Comentado - solo para página de perfil (interfiere con h1 de otras páginas)
  // addPremiumSectionToProfile(); // Comentado - solo para página de perfil
  
  console.log('✅ Funciones Premium activas');
}

// Auto-ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPremiumFeatures);
} else {
  initPremiumFeatures();
}

// Función para desactivar Premium (útil para testing)
function deactivatePremium() {
  localStorage.removeItem('kampus_premium_active');
  localStorage.removeItem('kampus_premium');
  console.log('❌ Premium desactivado');
  location.reload();
}

// Exponer funciones globalmente para debugging
window.kampusPremium = {
  isPremiumActive,
  getPremiumData,
  deactivatePremium,
  initPremiumFeatures
};
