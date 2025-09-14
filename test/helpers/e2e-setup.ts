import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Article,
  ArticleDocument,
} from '../../src/articles/schemas/article.schema';
import { User, UserDocument } from '../../src/users/schemas/user.schema';
import Role from '../../src/common/sharedTypes/roleEnum';
import { UsersService } from '../../src/users/users.service';
import { AuthService } from '../../src/auth/auth.service';
import * as request from 'supertest';

export class E2EContext {
  app!: INestApplication;
  mongod!: MongoMemoryReplSet;
  articleModel!: Model<ArticleDocument>;
  userModel!: Model<UserDocument>;

  async start(): Promise<void> {
    this.mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = await this.mongod.getUri();
    process.env.APP_PORT = '0';
    process.env.ALLOW_URL = '*';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES = '1d';
    process.env.REFRESHTOKEN_EXPIRESIN = '7d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await this.app.init();

    this.articleModel = this.app.get<Model<ArticleDocument>>(
      getModelToken(Article.name),
    );
    this.userModel = this.app.get<Model<UserDocument>>(
      getModelToken(User.name),
    );
  }

  async stop(): Promise<void> {
    try {
      await this.app.close();
      await this.mongod.stop();
    } catch {}
  }

  authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async createAdmin(
    email = 'admin@test.local',
  ): Promise<{ id: string; accessToken: string }> {
    const usersService = this.app.get(UsersService);
    const authService = this.app.get(AuthService);
    const admin = await usersService.create({
      email,
      password: 'secret12',
      username: email,
      role: Role.ADMIN,
    });
    const tokens = await authService.auth(admin._id as any);
    return { id: String(admin._id), accessToken: tokens.accessToken };
  }

  async createUser(
    email = 'user@test.local',
  ): Promise<{ id: string; accessToken: string }> {
    const usersService = this.app.get(UsersService);
    const authService = this.app.get(AuthService);
    const user = await usersService.create({
      email,
      password: 'secret12',
      username: email,
      role: Role.USER,
    });
    const tokens = await authService.auth(user._id as any);
    return { id: String(user._id), accessToken: tokens.accessToken };
  }

  async signup(email: string, password = 'secret12') {
    const resp = await request(this.app.getHttpServer())
      .post('/signup')
      .send({ email, password, username: email })
      .expect(201);
    return resp.body;
  }

  async seedArticles(): Promise<void> {
    await this.articleModel.deleteMany({});
    const fixedAuthor = new Types.ObjectId('68c692b3bc5de57eb9f4442c');
    await this.articleModel.create([
      {
        title: 'Nest intro',
        body: 'Basics',
        tags: ['nest', 'node'],
        isPublic: true,
        author: fixedAuthor,
      },
      {
        title: 'Mongo tips',
        body: 'Indexes',
        tags: ['mongo'],
        isPublic: true,
        author: fixedAuthor,
      },
      {
        title: 'Private note',
        body: 'Hidden',
        tags: ['secret'],
        isPublic: false,
        author: fixedAuthor,
      },
    ]);
  }
}
