import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user?: {
    sub: string;
    email: string;
    username: string;
  };
}
