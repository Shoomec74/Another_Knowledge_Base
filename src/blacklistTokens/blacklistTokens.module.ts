import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlacklistTokensService } from './blacklistTokens.service';
import {
  BlacklistTokens,
  BlacklistTokensSchema,
} from './schema/blacklistTokens.schema';
import { BlacklistTokensController } from './blacklistTokens.controller';
import { BlacklistTokensRepository } from './blacklistTokens.repository';
import { JwtService } from '@nestjs/jwt';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { AbilityModule } from 'src/casl/ability.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlacklistTokens.name, schema: BlacklistTokensSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AbilityModule,
  ],
  controllers: [BlacklistTokensController],
  providers: [BlacklistTokensService, BlacklistTokensRepository, JwtService],
  exports: [BlacklistTokensService],
})
export class BlacklistTokensModule {}
