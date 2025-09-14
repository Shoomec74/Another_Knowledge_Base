import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
