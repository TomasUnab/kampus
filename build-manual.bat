@echo off
echo 🔧 Build manual de KAMPUS
echo.

REM Crear directorio public
if not exist "public" mkdir public

REM Combinar archivos JS manualmente
echo // KAMPUS Bundle - Generated > public\kampus.bundle.js
echo. >> public\kampus.bundle.js

REM Agregar cada archivo
for %%f in (js\security-manager.js js\session-manager.js js\cache-manager.js js\performance-optimizer.js js\notification-system.js js\moderation-system.js js\comments-system.js js\push-notifications.js js\lazy-loader.js js\error-reporter.js js\kampus-init.js) do (
    if exist "%%f" (
        echo // ===== %%f ===== >> public\kampus.bundle.js
        type "%%f" >> public\kampus.bundle.js
        echo. >> public\kampus.bundle.js
        echo ✅ Agregado: %%f
    ) else (
        echo ❌ No encontrado: %%f
    )
)

echo.
echo 🎉 Bundle creado: public\kampus.bundle.js
echo 📦 Listo para usar
pause