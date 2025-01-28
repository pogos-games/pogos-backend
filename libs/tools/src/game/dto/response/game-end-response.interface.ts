export interface GameEndResponse {
  end:boolean,
  points:{playerId: string, points: number}[];
}