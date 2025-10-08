import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    database: process.env.MYSQL_DB || 'user_db',
  },
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/product_db',
  },
}));
