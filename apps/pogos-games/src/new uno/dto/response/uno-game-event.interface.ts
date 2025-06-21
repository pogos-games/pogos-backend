import { UnoGatewayEventEmit } from '../../enum/uno-gateway-event-emit.enum';
import { GatewayEventEmitter } from '../../../../../../libs/tools/src/game/enum/gateway/gateway-event-emitter.enum';
import { UnoResponse } from './uno-response.interface';

export interface GameEvent {
  type: UnoGatewayEventEmit;
  payload: UnoResponse;
  target: GatewayEventEmitter;
  targets: string[];
  action: UnoGatewayEventEmit
}