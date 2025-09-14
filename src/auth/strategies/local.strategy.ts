import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

//-- Сервис для реализации локальной стратегии аутентификации --//
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    //-- Инициализация базовой стратегии с указанием поля для имени пользователя --//
    super({
      usernameField: 'email', //-- Указываем, что в качестве "имени пользователя" используется поле 'email' --//
    });
  }

  //-- Функция валидации пользователя --//
  async validate(email: string, password: string) {
    try {
      //-- Вызов сервиса authService для проверки соответствия пароля и электронной почты --//
      const user = await this.authService.validatePassword(email, password);

      //-- Если проверка прошла успешно, возвращаем профиль пользователя --//
      return user;
    } catch (err) {
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }
  }
}
