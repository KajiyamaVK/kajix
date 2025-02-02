import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

interface UserFromJwt {
  id: string;
  email: string;
  username: string;
}

type JwtFromRequestFunction = () => string | null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const extractJwt: JwtFromRequestFunction = ExtractJwt.fromAuthHeaderAsBearerToken();
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-for-dev',
    });
  }

  async validate(payload: JwtPayload): Promise<UserFromJwt> {
    const user = await Promise.resolve({
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    });
    return user;
  }
}
