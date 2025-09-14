import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { BlacklistTokensService } from './blacklistTokens.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwtAuth.guards';
import { AbilityGuard } from 'src/auth/guards/ability.guard';
import { CheckAbility } from 'src/casl/decorator/ability.decorator';
import { EAction } from 'src/casl/ability.factory';
import { User } from 'src/users/schemas/user.schema';

@UseGuards(JwtGuard)
@ApiTags('logout')
@Controller('logout')
export class BlacklistTokensController {
  constructor(
    private readonly blacklistTokensService: BlacklistTokensService,
  ) {}

  @UseGuards(AbilityGuard)
  @CheckAbility({ action: EAction.Read, subject: User })
  @Get()
  @ApiOperation({
    summary: 'Разлогинить пользователя',
  })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'authorization',
    description: 'Access токен',
    required: true,
  })
  @ApiOkResponse({
    description: 'Пользователь успешно разлогинен',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Сообщение об успешном разлогине',
        },
      },
    },
  })
  async addToken(@Headers('authorization') authHeader: string) {
    const token = authHeader.split(' ')[1];
    await this.blacklistTokensService.addToken(token);

    return { message: 'User logged out' };
  }
}
