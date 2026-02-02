import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(body): Promise<{ email: string }> {
    const userExists = await this.usersService.findByEmail(body.email);
    if (userExists) throw new ConflictException('Email already registered');
    const hashed = await this.hashPassword(body.password);
    await this.usersService.create({ ...body, password: hashed });
    return { email: body.email };
  }

  async login(email: string, password: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.comparePassword(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
