import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './model/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupRequest } from '../auth/model/dto/request/signup-request.interface';
import { UserResponse } from './model/dto/response/user-response.interface';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectMapper()
    private readonly mapper: Mapper,
  ) {}

  async findOne(username: string): Promise<UserResponse> {
    const user: User | undefined = await this.userRepository.findOneBy({
      username,
    });
    if (!user) {
      throw new NotFoundException(`User: ${username} not found !`);
    }
    return this.mapper.map(user, User,UserResponse);
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
      throw new BadRequestException("username is null");
    }
    const user = await this.userRepository.findOneBy({ username });
    return !!user;
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