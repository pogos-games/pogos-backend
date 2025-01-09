
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Principal } from '../user/model/dto/principal.interface';

export const GetPrincipal = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Principal => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Principal;
  },
);