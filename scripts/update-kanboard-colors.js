/**
 * Script pour mettre à jour les couleurs des tâches Kanboard
 * Utilise l'API Kanboard JSON-RPC directement
 */

import https from 'https';

const KANBOARD_URL = 'https://board.rpcommu.fr/jsonrpc.php';
const KANBOARD_USERNAME = 'jsonrpc';
const KANBOARD_TOKEN = '32d85acf1d466e774d3a4d5a214814842a9fc6245fe29f68db3f88b0f66444e3';

// Mapping des tâches avec leurs couleurs
// Backend: red, Frontend: blue, Infrastructure: orange, Documentation: green, Tests/Sécurité: yellow
const taskColors = {
  // Backend (rouge)
  27: 'red',   // Modèles de données
  28: 'red',   // API REST Changelogs
  29: 'red',   // API REST Événements
  30: 'red',   // Routes Sites et Applications
  31: 'red',   // Validation des données
  32: 'red',   // Configuration Docker backend
  
  // Frontend (bleu)
  33: 'blue',  // Configuration Vue 3
  34: 'blue',  // Page Changelogs
  35: 'blue',  // Page Événements
  36: 'blue',  // Back Office Admin
  37: 'blue',  // Store Pinia Changelogs
  38: 'blue',  // Store Pinia Événements
  39: 'blue',  // Client API Axios
  40: 'blue',  // Design responsive
  
  // Infrastructure (orange)
  41: 'orange', // Docker Compose
  42: 'orange', // Intégration n8n
  
  // Documentation (vert)
  43: 'green',  // README
  44: 'green',  // Guide API REST
  45: 'green',  // Guide n8n
  
  // Tests/Sécurité (jaune)
  46: 'yellow', // Tests unitaires
  47: 'yellow'  // Sécurité authentification
};

function makeRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Basic ' + Buffer.from(KANBOARD_USERNAME + ':' + KANBOARD_TOKEN).toString('base64')
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function updateTaskColor(taskId, colorId) {
  const payload = {
    jsonrpc: '2.0',
    method: 'updateTask',
    id: Date.now(),
    params: {
      id: taskId,
      color_id: colorId
    }
  };

  try {
    const result = await makeRequest(KANBOARD_URL, payload);
    if (result.result) {
      console.log(`✅ Tâche ${taskId} mise à jour avec la couleur ${colorId}`);
      return true;
    } else {
      console.error(`❌ Erreur pour la tâche ${taskId}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de la tâche ${taskId}:`, error.message);
    return false;
  }
}

async function updateAllTaskColors() {
  console.log('🎨 Mise à jour des couleurs des tâches...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const [taskId, colorId] of Object.entries(taskColors)) {
    const success = await updateTaskColor(parseInt(taskId), colorId);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    // Petit délai pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 Résumé:`);
  console.log(`✅ ${successCount} tâches mises à jour avec succès`);
  console.log(`❌ ${errorCount} erreurs`);
}

// Exécuter le script
updateAllTaskColors().catch(console.error);
