import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

//-- Подключение глобального обработчика для перехвата необработанных исключений и отклоненных промисов --//
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //-- Получение сервиса конфигурации и настройка глобального префикса для всех маршрутов --//
  const configService = app.get(ConfigService);

  //-- Настройка CORS --//
  const cors = {
    origin: `${configService.get('ALLOW_URL')}`, //-- Разрешить запросы с любого источника --//
    methods: 'GET,PUT,PATCH,POST,DELETE', //-- Разрешенные HTTP-методы --//
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'], //-- Разрешенные заголовки --//
    credentials: true, //-- Поддержка учетных данных --//
  };

  app.enableCors(cors);

  //-- Применение промежуточного ПО Helmet для увеличения безопасности приложения --//
  app.use(
    helmet({
      contentSecurityPolicy: false, // Отключение политики CSP для ручной настройки позже
      xssFilter: true, // Включение защиты от XSS-атак
      frameguard: { action: 'deny' }, // Блокировка встраивания сайта в iframe
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Включение HSTS для HTTPS
      noSniff: true, // Запрещение браузеру определять тип MIME автоматически
      ieNoOpen: true, // Защита от файловых атак в Internet Explorer
    }),
  );

  //-- Настройка Swagger для автогенерации документации API --//
  const config = new DocumentBuilder()
    .setTitle('API root_botorio')
    .setDescription('Описание запросов для работы с сервисом')
    .setVersion('1.0')
    .addTag('auth', 'Авторизация пользователей')
    .addTag('users', 'Пользователи')
    .addTag('articles', 'Статьи пользователей')
    .addBearerAuth() //-- Настройка схемы авторизации --//
    .build(); //-- Завершаем конфигурирование вызовом build --//

  //-- Создание документа Swagger и его экспорт в формате YAML --//
  const document = SwaggerModule.createDocument(app, config);

  const yamlDocument = yaml.dump(document);

  fs.writeFileSync('./swagger.yaml', yamlDocument, 'utf8');

  //-- Настройка маршрута для доступа к документации через веб-интерфейс --//
  SwaggerModule.setup(
    `${configService.get('SWAGGER_PREFIX')}`,
    app,
    document,
  );

  //-- Установка порта из конфигурации --//
  const port = configService.get('APP_PORT');

  await app.listen(port);
}
bootstrap();
