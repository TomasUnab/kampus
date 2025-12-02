// ============================================
// 🤖 SCRIPT DE INTEGRACIÓN AUTOMÁTICA
// Añade automáticamente los scripts de KAMPUS a tus páginas
// ============================================

const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const SCRIPTS_TO_ADD = [
  '<script src="../js/session-manager.js"></script>',
  '<script src="../js/cache-manager.js"></script>',
  '<script src="../js/performance-optimizer.js"></script>',
  '<script src="../js/notification-system.js"></script>',
  '<script src="../js/moderation-system.js"></script>',
  '<script src="../js/kampus-init.js"></script>'
];

const PAGES_TO_UPDATE = [
  'dashboard_principal/code.html',
  'subida_de_material/code.html',
  'resultados_de_búsqueda/code.html',
  'perfil_de_usuario/code.html',
  'mis_materiales/code.html',
  'vista_previa_del_material/code.html',
  'planes/code.html',
  'premium_activo/code.html'
  // login ya tiene session-manager, añadir manualmente si necesario
];

// ==========================================
// FUNCIONES
// ==========================================

function addScriptsToPage(filePath) {
  console.log(`\n📄 Procesando: ${filePath}`);
  
  try {
    // Leer archivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya tiene los scripts
    if (content.includes('kampus-init.js')) {
      console.log('   ⚠️  Ya tiene los scripts de KAMPUS');
      return false;
    }
    
    // Buscar cierre de </body>
    if (!content.includes('</body>')) {
      console.log('   ❌ No se encontró etiqueta </body>');
      return false;
    }
    
    // Añadir scripts antes de </body>
    const scriptsBlock = '\n  <!-- Sistemas KAMPUS -->\n  ' + 
                         SCRIPTS_TO_ADD.join('\n  ') + 
                         '\n\n';
    
    content = content.replace('</body>', scriptsBlock + '</body>');
    
    // Guardar archivo
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('   ✅ Scripts añadidos correctamente');
    return true;
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return false;
  }
}

function createBackup(filePath) {
  const backupPath = filePath.replace('.html', '.backup.html');
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`   💾 Backup creado: ${backupPath}`);
    return true;
  } catch (error) {
    console.log('   ⚠️  No se pudo crear backup:', error.message);
    return false;
  }
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    skipped: results.filter(r => r.skipped).length,
    details: results
  };
  
  const reportPath = 'integracion-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Reporte guardado en: ${reportPath}`);
  
  return report;
}

// ==========================================
// EJECUCIÓN PRINCIPAL
// ==========================================

console.log('🤖 INTEGRACIÓN AUTOMÁTICA DE SISTEMAS KAMPUS');
console.log('='.repeat(50));

const results = [];

// Preguntar si crear backups
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('¿Crear backups de los archivos? (s/n): ', (answer) => {
  const createBackups = answer.toLowerCase() === 's';
  
  console.log('\n🚀 Iniciando integración...\n');
  
  PAGES_TO_UPDATE.forEach(pagePath => {
    const result = {
      file: pagePath,
      success: false,
      skipped: false,
      message: ''
    };
    
    // Verificar que el archivo exista
    if (!fs.existsSync(pagePath)) {
      result.skipped = true;
      result.message = 'Archivo no encontrado';
      console.log(`⚠️  Saltando: ${pagePath} (no encontrado)`);
      results.push(result);
      return;
    }
    
    // Crear backup si se solicitó
    if (createBackups) {
      createBackup(pagePath);
    }
    
    // Añadir scripts
    const added = addScriptsToPage(pagePath);
    result.success = added;
    result.message = added ? 'Scripts añadidos' : 'Ya tenía scripts o error';
    results.push(result);
  });
  
  // Generar reporte
  console.log('\n' + '='.repeat(50));
  const report = generateReport(results);
  
  console.log('\n📊 RESUMEN:');
  console.log(`   Total:    ${report.total}`);
  console.log(`   ✅ Éxito:  ${report.success}`);
  console.log(`   ❌ Error:   ${report.failed}`);
  console.log(`   ⚠️  Saltado: ${report.skipped}`);
  
  console.log('\n✨ Proceso completado');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisar archivos modificados');
  console.log('   2. Abrir test-automatizado.html');
  console.log('   3. Ejecutar todos los tests');
  console.log('   4. Verificar que todo funciona');
  
  rl.close();
});

// ==========================================
// FUNCIONES ADICIONALES
// ==========================================

// Restaurar desde backup
function restoreFromBackup(filePath) {
  const backupPath = filePath.replace('.html', '.backup.html');
  
  if (!fs.existsSync(backupPath)) {
    console.log('❌ No existe backup para:', filePath);
    return false;
  }
  
  try {
    fs.copyFileSync(backupPath, filePath);
    console.log('✅ Restaurado desde backup:', filePath);
    return true;
  } catch (error) {
    console.log('❌ Error al restaurar:', error.message);
    return false;
  }
}

// Verificar integración
function verifyIntegration(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const checks = {
      hasSessionManager: content.includes('session-manager.js'),
      hasCacheManager: content.includes('cache-manager.js'),
      hasPerformance: content.includes('performance-optimizer.js'),
      hasNotifications: content.includes('notification-system.js'),
      hasModeration: content.includes('moderation-system.js'),
      hasInit: content.includes('kampus-init.js')
    };
    
    const allPassed = Object.values(checks).every(v => v);
    
    return {
      passed: allPassed,
      checks
    };
    
  } catch (error) {
    return {
      passed: false,
      error: error.message
    };
  }
}

// Exportar funciones para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addScriptsToPage,
    createBackup,
    restoreFromBackup,
    verifyIntegration,
    generateReport
  };
}
