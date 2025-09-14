import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '@casl/ability';
import { AbilityFactory, CHECK_ABILITY, RequiredRules } from '../../casl';

@Injectable()
export class AbilityGuard implements CanActivate {
  private readonly logger = new Logger('AbilityGuard');

  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: AbilityFactory,
  ) {}

  //-- Метод canActivate определяет, может ли пользователь выполнить действие, основываясь на его правах --//
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //-- Получаем правила доступа, связанные с текущим действием --//
    const rules =
      this.reflector.get<RequiredRules[]>(
        CHECK_ABILITY,
        context.getHandler(),
      ) || [];

    //-- Определяем, какой тип контекста доступен --//
    const contextRequest = context.switchToHttp().getRequest();

    if (!contextRequest.user) {
      throw new ForbiddenException('Unauthorized access');
    }

    //-- Получаем пользователя и его права доступа --//
    const ability = await this.caslAbilityFactory.defineAbility(
      contextRequest.user,
    );

    contextRequest.ability = ability;

    try {
      //-- Для каждого правила проверяем, разрешено ли действие --//
      rules.forEach((rule) => {
        ForbiddenError.from(ability as any).throwUnlessCan(
          rule.action,
          rule.subject,
        );
      });

      return true;
    } catch (e) {
      if (e instanceof ForbiddenError) {
        this.logger.error(
          `Пользователь ${contextRequest.user._id} трогает недоступный ему функционал: ${e.message}`,
        );
        throw new ForbiddenException(e.message);
      }

      //-- В случае исключения (например, пользователь не имеет права на действие), возвращаем false --//
      return false;
    }
  }
}
