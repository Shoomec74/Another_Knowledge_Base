## Another Knowledge Base (Backend)

### Стек
- NestJS 10, TypeScript, Mongoose 7, JWT, CASL, Joi, Swagger, migrate-mongo, mongodb-memory-server (e2e)

### Обоснование решений
- MongoDB: простая схема статей/пользователей, теги и флаги удобно мапятся на документную модель; индексы покрывают типичные запросы. Сложные агрегирующие запросы и пайплайны тоже позволяют гибко, работать с коллекциями. 
- CASL: понятный и простой контроль доступа, в т.ч. по владению документом. CASL есть так же для реакта, для фуллстек решения очень хорошо подходит на мой взгляд.
- migrate-mongo: декларативные миграции, возможность сидов и индексов, интеграция с CI/CD.
- Nest Swagger не успел нормально оформить, так как уже времени не остается, но в целом гляньте давно я писал фабрику для генерации API properties, чтобы убрать шум декораторов в контролерах. Уже не успею нормально оформить, просто пусть будет как опция, что я это знаю и умею.
- unit тесты почти пустые потому что приложение простое нет сложных бизнес функций, решил покрыть лучше целиком функионал с помощью e2e. e2e поднимутся на mongodb-memory-server, внешняя БД не нужна. 

### Возможности
- CRUD статей с флагами `isPublic/isPublished/isDraft`, фильтрация по тегам
- Аутентификация (local, JWT), logout с blacklist для access-токенов
- Контроль доступа через CASL (роль ADMIN/USER, права на ресурсы и по владению)
- Валидация и санитизация DTO, Helmet, CORS, Throttler
- Swagger UI (см. SWAGGER_PREFIX), e2e-тесты

### Требования
- Node 18+, npm 9+
- MongoDB (лучше через docker-compose), replica set (для работы транзакций необходима хотя бы однонодовая реплика)

### Переменные окружения (.env)
См. `env.example`. Ключевые:
- APP_PORT, ALLOW_URL
- JWT_SECRET, JWT_EXPIRES, REFRESHTOKEN_EXPIRESIN
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_REPLICATION_SET или MONGODB_URI
- SWAGGER_PREFIX
- HASH_KEY
- SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_USERNAME (для миграции-сиды админа)

### Установка и запуск (локально)
```bash
# Установите зависимости
npm ci
#Создайте файл с переменными
cp env.example .env
#Создайте ключ файл для авторизации между репликами
openssl rand -base64 756 > mongo-keyfile
# поднимите Mongo через docker-compose (лучше так)
docker compose up -d
# прогон миграций (индексы + сид админа) + старт сервера
npm run start:with-migrate
```

### Тесты ручек с postman
Выполните импорт колекции для тестов `Perfomance Group Test.postman_collection.json` в корне проекта.

Зарегистрируйте нового пользователя. 

Далее лучше всего сначала выполнить `signin`, чтобы тест сохранил `{{base_token}}`.

Для удобства тестов суперадминского функционала добавил в постман отдельный `signinAdmin`.

### Swagger UI
Swagger UI: `http://localhost:<APP_PORT>/<SWAGGER_PREFIX>`

Если ничего не будете менять то - "http://localhost:5678/jhgkdf1ljg1hdjf34543kghkdfjghj3345343734567kdfhgjkdf453454hgjkdfhgkljdfhjgkh#/"

### Миграции (migrate-mongo)
- Конфигурация: `migrate-mongo-config.js` (читает .env, директория миграций: `src/migrations`)
- Команды:
```bash
npm run migrate:create    # создать миграцию
npm run migrate:up        # применить все
npm run migrate:down      # откатить последнюю
```
- Дефолтная миграция: `20250914120000-init-indexes-and-admin.js`
  - создаёт индексы: `users (uniq email, role, deletedAt)`, `articles (tags, author, flags, deletedAt)`, `blacklisttokens (uniq token, expirationDate)`
  - сидирует супер-админа из `SEED_ADMIN_*` (если ещё не существует)
  - ВНИМАНИЕ! Я знаю, что миграции не для инициализаций записей в БД, но времени было в обрез уже, чтобы писать отдельно какое-то решение, пришлось немного шалить =) Надеюсь вы читаете это и с пониманием отнесётесь. 

### Запуск с автоматическими миграциями
```bash
npm run start:with-migrate       # миграции -> старт
npm run start:dev:with-migrate   # миграции -> старт в watch
```

### Docker (Mongo)
```bash
docker compose up -d mongo
```

#### Подготовка keyfile для реплика-сета Mongo (обязательно перед сборкой образа)
В корне проекта должен лежать файл `mongo-keyfile`, он копируется при сборке образа Mongo. Сгенерируйте его один раз:

Git Bash/Linux/macOS:
```bash
openssl rand -base64 756 > mongo-keyfile
```

Затем поднимайте Mongo:
```bash
docker compose up -d mongo
```

### Тесты
```bash
npm run test
npm run test:e2e
```