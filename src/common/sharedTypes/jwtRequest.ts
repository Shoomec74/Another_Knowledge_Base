import { PureAbility } from '@casl/ability';
import { User } from 'src/users/schemas/user.schema';

export type TJwtRequest = { user: User; ability?: PureAbility };
