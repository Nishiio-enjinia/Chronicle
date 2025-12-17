#!/bin/bash

# Script de démarrage pour Chronicle
# Usage: ./scripts/start.sh [dev|prod]

MODE=${1:-dev}

echo "🚀 Démarrage de Chronicle en mode $MODE"

if [ "$MODE" = "prod" ]; then
    echo "📦 Démarrage avec Docker Compose..."
    docker-compose up -d
    echo "✅ Services démarrés"
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔌 Backend: http://localhost:3000"
elif [ "$MODE" = "dev" ]; then
    echo "💻 Démarrage en mode développement..."
    echo "⚠️  Assurez-vous que MongoDB est démarré"
    
    # Démarrer le backend
    echo "📡 Démarrage du backend..."
    cd backend
    npm install
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Démarrer le frontend
    echo "🎨 Démarrage du frontend..."
    cd frontend
    npm install
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo "✅ Services démarrés"
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔌 Backend: http://localhost:3000"
    echo ""
    echo "Appuyez sur Ctrl+C pour arrêter les services"
    
    # Attendre les signaux
    trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
    wait
else
    echo "❌ Mode invalide. Utilisez 'dev' ou 'prod'"
    exit 1
fi


