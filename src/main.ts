import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/interceptors/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.setGlobalPrefix('v1');
  app.use(compression());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  const config = new DocumentBuilder()
    .setTitle('SnapWipe')
    .setDescription('Background Remover & Image Upscaler SaaS Api')
    .setVersion('1.0.0')
    .addTag('Users')
    .addTag('Auth')
    .build();
  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
