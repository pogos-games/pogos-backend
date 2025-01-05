import { HttpException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './model/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupRequest } from '../auth/model/dto/request/signup-request.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User> {
    return this.userRepository.findOneBy({ username });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.userRepository.findOneBy({ email });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ email });
    return !!user;
  }

  async create(signupRequestDto: SignupRequest): Promise<User> {
    if (await this.existsByEmail(signupRequestDto.email)) {
      throw new HttpException('Email already exists', 409);
    }
    const newUser = new User();
    newUser.username = signupRequestDto.username;
    newUser.email = signupRequestDto.email;
    newUser.password = signupRequestDto.password;
    return this.userRepository.save(newUser);
  }

  async update(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}