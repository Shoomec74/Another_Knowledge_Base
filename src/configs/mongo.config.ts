import {
  MongooseModuleAsyncOptions,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

const databaseOptions = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const directUri = configService.get<string>('MONGODB_URI');
  if (directUri) {
    return { uri: directUri };
  }
  const env = configService.get<string>('NODE_ENV');
  const isProd = env === 'prod';

  const user = encodeURIComponent(configService.get<string>('DB_USERNAME')!);
  const pass = encodeURIComponent(configService.get<string>('DB_PASSWORD')!);
  const host = configService.get<string>('DB_HOST')!;
  const port = configService.get<string>('DB_PORT')!;
  const db = configService.get<string>('DB_NAME')!;
  const rs = configService.get<string>('DB_REPLICATION_SET') || '';

  const params: string[] = ['authSource=admin'];

  if (rs) params.push(`replicaSet=${encodeURIComponent(rs)}`);

  if (!isProd) params.push('directConnection=true');

  if (isProd) params.push('retryWrites=true', 'w=majority');

  const uri = `mongodb://${user}:${pass}@${host}:${port}/${db}?${params.join('&')}`;

  return {
    uri,
    // сюда можно добавить пул и таймауты при желании
    // serverSelectionTimeoutMS: isProd ? 10000 : 2000,
    // maxPoolSize: isProd ? 20 : 5,
  };
};

export const databaseConfig = (): MongooseModuleAsyncOptions => ({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) =>
    databaseOptions(configService),
});
