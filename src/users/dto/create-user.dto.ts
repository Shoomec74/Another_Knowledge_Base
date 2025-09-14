import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import Role from '../../common/sharedTypes/roleEnum';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  username?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.USER;
}
