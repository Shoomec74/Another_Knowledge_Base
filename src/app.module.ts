import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './common/env.validation';
import { MongooseModule } from '@nestjs/mongoose';
import { databaseConfig } from './configs/mongo.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from './configs/throttler.config';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.dev', '.env'],
      validate: (config) => {
        const { error, value } = envValidationSchema.validate(config, {
          allowUnknown: true,
          abortEarly: false,
        });
        if (error) {
          throw error;
        }
        return value;
      },
    }),
    ThrottlerModule.forRootAsync(throttlerConfig()),
    MongooseModule.forRootAsync(databaseConfig()),
    AuthModule,
    UsersModule,
    ArticlesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
