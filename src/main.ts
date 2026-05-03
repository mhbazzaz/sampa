import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import * as basicAuth from 'express-basic-auth';
import { I18nValidationPipe } from 'nestjs-i18n';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/global-exception.filter';
import { Dotenv } from './config/dotenv';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'files/test-case/images'), {
    prefix: '/sampa/files/test-case/images',
  });

  app.enableCors();
  app.setGlobalPrefix('sampa/api/v1');

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
    .setTitle('Sampa App')
    .setDescription('API description for SAMPA application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: `admin access token`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'header',
      },
      'adminAccessToken',
    )
    .addBearerAuth(
      {
        description: `idp token`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'header',
      },
      'idp-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app as any, config, {
    autoTagControllers: false,
  });
  SwaggerModule.setup('doc', app as any, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(Dotenv.instance.env.APPLICATION_PORT);
  console.log(` listening on ${Dotenv.instance.env.APPLICATION_PORT}`);
}
bootstrap();
