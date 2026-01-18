import { defineConfig } from '@prisma/cli';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      provider: 'postgresql',
      url: 'postgresql://postgres:Chandu0607@KB@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
    },
  },
});