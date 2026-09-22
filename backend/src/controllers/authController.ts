import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';
import { Role } from '../types';

export class AuthController {
  public static async register(req: Request, res: Response) {
    try {
      const { name, email, phone, password, role = 'CUSTOMER', defaultAddress } = req.body;

      if (!name || !email || !phone || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'User with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          phone,
          passwordHash,
          role: role as Role,
        },
      });

      if (defaultAddress && role === 'CUSTOMER') {
        await prisma.address.create({
          data: {
            userId: user.id,
            label: defaultAddress.label || 'Home',
            street: defaultAddress.street || defaultAddress,
            city: defaultAddress.city || 'Coimbatore',
            state: defaultAddress.state || 'Tamil Nadu',
            postalCode: defaultAddress.postalCode || '641035',
            isDefault: true,
          },
        });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as Role,
        name: user.name,
      });

      return res.status(201).json({
        success: true,
        message: 'Registration successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error in auth register:', error);
      return res.status(500).json({ success: false, error: 'Failed to register user.' });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        include: {
          chefProfile: true,
        },
      });

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      if (user.status === 'INACTIVE') {
        return res.status(403).json({ success: false, error: 'Account is deactivated. Contact admin.' });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as Role,
        name: user.name,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          chefProfile: user.chefProfile,
        },
      });
    } catch (error) {
      console.error('Error in auth login:', error);
      return res.status(500).json({ success: false, error: 'Failed to log in.' });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          chefProfile: true,
          addresses: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error('Error fetching me profile:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
    }
  }
}

export default AuthController;
