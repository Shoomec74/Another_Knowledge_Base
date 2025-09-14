import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { STRTAGIES } from './strategies';
import { GUARDS } from './guards';
import { BlacklistTokensModule } from '../blacklistTokens/blacklistTokens.module';
import { jwtOptions } from '../configs/jwt.config';
import { AbilityModule } from 'src/casl/ability.module';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { HashService } from 'src/common/hashService/hash.service';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync(jwtOptions()),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    BlacklistTokensModule,
    AbilityModule,
  ],
  providers: [AuthService, ...STRTAGIES, ...GUARDS, HashService, UsersService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
