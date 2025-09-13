import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import Role from './roleEnum';

export class Credentials {
  @IsEmail(
    {},
    { message: 'Email должен быть действительным адресом электронной почты' },
  )
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password не может быть пустым' })
  password: string;

  @IsString()
  @IsOptional()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken: string;
}

@Schema()
export class User extends Document {
  @Prop({ required: true, minlength: 2, maxlength: 30 })
  username: string;

  @ValidateNested()
  @Prop({ type: Credentials })
  credentials: Credentials;

  @IsNotEmpty()
  @Prop({ required: true, enum: Role, type: String })
  role: Role;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
