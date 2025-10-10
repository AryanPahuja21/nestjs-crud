import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { InvalidCredentialsException } from '../../common/exceptions/invalid-credentials.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcrypt';

interface LoginUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<LoginUser> {
    if (!email || !pass) {
      throw new ValidationException('Email and password are required');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as LoginUser;
  }

  login(user: LoginUser) {
    if (!user) {
      throw new ValidationException('User data is required for login');
    }

    const payload = {
      username: user.email,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
