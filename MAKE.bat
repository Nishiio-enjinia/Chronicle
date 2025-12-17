@echo off
REM Script de démarrage rapide pour Windows
REM Usage: make.bat [dev|prod|stop|logs]

set MODE=%1
if "%MODE%"=="" set MODE=prod

if "%MODE%"=="prod" (
    echo 🚀 Démarrage de Chronicle en mode production...
    docker-compose up -d
    echo ✅ Services démarrés
    echo 🌐 Frontend: http://localhost:5173
    echo 🔌 Backend: http://localhost:3000
    goto :end
)

if "%MODE%"=="dev" (
    echo 🚀 Démarrage de Chronicle en mode développement...
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
    goto :end
)

if "%MODE%"=="stop" (
    echo 🛑 Arrêt des services...
    docker-compose down
    goto :end
)

if "%MODE%"=="logs" (
    echo 📋 Affichage des logs...
    docker-compose logs -f
    goto :end
)

echo ❌ Mode invalide. Utilisez: dev, prod, stop ou logs

:end


