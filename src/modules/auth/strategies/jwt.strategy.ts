import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../../common/enums/role.enum';

interface JwtPayload {
  sub: number;
  username: string;
  role: Role;
}

interface UserFromJwt {
  userId: number;
  username: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  validate(payload: JwtPayload): UserFromJwt {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
