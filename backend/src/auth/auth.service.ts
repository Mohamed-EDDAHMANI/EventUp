import * as bcrypt from 'bcrypt';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateToken(user: any) {
    const payload = {
      sub: user._id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { password, __v, ...safeUser } = user.toObject();
    return safeUser;
  }

  async register(body: RegisterUserDto) {
    const userExists = await this.usersService.findByEmail(body.email);
    if (userExists) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await this.hashPassword(body.password);
    const newUser = await this.usersService.create({
      ...body,
      password: hashed,
    });

    const token = this.generateToken(newUser);

    return {
      user: this.sanitizeUser(newUser),
      access_token: token,
    };
  }

  async login(body: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.comparePassword(body.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
        sayhi: 'hello',
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }
}
