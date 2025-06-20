import { Avatar } from '../../enum/avatar.enum';

export interface GamePlayerResponse {
  playerId:string,
  avatar: Avatar,
  hand: any[]
}