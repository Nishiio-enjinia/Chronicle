FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (inclure devDependencies pour nodemon en dev)
RUN npm install

# Copier le reste de l'application
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de démarrage avec installation des dépendances si nécessaire
# En production, utilisez: CMD ["node", "server.js"]
# En développement avec hot-reload: CMD ["npm", "run", "dev"]
CMD ["sh", "-c", "npm install && node server.js"]

