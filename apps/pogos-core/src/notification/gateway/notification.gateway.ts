import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TokenService } from '@app/auth-library/service/token.service';
import { AuthMiddleware } from '@app/auth-library/auth-ws.middleware';
import { AuthenticatedSocket } from '../model/gateway/authenticated-socket.interface';
import { NotificationEventEmitter } from '../model/gateway/notification-event-emitter.enum';
import { NotificationResponse } from '../model/dto/response/notification-response.interface';

@WebSocketGateway({ namespace: 'notifications' , cors: '*'})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() readonly server: Server;

  private readonly connectedClients = new Map<string, string>(); // Map userId -> socketId

  constructor(private readonly tokenService: TokenService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authMiddleware = new AuthMiddleware(this.tokenService);
      await authMiddleware.use(client, (err) => {
        if (err) {
          console.error("Échec d'authentification du client :", err.message);
          client.disconnect();
        }
        console.log('Client connected');
      });

      const userId = client?.user.sub;

      // Associate the user ID with the socket ID
      this.connectedClients.set(userId, client.id);
      console.log(`User connected : ${userId} (Socket ID: ${client.id})`);
    } catch (error) {
      console.error('Error while connecting client :', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client?.user.sub;

    if (userId) {
      this.connectedClients.delete(userId);
      console.log(`Utilisateur déconnecté : ${userId}`);
    }
  }

  /**
   * Envoie un message à un utilisateur spécifique.
   * @param userId ID de l'utilisateur (sub dans le JWT).
   * @param notification Message à envoyer.
   */
  async sendNotification(
    userId: string,
    notification: NotificationResponse,
  ): Promise<void> {
    const socketId = this.connectedClients.get(userId);

    if (socketId) {
      this.server
        .to(socketId)
        .emit(NotificationEventEmitter.NOTIFICATION, notification);
      console.log(`Message sent to: ${userId}: ${notification}`);
    } else {
      console.log(`User:  ${userId} not connected.`);
    }
  }
}
