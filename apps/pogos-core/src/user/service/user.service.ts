import {
  BadRequestException,
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
import { Page } from '../../../../../libs/commons-core-library/src/dto/page/page.interface';
import { PageOptions } from '../../../../../libs/commons-core-library/src/dto/page/page-options.interface';
import { PageMeta } from '../../../../../libs/commons-core-library/src/dto/page/page-meta.interface';
import { Principal } from '../model/dto/principal.interface';
import { SelfUserResponse } from '../model/dto/response/self-user-response.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectMapper()
    private readonly mapper: Mapper,
  ) {}

  async findSelfProfile(principal: Principal): Promise<SelfUserResponse> {
    const user: User = await this.userRepository.findOne({
      where: { id: principal.userId },
      relations: ['notifications'], // load notifications array
    });

    return this.mapper.map(user, User, SelfUserResponse);
  }

  async findOne(id: string): Promise<UserResponse> {
    const user: User | undefined = await this.userRepository.findOneBy({
      id,
    });
    if (!user) {
      throw new NotFoundException(`User: ${id} not found !`);
    }
    return this.mapper.map(user, User, UserResponse);
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.userRepository.findOneBy({ email });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ email });
    return !!user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    if (!username) {
      throw new BadRequestException('username is null');
    }
    const user = await this.userRepository.findOneBy({ username });
    return !!user;
  }

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
}