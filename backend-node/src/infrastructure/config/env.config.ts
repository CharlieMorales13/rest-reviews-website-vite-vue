import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env if needed
dotenv.config({ path: path.join(process.cwd(), '.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default(3000),
    DATABASE_URL: z.string().url('A valid DATABASE_URL must be provided'),
    JWT_SECRET: z.string().min(10, 'JWT_SECRET is required and must be secure'),
    JWT_EXPIRES_IN: z.string().default('1h'),
    SUPABASE_URL: z.string().url('SUPABASE_URL is required for storage'),
    SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY is required for storage'),
    ANALYTICS_URL: z.string().url().default('http://localhost:8001'),
});

const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        parsed.error.issues.forEach(issue => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });
        process.exit(1);
    }
    return parsed.data;
};

export const env = parseEnv();
