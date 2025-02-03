import {
  BadRequestException, ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { User } from '../model/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupRequest } from '../../auth/model/dto/request/signup-request.interface';
import { UserResponse } from '../model/dto/response/user-response.class';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { Page } from '../../../../../libs/commons-core-library/src/dto/response/page/page.interface';
import { PageOptions } from '../../../../../libs/commons-core-library/src/dto/response/page/page-options.interface';
import { PageMeta } from '../../../../../libs/commons-core-library/src/dto/response/page/page-meta.interface';
import { Principal } from '../model/dto/principal.interface';
import { SelfUserResponse } from '../model/dto/response/self-user-response.class';
import { UserRequest } from '../model/dto/request/update-user-request.class';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectMapper()
    private readonly mapper: Mapper,
  ) {}

  /**
   * Return special self profile
   * @param principal principal id to get
   */
  async findSelfProfile(principal: Principal): Promise<SelfUserResponse> {
    const user: User = await this.userRepository.findOne({
      where: { id: principal.userId },
      relations: ['receivedNotifications'], // load notifications array
    });

    return this.mapper.map(user, User, SelfUserResponse);
  }

  /**
   * Find user by id
   * @param id
   */
  async findOneById(id: string): Promise<UserResponse> {
    const user: User | undefined = await this.userRepository.findOneBy({
      id,
    });
    if (!user) {
      throw new NotFoundException(`User: ${id} not found !`);
    }
    return this.mapper.map(user, User, UserResponse);
  }

  /**
   * find one by email
   * @param email
   */
  async findOneByEmail(email: string): Promise<User> {
    return this.userRepository.findOneBy({ email });
  }

  /**
   * Check if a user exists with a given email
   * @param email email to check
   */
  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ email });
    return !!user;
  }

  /**
   * Check if user exists with username
   * @param username username to search
   */
  async existsByUsername(username: string): Promise<boolean> {
    if (!username) {
      throw new BadRequestException('username is null');
    }
    const user = await this.userRepository.findOneBy({ username });
    return !!user;
  }

  /**
   * Find users that contains given string
   * @param substring string to search
   * @param pageOptions search criteria
   */
  async findByUsernameContaining(
    substring: string,
    pageOptions: PageOptions,
  ): Promise<Page<UserResponse>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder
      .where({ username: Like(`%${substring}%`) })
      .skip(pageOptions.skip)
      .take(pageOptions.take)
      .orderBy('user.username', pageOptions.order);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();
    const mappedEntities: UserResponse[] = this.mapper.mapArray(
      entities,
      User,
      UserResponse,
    );
    const pageMeta = new PageMeta({ itemCount, pageOptions });
    return new Page(mappedEntities, pageMeta);
  }

  /**
   * Create a new user
   * @param signupRequestDto dto containing user fields
   */
  async create(signupRequestDto: SignupRequest): Promise<User> {
    if (await this.existsByEmail(signupRequestDto.email)) {
      throw new HttpException('Email already exists', 409);
    }
    if (await this.existsByUsername(signupRequestDto.username)) {
      throw new HttpException('Username already exists', 409);
    }
    const newUser = new User();
    newUser.username = signupRequestDto.username;
    newUser.email = signupRequestDto.email;
    newUser.password = signupRequestDto.password;
    return this.userRepository.save(newUser);
  }

  /**
   * Update user
   * @param userId id of user to update
   * @param userRequest dto of user to update
   */
  async updateUser(userId: string, userRequest: UserRequest): Promise<UserResponse> {

    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['receivedNotifications'], // load notifications array
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if(user.username !== userRequest.username) {
     if( await this.existsByUsername(userRequest.username)){
       throw new ConflictException(`Username ${userRequest.username} is already taken !`);
     }
    }
    user.username = userRequest.username;
    user.avatar = userRequest.avatar;

    const updatedUser = await this.userRepository.save(user);
    return this.mapper.map(updatedUser, User, SelfUserResponse);
  }

}