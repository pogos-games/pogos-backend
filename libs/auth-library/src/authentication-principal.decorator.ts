import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Principal } from '../../../apps/pogos-core/src/user/model/dto/principal.interface';

export const AuthenticationPrincipal = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Principal => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Principal;
  },
);