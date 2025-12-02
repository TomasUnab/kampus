// ============================================
// 📦 BUILD JS - KAMPUS
// Combinar scripts JS para producción
// ============================================

const fs = require('fs');
const path = require('path');

const scripts = [
  'js/security-manager.js',
  'js/session-manager.js',
  'js/cache-manager.js',
  'js/performance-optimizer.js',
  'js/notification-system.js',
  'js/moderation-system.js',
  'js/comments-system.js',
  'js/push-notifications.js',
  'js/error-reporter.js',
  'js/kampus-init.js'
];

const outputDir = path.join(__dirname, 'public');
const outputFile = path.join(outputDir, 'kampus.bundle.js');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Combinar scripts
let combined = '// KAMPUS Bundle - Generated\n\n';
let totalSize = 0;

scripts.forEach(script => {
  if (fs.existsSync(script)) {
    const content = fs.readFileSync(script, 'utf8');
    totalSize += content.length;
    combined += `// ===== ${script} =====\n${content}\n\n`;
    console.log(`✅ ${script} (${(content.length / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`❌ No encontrado: ${script}`);
  }
});

// Minificación básica
function minify(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/^\s+/gm, '')
    .replace(/\s+$/gm, '')
    .replace(/\n\s*\n/g, '\n');
}

// Escribir bundles
fs.writeFileSync(outputFile, combined);
const minFile = outputFile.replace('.js', '.min.js');
fs.writeFileSync(minFile, minify(combined));

const normalSize = fs.statSync(outputFile).size;
const minSize = fs.statSync(minFile).size;

console.log(`\n🎉 Bundles creados:`);
console.log(`📦 Normal: ${(normalSize / 1024).toFixed(2)} KB`);
console.log(`📦 Minificado: ${(minSize / 1024).toFixed(2)} KB`);
console.log(`💾 Reducción: ${((normalSize - minSize) / normalSize * 100).toFixed(1)}%`);
