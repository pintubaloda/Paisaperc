import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { PrismaService } from './prisma/prisma.service';
import { runAutoDemoSeed } from './seed/auto-seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false }));

  const parsedOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.enableCors({
    // Allow all origins if not explicitly configured (useful for fresh Railway setup).
    origin: parsedOrigins && parsedOrigins.length > 0 ? parsedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-callback-token'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  await runAutoDemoSeed(prismaService);

  const port = process.env.PORT || 8001;
  await app.listen(port, '0.0.0.0');
  console.log(`PaisaPe Backend running on port ${port}`);
}

bootstrap();
