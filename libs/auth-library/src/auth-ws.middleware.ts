import { Injectable, NestMiddleware } from '@nestjs/common';
import { TokenService } from '@app/auth-library/service/token.service';
import { AuthenticatedSocket } from '../../../apps/pogos-core/src/notification/model/gateway/authenticated-socket.interface';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  async use(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void,
  ): Promise<void> {
    try {
      const authHeader = socket.handshake?.auth?.token;
      console.log(`Auth header: ${authHeader}`);
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(
          new Error(`Authorization token must be prefixed with 'Bearer '`),
        );
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return next(new Error(`Authorization token is missing`));
      }

      const user = await this.tokenService.verifyAccessToken(token);
      if (!user || !user.sub) {
        return next(new Error(`Invalid User`));
      }

      socket.user = {
        sub: user.sub,
        email: user.email,
        username: user.username,
      };

      next();
    } catch (error) {
      return next(new Error(`Invalid token: ${error.message}`));
    }
  }
}
