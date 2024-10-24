import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  uri: string;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
  };
}

const config: DatabaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/galaxyguard',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

export default config;
