import { JwtGuard } from './jwtAuth.guards';
import { LocalGuard } from './localAuth.guard';
import { OptionalJwtGuard } from './optionalJwt.guard';

export const GUARDS = [LocalGuard, JwtGuard, OptionalJwtGuard];
