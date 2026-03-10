import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Cargar variables del .env antes de configurar el datasource
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
