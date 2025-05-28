// game-event.interface.ts
import { UnoGatewayEventEmit } from './uno-gateway-event-emit.enum';

export interface GameEvent {
  type: UnoGatewayEventEmit;
  payload: any;
  target: UnoGameEventTarget;
  targetId: string;
}

export enum UnoGameEventTarget {
  ROOM = 'ROOM',
  PLAYER = 'PLAYER'
}
