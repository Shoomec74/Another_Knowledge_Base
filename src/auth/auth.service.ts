import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { randomBytes } from 'crypto';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { Types } from 'mongoose';
import Role from 'src/common/sharedTypes/roleEnum';
import { HashService } from 'src/common/hashService/hash.service';
import { ITokens } from 'src/common/sharedTypes/tokens';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private hashService: HashService,
    private readonly configService: ConfigService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  //-- Метод для генерации пары токенов доступа и обновления --//
  private async getTokens(profileId: Types.ObjectId): Promise<ITokens> {
    //-- Базовый пейлоад для токенов, содержащий идентификатор профиля (sub) --//
    const basePayload = { sub: profileId };

    //-- Пейлоад для токена доступа с добавлением уникального идентификатора (jti) и указанием типа токена --//
    const accessTokenPayload = {
      ...basePayload,
      jti: randomBytes(16).toString('hex'), // Генерация случайного идентификатора JWT
      type: 'access',
    };

    //-- Пейлоад для токена обновления с добавлением уникального идентификатора (jti) и указанием типа токена --//
    const refreshTokenPayload = {
      ...basePayload,
      jti: randomBytes(16).toString('hex'), // Генерация случайного идентификатора JWT
      type: 'refresh',
    };

    //-- Создание токена доступа с использованием пейлоада токена доступа --//
    const accessToken = this.jwtService.sign(accessTokenPayload);

    //-- Создание токена обновления с использованием пейлоада токена обновления и установкой срока действия --//
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: this.configService.get('REFRESHTOKEN_EXPIRESIN'), //-- Срок действия токена обновления --//
    });

    //-- Возвращение объекта с токенами доступа и обновления --//
    return { accessToken, refreshToken };
  }

  //-- Метод для аутентификации пользователя и получения токенов доступа и обновления --//
  async auth(userId: Types.ObjectId): Promise<ITokens> {
    //-- Генерация токенов доступа и обновления для профиля пользователя --//
    const tokens = await this.getTokens(userId);

    //-- Сохранение токена обновления в базе данных и получение обновленного профиля --//
    await this.usersService.saveRefreshToken(
      userId, //-- Идентификатор профиля пользователя --//
      tokens, //-- Сгенерированные токены --//
    );

    //-- Поиск и возвращение данных аккаунта пользователя по идентификатору и типу аккаунта --//
    return tokens;
  }

  //-- Метод для проверки пароля пользователя --//
  async validatePassword(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    //-- Если аккаунт не найден, выбрасывается исключение --//
    if (!user) {
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    } else {
      //-- Проверка соответствия введенного пароля сохраненному в базе данных --//
      const isPasswordMatched = await this.hashService.hashCompare(
        password, //-- Введенный пароль --//
        user.credentials.password, //-- Пароль, сохраненный в базе данных --//
      );

      //-- Если пароли не совпадают, выбрасывается исключение --//
      if (!isPasswordMatched) {
        throw new UnauthorizedException('Неверное имя пользователя или пароль');
      } else {
        //-- В случае успешной проверки возвращается профиль пользователя --//
        delete user.credentials.password;
        return user;
      }
    }
  }

  async refreshToken(oldRefreshToken: string): Promise<ITokens> {
    //-- Проверяем, есть ли oldRefreshToken в базе данных и удаляем его --//
    const user =
      await this.usersService.findAndDeleteRefreshToken(oldRefreshToken);

    if (!user) {
      throw new UnauthorizedException('Невалидный refreshToken');
    }

    //-- Создаем новые accessToken и refreshToken --//
    const tokens = await this.getTokens(user._id);

    //-- Обновляем refreshToken в базе данных --//
    await this.usersService.saveRefreshToken(user._id, tokens);

    return tokens;
  }

  //-- Метод для регистрации пользователя с возможностью указания типа аккаунта и реферальной ссылки --//
  async registration(authDto: CreateUserDto): Promise<User> {
    //-- Деструктуризация для извлечения данных профиля и аккаунта из DTO --//
    const { email, password } = authDto;

    //-- Запуск сессии MongoDB для поддержки транзакций --//
    const session = await this.connection.startSession();

    //-- Начало транзакции --//
    session.startTransaction();

    try {
      //-- Проверка существования аккаунта с таким же email и типом аккаунта --//
      const existsUser = await this.usersService.findByEmail(email);

      if (existsUser) {
        //-- Если аккаунт уже существует, выбрасываем исключение --//
        throw new ConflictException('Аккаунт уже существует');
      }

      const registeredUser = await this.usersService.create({
        email,
        password,
        role: Role.USER,
        username: email,
      });

      //-- Генерация токенов доступа для нового аккаунта --//
      const tokens = await this.getTokens(registeredUser._id);

      //-- Обновление данных аккаунта с новыми токенами доступа --//
      registeredUser.credentials.accessToken = tokens.accessToken;
      registeredUser.credentials.refreshToken = tokens.refreshToken;

      await this.usersService.update(
        registeredUser._id,
        registeredUser,
        session,
      );

      //-- Фиксация изменений в базе данных --//
      await session.commitTransaction();

      delete registeredUser.credentials.password;

      //-- Возвращение данных созданного аккаунта --//
      return registeredUser;
    } catch (error) {
      //-- В случае ошибки отменяем транзакцию и перебрасываем исключение --//
      await session.abortTransaction();
      throw error;
    } finally {
      //-- Завершаем сессию после выполнения всех операций --//
      session.endSession();
    }
  }

  async sendPasswordResetEmail(email) {
    const profile = await this.usersService.findByEmail(email);

    if (!profile) {
      throw new NotFoundException('Пользователь с указанным Email не найден');
    }

    return {
      message: `Ссылка на сброс пароля отправлена на ваш email: ${email}`,
    };
  }
}
