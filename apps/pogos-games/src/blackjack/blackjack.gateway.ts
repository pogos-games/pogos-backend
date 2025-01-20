import { WebSocketGateway } from '@nestjs/websockets';
import { BlackjackService } from './blackjack.service';
import { GameGateway } from '../../../../libs/tools/src/game/game.gateway';
import { Blackjack, BlackJackPlayer } from './entities/blackjack.entity';
import { BlackjackResponse } from './dto/response/blackjack-response.interface';
import { BlackjackPlayerResponse } from './dto/response/blackjack-player-response.interface';

// process.env.FRONTEND_URL
@WebSocketGateway({ namespace: 'blackjack', cors: 'http://localhost:4200' })
export class BlackjackGateway extends GameGateway<BlackjackResponse, BlackjackPlayerResponse, BlackJackPlayer, Blackjack, BlackjackService> {
  constructor(private readonly blackjackService: BlackjackService) {
    super(blackjackService);
  }
}
