.PHONY: help start stop logs build clean dev prod

help: ## Affiche l'aide
	@echo "Commandes disponibles :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Démarre Chronicle en mode production
	@echo "🚀 Démarrage de Chronicle..."
	docker-compose up -d
	@echo "✅ Services démarrés"
	@echo "🌐 Frontend: http://localhost:5173"
	@echo "🔌 Backend: http://localhost:3000"

dev: ## Démarre Chronicle en mode développement (hot-reload)
	@echo "🚀 Démarrage de Chronicle en mode développement..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

stop: ## Arrête tous les services
	@echo "🛑 Arrêt des services..."
	docker-compose down

logs: ## Affiche les logs
	docker-compose logs -f

build: ## Reconstruit les images Docker
	@echo "🔨 Reconstruction des images..."
	docker-compose build

clean: ## Nettoie tout (arrête et supprime volumes)
	@echo "🧹 Nettoyage..."
	docker-compose down -v

restart: ## Redémarre les services
	@echo "🔄 Redémarrage..."
	docker-compose restart

ps: ## Affiche l'état des conteneurs
	docker-compose ps


