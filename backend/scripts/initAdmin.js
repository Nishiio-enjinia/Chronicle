import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const initAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }
    
    // Create admin user
    const admin = new User({
      username: 'admin',
      password: 'admin', // Will be hashed by pre-save hook
      role: 'admin',
      isActive: true
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: admin');
    console.log('   ⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

initAdmin();

