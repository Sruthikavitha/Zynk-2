import jwt from 'jsonwebtoken';
import config from '../config';
import { Role } from '../types';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};
