# 🚀 Guía de Deployment - KAMPUS

## 📱 **GitHub Pages (Recomendado)**

### Paso 1: Subir a GitHub
```bash
# Inicializar repositorio
git init
git add .
git commit -m "Initial commit - KAMPUS MVP"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU-USUARIO/kampus.git
git branch -M main
git push -u origin main
```

### Paso 2: Activar GitHub Pages
1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: `main` / `(root)`
5. Save

**¡Listo!** Tu app estará en: `https://TU-USUARIO.github.io/kampus`

## 🌐 **Otras Opciones de Hosting**

### Netlify (Drag & Drop)
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta del proyecto
3. ¡Automático!

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📦 **Build para Producción**

Antes de subir, ejecuta:

```bash
# Build manual (sin Node.js)
.\build-manual.bat

# O con Node.js
npm run build
```

Esto genera:
- `public/kampus.bundle.js` - Todos los scripts combinados
- `public/kampus.bundle.min.js` - Versión minificada

## 🔧 **Configuración de Producción**

### 1. Actualizar URLs en HTML
Cambia las rutas relativas si es necesario:
```html
<!-- Desarrollo -->
<script src="js/session-manager.js"></script>

<!-- Producción (opcional) -->
<script src="public/kampus.bundle.min.js"></script>
```

### 2. Configurar Service Worker
En `service-worker.js`, actualiza las rutas:
```javascript
const STATIC_ASSETS = [
  '/',
  '/dashboard_principal/code.html',
  '/material-ejemplo.html',
  // ... más rutas
];
```

### 3. Configurar Manifest
En `manifest.json`, actualiza la URL base:
```json
{
  "start_url": "/kampus/dashboard_principal/code.html",
  "scope": "/kampus/"
}
```

## 🔒 **Headers de Seguridad**

Para hosting personalizado, agrega estos headers:

### Netlify (`_headers` file)
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Apache (`.htaccess`)
```apache
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

## 📊 **Monitoreo**

### Google Analytics (opcional)
```html
<!-- En <head> de cada página -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🐛 **Troubleshooting**

### Problema: Service Worker no funciona
**Solución**: Debe servirse desde HTTPS o localhost

### Problema: PWA no se instala
**Solución**: Verifica que `manifest.json` sea accesible y válido

### Problema: Notificaciones no funcionan
**Solución**: Requiere HTTPS y permisos del usuario

## ✅ **Checklist Pre-Deploy**

- [ ] Build ejecutado correctamente
- [ ] Todas las rutas funcionan
- [ ] Service Worker registrado
- [ ] Manifest.json válido
- [ ] HTTPS configurado
- [ ] URLs actualizadas para producción
- [ ] Tests básicos pasando

## 🔄 **CI/CD Automático (GitHub Actions)**

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Build
      run: |
        npm install
        npm run build
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

¡Con esto tendrás deployment automático en cada push! 🚀