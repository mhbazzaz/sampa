import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import { I18nValidationPipe } from 'nestjs-i18n';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/global-exception.filter';
import { Dotenv } from './config/dotenv';
import { LoggerService } from './logger/logger.service';
import { Vault } from './vault/vault';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const server = app.getHttpServer();

  server.setTimeout(10 * 60 * 1000);
  server.keepAliveTimeout = 10 * 60 * 1000;
  server.headersTimeout = 10 * 60 * 1000 + 1000;

  app.useStaticAssets(join(__dirname, '..', 'files/excel/template'), {
    prefix: '/asset-management/files/excel/template/',
  });
  app.useStaticAssets(join(__dirname, '..', 'files/assetType/icons'), {
    prefix: '/asset-management/files/assetType/icons',
  });

  app.use(cookieParser());

  const TRUSTED_FRONTEND_URLS = await Vault.instance.get(
    'TRUSTED_FRONTEND_URLS',
    'share',
  );

  app.enableCors({
    origin: TRUSTED_FRONTEND_URLS.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.setGlobalPrefix('asset-management/api/v1');

  const loggerClient = app.get(LoggerService);
  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter(loggerClient));

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.use(
    '/doc',
    basicAuth({
      challenge: true,
      users: {
        [Dotenv.instance.env.SWAGGER_USERNAME]:
          Dotenv.instance.env.SWAGGER_PASSWORD,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Asset Management App')
    .setDescription('API description for Asset Management application')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app as any, config, {
    autoTagControllers: false,
  });

  SwaggerModule.setup('/doc', app as any, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(Dotenv.instance.env.APPLICATION_PORT);
  console.log(`listening on ${Dotenv.instance.env.APPLICATION_PORT}`);
}
bootstrap();
