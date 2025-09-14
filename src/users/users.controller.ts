import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';
import { AbilityGuard } from 'src/auth/guards/ability.guard';
import { CheckAbility } from 'src/casl/decorator/ability.decorator';
import { EAction } from 'src/casl/ability.factory';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guards';
import { TJwtRequest } from 'src/common/sharedTypes/jwtRequest';

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AbilityGuard)
  @CheckAbility({ action: EAction.Create, subject: 'users' })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AbilityGuard)
  @CheckAbility({ action: EAction.ReadAll, subject: 'users' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AbilityGuard)
  @CheckAbility({ action: EAction.Read, subject: 'users' })
  @Get('me')
  findOne(@Req() req: TJwtRequest) {
    return this.usersService.findOne(req.user._id);
  }

  @UseGuards(AbilityGuard)
  @CheckAbility({ action: EAction.Update, subject: 'users' })
  @Patch(':id')
  update(
    @Param('id') id: Types.ObjectId,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AbilityGuard)
  @CheckAbility({ action: EAction.Delete, subject: 'users' })
  @Delete(':id')
  remove(@Param('id') id: Types.ObjectId) {
    return this.usersService.remove(id);
  }
}
