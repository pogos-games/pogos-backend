import { Avatar } from '../../enum/avatar.enum';

export interface GamePlayerResponse {
  playerId:string,
  username:string,
  avatar: Avatar,
  hand: any[]
}