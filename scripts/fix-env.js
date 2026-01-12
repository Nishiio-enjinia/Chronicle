#!/usr/bin/env node

/**
 * Script pour corriger automatiquement le fichier .env
 * Usage: node scripts/fix-env.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '../backend/.env');
const templatePath = join(__dirname, '../backend/env.template');

console.log('🔧 Correction du fichier .env...\n');

// Vérifier si le fichier .env existe
if (!existsSync(envPath)) {
  console.log('📝 Le fichier .env n\'existe pas. Création depuis le template...');
  
  if (existsSync(templatePath)) {
    const template = readFileSync(templatePath, 'utf-8');
    writeFileSync(envPath, template, 'utf-8');
    console.log('✅ Fichier .env créé depuis le template\n');
  } else {
    console.error('❌ Le template env.template n\'existe pas !');
    process.exit(1);
  }
}

// Lire le fichier .env
let envContent = readFileSync(envPath, 'utf-8');

// Vérifier et corriger MONGODB_URI
const oldURI = 'mongodb://mongodb:27017/chronicle';
const newURI = 'mongodb://localhost:27017/chronicle';

if (envContent.includes(oldURI)) {
  console.log('⚠️  Ancienne URI détectée: mongodb://mongodb:27017/chronicle');
  envContent = envContent.replace(oldURI, newURI);
  writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ URI corrigée: mongodb://localhost:27017/chronicle\n');
} else if (envContent.includes(newURI)) {
  console.log('✅ L\'URI est déjà correcte: mongodb://localhost:27017/chronicle\n');
} else {
  // Chercher n'importe quelle ligne MONGODB_URI
  const uriMatch = envContent.match(/^MONGODB_URI=.*$/m);
  if (uriMatch) {
    console.log(`⚠️  URI trouvée: ${uriMatch[0]}`);
    envContent = envContent.replace(/^MONGODB_URI=.*$/m, `MONGODB_URI=${newURI}`);
    writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ URI mise à jour: mongodb://localhost:27017/chronicle\n');
  } else {
    // Ajouter la ligne si elle n'existe pas
    if (!envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `MONGODB_URI=${newURI}\n`;
    writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Ligne MONGODB_URI ajoutée: mongodb://localhost:27017/chronicle\n');
  }
}

console.log('✅ Fichier .env corrigé !');
console.log('💡 Vous pouvez maintenant tester avec: npm run check:db\n');
