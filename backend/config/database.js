import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chronicle';
    
    console.log(`🔌 Tentative de connexion à MongoDB: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
    };

    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Vérifiez que MongoDB est démarré:');
      console.error('   - Si MongoDB est en Docker: docker-compose -f docker-compose.dev-db.yml up -d');
      console.error('   - Vérifiez que le port 27017 est accessible');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Erreur d\'authentification MongoDB');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Timeout de connexion - MongoDB ne répond pas');
      console.error('   - Vérifiez que MongoDB est démarré et accessible');
    }
    
    throw error;
  }
};

// Gestion de la déconnexion
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

















