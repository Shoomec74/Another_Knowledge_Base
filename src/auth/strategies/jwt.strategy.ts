import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlacklistTokensService } from '../../blacklistTokens/blacklistTokens.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/schemas/user.schema';
import { Types } from 'mongoose';

//-- Сервис для аутентификации с использованием JWT --//
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly blacklistTokensService: BlacklistTokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //-- Функция для извлечения JWT из заголовка авторизации --//
      secretOrKey: configService.get('JWT_SECRET'), //-- Секретный ключ для верификации JWT --//
      passReqToCallback: true, //-- Передача объекта запроса в метод validate --//
    });
  }

  //-- Метод для валидации пользователя по токену JWT --//
  async validate(
    request: any,
    jwtPayload: { sub: Types.ObjectId },
  ): Promise<User> {
    //-- Извлечение токена из заголовка запроса --//
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    //-- Поиск пользователя по идентификатору из полезной нагрузки токена --//
    const user = await this.usersService.findOne(jwtPayload.sub);

    //-- Проверка, находится ли токен в черном списке или пользователь не найден --//
    if (
      (await this.blacklistTokensService.isTokenBlacklisted(token)) ||
      !user
    ) {
      //-- Если условие выполняется, генерируется исключение о неавторизации --//
      throw new UnauthorizedException('Пользователь не авторизован');
    } else {
      //-- Возвращение данных пользователя, если токен действителен и не в черном списке --//
      return user;
    }
  }
}
