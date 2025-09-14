import { SetMetadata } from '@nestjs/common';
import { EAction, Subjects } from '../ability.factory';

export interface RequiredRules {
  action: EAction;
  subject: Subjects;
}

export const CHECK_ABILITY = 'check_ability';

export const CheckAbility = (...requirements: RequiredRules[]) =>
  SetMetadata(CHECK_ABILITY, requirements);
