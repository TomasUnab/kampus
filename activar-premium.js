/**
 * 🎁 SCRIPT PARA ACTIVAR/DESACTIVAR PREMIUM DE PRUEBA
 * 
 * Copia y pega en la consola del navegador (F12)
 * para activar o desactivar el modo Premium
 */

// ⭐ ACTIVAR PREMIUM (30 DÍAS)
function activarPremium() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  const premiumData = {
    plan: 'Kampus Premium',
    price: 990,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    features: [
      'Acceso ilimitado a todos los materiales',
      'Descargas ilimitadas',
      'Resúmenes con IA',
      'Sin anuncios',
      'Acceso prioritario a nuevo contenido'
    ]
  };
  
  // ⚠️ IMPORTANTE: Guardar AMBOS items necesarios para Premium
  localStorage.setItem('kampus_premium_active', 'true');
  localStorage.setItem('kampus_premium', JSON.stringify(premiumData));
  
  Toast.success('🎉 ¡Premium activado! Recarga la página (Ctrl+Shift+R)');
  
  console.log('%c⭐ PREMIUM ACTIVADO', 'color: gold; font-size: 20px; font-weight: bold');
  console.log('📅 Válido desde:', premiumData.startDate);
  console.log('📅 Válido hasta:', premiumData.endDate);
  console.log('💰 Precio:', '$' + premiumData.price);
  console.log('💎 Funciones:', premiumData.features);
  console.log('\n🔄 RECARGA LA PÁGINA para ver:');
  console.log('  ✨ Badge Premium dorado en el header');
  console.log('  📥 Widget de descargas mostrará "Ilimitadas"');
  console.log('  🤖 Botón de Resumen con IA activo');
  console.log('  🎨 Acceso a premium_activo/code.html');
  
  return premiumData;
}

// 🗑️ DESACTIVAR PREMIUM
function desactivarPremium() {
  localStorage.removeItem('kampus_premium');
  Toast.info('💔 Premium desactivado. Recarga la página.');
  
  console.log('%c❌ PREMIUM DESACTIVADO', 'color: gray; font-size: 16px; font-weight: bold');
  console.log('🔄 Recarga la página para volver al modo gratuito');
}

// 📊 VER ESTADO DE PREMIUM
function verEstadoPremium() {
  const isActive = isPremiumActive();
  const data = getPremiumData();
  
  console.log('%c📊 ESTADO DE PREMIUM', 'color: blue; font-size: 16px; font-weight: bold');
  console.log('Estado:', isActive ? '✅ ACTIVO' : '❌ INACTIVO');
  
  if (isActive && data) {
    console.log('\n💎 Detalles:');
    console.table({
      'Plan': data.plan,
      'Precio': '$' + data.price,
      'Inicio': data.startDate,
      'Fin': data.endDate
    });
    console.log('\n🎁 Funciones activas:');
    data.features.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  } else {
    console.log('\n💡 Usa activarPremium() para activar modo Premium');
  }
  
  return { isActive, data };
}

// 🎯 SIMULAR EXPIRACIÓN DE PREMIUM (para testing)
function expirarPremium() {
  const data = getPremiumData();
  if (!data) {
    console.warn('⚠️ No hay Premium activo para expirar');
    return;
  }
  
  // Cambiar fecha de fin a ayer
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  data.endDate = yesterday.toISOString().split('T')[0];
  
  localStorage.setItem('kampus_premium', JSON.stringify(data));
  
  Toast.warning('⏰ Premium expirado. Recarga para ver estado expirado.');
  console.log('%c⏰ PREMIUM EXPIRADO', 'color: orange; font-size: 16px; font-weight: bold');
  console.log('Fecha de expiración cambiada a:', data.endDate);
  console.log('🔄 Recarga la página para ver la pantalla de "Premium Expirado"');
}

// 🧪 MODO DE PRUEBA COMPLETO
function pruebaPremiumCompleta() {
  console.clear();
  console.log('%c🧪 PRUEBA COMPLETA DEL SISTEMA PREMIUM', 'color: purple; font-size: 20px; font-weight: bold');
  console.log('================================================\n');
  
  console.log('1️⃣ Estado actual:');
  verEstadoPremium();
  
  console.log('\n2️⃣ Activando Premium...');
  activarPremium();
  
  console.log('\n3️⃣ Instrucciones:');
  console.log('   a) Recarga la página con Ctrl+Shift+R');
  console.log('   b) Verifica el badge Premium en el header');
  console.log('   c) Ve a vista_previa_del_material/code.html');
  console.log('   d) Prueba el botón "Resumen con IA"');
  console.log('   e) Verifica descargas ilimitadas');
  console.log('   f) Ve a premium_activo/code.html');
  
  console.log('\n📝 Comandos útiles:');
  console.log('   verEstadoPremium()   - Ver estado actual');
  console.log('   desactivarPremium()  - Volver a modo gratuito');
  console.log('   expirarPremium()     - Simular expiración');
}

// 📚 AYUDA
function ayudaPremium() {
  console.log('%c📚 COMANDOS DISPONIBLES', 'color: blue; font-size: 18px; font-weight: bold');
  console.log('================================================\n');
  console.log('⭐ activarPremium()        - Activar Premium por 30 días');
  console.log('❌ desactivarPremium()     - Desactivar Premium');
  console.log('📊 verEstadoPremium()      - Ver estado y detalles');
  console.log('⏰ expirarPremium()        - Simular expiración (testing)');
  console.log('🧪 pruebaPremiumCompleta() - Prueba guiada completa');
  console.log('📚 ayudaPremium()          - Mostrar esta ayuda');
  console.log('\n================================================');
  console.log('💡 Tip: Después de activar/desactivar, recarga con Ctrl+Shift+R');
}

// 🎬 Auto-ejecutar al cargar el script
console.log('%c🎁 Script de Premium cargado', 'color: green; font-weight: bold');
console.log('Escribe ayudaPremium() para ver comandos disponibles\n');

// Hacer funciones globales
window.activarPremium = activarPremium;
window.desactivarPremium = desactivarPremium;
window.verEstadoPremium = verEstadoPremium;
window.expirarPremium = expirarPremium;
window.pruebaPremiumCompleta = pruebaPremiumCompleta;
window.ayudaPremium = ayudaPremium;
