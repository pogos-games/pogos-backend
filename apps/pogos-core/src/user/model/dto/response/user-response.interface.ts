import { AutoMap } from '@automapper/classes';

export class UserResponse {
  @AutoMap()
  id: number;
  @AutoMap()
  username: string;
  @AutoMap()
  friends:[];
}