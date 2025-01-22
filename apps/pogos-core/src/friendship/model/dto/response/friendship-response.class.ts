import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../../../../user/model/dto/response/user-response.class';

export class FriendResponse {
    @ApiProperty()
    @AutoMap()
    friendshipId: string;

    @ApiProperty({ type: () => UserResponse })
    @AutoMap(() => UserResponse)
    user: UserResponse;
}