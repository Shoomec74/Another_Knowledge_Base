import {
  ApiPropertyFactory,
  createField,
  IFieldDescription,
} from '../../common/apiPropertyFactory/apiPropertyFactory';

const signInFields: IFieldDescription[] = [
  createField('email', 'test@mail.ru', 'string', 'Почта пользователя', true),
  createField('password', 'secret12', 'string', 'Пароль пользователя', true),
];

const signUpFields: IFieldDescription[] = [
  createField('email', 'test@mail.ru', 'string', 'Email пользователя', true),
  createField('password', 'secret12', 'string', 'Пароль пользователя', true),
  createField('username', 'test', 'string', 'Имя пользователя', false),
];

const refreshTokenfield: IFieldDescription[] = [
  createField(
    'refreshToken',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'string',
    'Выданный рефреш токен',
    true,
  ),
];

const resetPasswordFields: IFieldDescription[] = [
  createField('email', 'test@mail.ru', 'string', 'Почта пользователя', true),
];

// Дополнительные SDO для OAuth-потоков можно добавить при необходимости

export const SigninRequestBody = new ApiPropertyFactory(signInFields).generate(
  'SignInRequestBody',
);

export const SignupRequestBody = new ApiPropertyFactory(signUpFields).generate(
  'SignUpRequestBody',
);

export const RefreshTokenRequestBody = new ApiPropertyFactory(
  refreshTokenfield,
).generate('RefreshRequestBody');

export const ResetPasswordRequestBody = new ApiPropertyFactory(
  resetPasswordFields,
).generate('ResetPasswordRequestBody');
