# Script de démarrage PowerShell pour Chronicle
# Usage: .\scripts\start.ps1 [dev|prod]

param(
    [string]$Mode = "dev"
)

Write-Host "🚀 Démarrage de Chronicle en mode $Mode" -ForegroundColor Green

if ($Mode -eq "prod") {
    Write-Host "📦 Démarrage avec Docker Compose..." -ForegroundColor Cyan
    docker-compose up -d
    Write-Host "✅ Services démarrés" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
    Write-Host "🔌 Backend: http://localhost:3000" -ForegroundColor Yellow
}
elseif ($Mode -eq "dev") {
    Write-Host "💻 Démarrage en mode développement..." -ForegroundColor Cyan
    Write-Host "⚠️  Assurez-vous que MongoDB est démarré" -ForegroundColor Yellow
    
    # Démarrer le backend
    Write-Host "📡 Démarrage du backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    Start-Process -NoNewWindow npm -ArgumentList "run", "dev"
    Set-Location ..
    
    # Démarrer le frontend
    Write-Host "🎨 Démarrage du frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm install
    Start-Process -NoNewWindow npm -ArgumentList "run", "dev"
    Set-Location ..
    
    Write-Host "✅ Services démarrés" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
    Write-Host "🔌 Backend: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Appuyez sur Ctrl+C pour arrêter les services" -ForegroundColor Yellow
}
else {
    Write-Host "❌ Mode invalide. Utilisez 'dev' ou 'prod'" -ForegroundColor Red
    exit 1
}


