import { Controller, Post, UseGuards, Req, Body } from '@nestjs/common';
import { LocalGuard } from './guards/localAuth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ResetPasswordResponseBodyNotFound,
  ResetPasswordResponseBodyOK,
  SigninResponseBodyNotOK,
  SigninResponseBodyOK,
  SignupResponseBodyOK,
  SignupResponseBodyNotOK,
  refreshTokenResponseBodyNotOK,
  refreshTokenResponseBodyOK,
  SingUpBadRequest,
} from './sdo/response-body.sdo';
import {
  SigninRequestBody,
  SignupRequestBody,
  RefreshTokenRequestBody,
  ResetPasswordRequestBody,
} from './sdo/request-body.sdo';
import { TJwtRequest } from 'src/common/sharedTypes/jwtRequest';
import { User } from 'src/users/schemas/user.schema';
import { AbilityGuard } from './guards/ability.guard';
import { CheckAbility } from 'src/casl/decorator/ability.decorator';
import { EAction } from 'src/casl/ability.factory';
import { JwtGuard } from './guards/jwtAuth.guards';
import { ITokens } from 'src/common/sharedTypes/tokens';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalGuard)
  @Post('signin')
  @ApiOperation({
    summary: 'Войти в систему',
  })
  @ApiBody({ type: SigninRequestBody })
  @ApiCreatedResponse({
    description: 'Успешный вход в систему',
    type: SigninResponseBodyOK,
  })
  @ApiUnauthorizedResponse({
    description: 'Неверное имя пользователя или пароль',
    type: SigninResponseBodyNotOK,
  })
  async signin(@Req() req: TJwtRequest): Promise<ITokens> {
    return this.authService.auth(req.user._id);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Регистрация' })
  @ApiBody({ type: SignupRequestBody })
  @ApiCreatedResponse({
    description: 'Успешная регистрация',
    type: SignupResponseBodyOK,
  })
  @ApiBadRequestResponse({
    description: 'Некорректные данные',
    type: SingUpBadRequest,
  })
  @ApiConflictResponse({
    description: 'Аккаунт уже существует',
    type: SignupResponseBodyNotOK,
  })
  async signup(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.authService.registration(createUserDto);
  }

  @UseGuards(AbilityGuard)
  @CheckAbility({ action: EAction.Update, subject: 'users' })
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Обновить токен',
  })
  @ApiBody({ type: RefreshTokenRequestBody })
  @ApiCreatedResponse({
    description: 'accessToken успешно обновлен',
    type: refreshTokenResponseBodyOK,
  })
  @ApiUnauthorizedResponse({
    description: 'Невалидный refreshToken',
    type: refreshTokenResponseBodyNotOK,
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<ITokens> {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Сброс пароля',
  })
  @ApiBody({
    type: ResetPasswordRequestBody,
  })
  @ApiCreatedResponse({
    type: ResetPasswordResponseBodyOK,
    description: 'Ссылка для сброса пароля отправлена на указанный Email',
  })
  @ApiNotFoundResponse({
    type: ResetPasswordResponseBodyNotFound,
    description: 'Пользователь с указанным Email не найден',
  })
  async resetPassword(@Body('email') email: string) {
    return await this.authService.sendPasswordResetEmail(email);
  }
}
