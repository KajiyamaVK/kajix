import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins or specify ['http://localhost:3000', 'https://yourfrontend.com']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configure JSON parser to handle potential invalid characters
  app.use(
    json({
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          // If JSON parsing fails, create a sanitized version
          if (e instanceof SyntaxError) {
            throw new SyntaxError('Invalid JSON: ' + e.message);
          }
          throw e;
        }
      },
    }),
  );

  // Set up global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Kajix API')
    .setDescription('The Kajix API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('token', 'Token confirmation endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
}

bootstrap()
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  })
  .then(() => {
    console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  });
