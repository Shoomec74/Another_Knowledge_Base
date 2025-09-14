import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './schemas/user.schema';
import { UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { HashService } from 'src/common/hashService/hash.service';
import { AbilityModule } from 'src/casl/ability.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AbilityModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, HashService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
