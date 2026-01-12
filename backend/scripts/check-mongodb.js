#!/usr/bin/env node

/**
 * Script de vérification de la connexion MongoDB
 * Usage: node scripts/check-mongodb.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chronicle';

console.log('🔍 Vérification de la connexion MongoDB...\n');
console.log(`📍 URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}\n`);

const checkConnection = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(mongoURI, options);
    
    console.log('✅ Connexion réussie !');
    console.log(`📊 Base de données: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔌 Port: ${mongoose.connection.port}`);
    
    // Lister les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion réussie');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur de connexion:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Vérifiez que MongoDB est démarré:');
      console.error('      docker-compose -f docker-compose.dev-db.yml up -d');
      console.error('   2. Vérifiez que le port 27017 n\'est pas utilisé par autre chose');
      console.error('   3. Si MongoDB est local, vérifiez qu\'il est démarré');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 MongoDB ne répond pas dans les temps');
      console.error('   - Vérifiez que MongoDB est accessible');
      console.error('   - Vérifiez votre firewall');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Problème d\'authentification');
      console.error('   - Vérifiez vos identifiants dans MONGODB_URI');
    }
    
    console.error('\n📝 Vérifiez votre fichier backend/.env');
    console.error('   MONGODB_URI doit être: mongodb://localhost:27017/chronicle');
    
    process.exit(1);
  }
};

checkConnection();
