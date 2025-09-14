import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import Role from '../../common/sharedTypes/roleEnum';

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

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
