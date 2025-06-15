import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

declare const module: any;

// Custom IoAdapter pour définir le path socket.io avec préfixe /api/games
class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any) {
    return super.createIOServer(port, {
      ...options,
      path: '/api/games/socket.io',  // 👈 path important à synchroniser avec le front
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useWebSocketAdapter(new CustomIoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('POGOS CORE')
    .setDescription('The core API description')
    .setVersion('1.0')
    .addTag('POGOS')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: configService.get('REDIS_HOST'),
      port: parseInt(configService.get('REDIS_PORT'), 10),
    },
  });

  app.useGlobalPipes(new ValidationPipe({transform:true}));

  await app.listen(configService.get('CORE_PORT'));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
