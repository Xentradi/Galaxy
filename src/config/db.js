import mongoose from 'mongoose';
import config from './config.js';

const databaseURI = config.databaseURI || process.env.DATABASE_URI || 'mongodb://localhost:27017/galaxy';

export const connectDB = async () => {
  try {
    await mongoose.connect(databaseURI, {});

    mongoose.connection.on('connected', () => console.log('Mongoose connected to DB'));
    mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected from DB'));
    mongoose.connection.on('error', err => console.error('Mongoose connection error:', err));
    mongoose.connection.on('reconnected', () => console.log('Mongoose reconnected to DB'));

  } catch (err) {
    console.error('Database connection error:', err);
  }
};
