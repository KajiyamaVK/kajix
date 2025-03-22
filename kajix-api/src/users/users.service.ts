import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt'; // Use bcrypt
import { Prisma } from '@prisma/client';
import { PrismaErrorCode } from '../prisma/prisma.constants';
import { MailService } from '../mail/mail.service';
import { TokenType, Locale } from '@kajix/types';
import { VerificationResponseDto } from './dto/verification-response.dto';
import { UserDto } from './dto/user.dto'; // Import UserDto
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // Use bcrypt.genSalt and bcrypt.hashSync
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hashSync(password, salt);
  }

  generateRandomToken(length: number = 16): string {
    return crypto
      .randomBytes(Math.ceil(length * 0.75))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .slice(0, length);
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const { password, ...userData } = createUserDto;
    const hashedPassword = await this.hashPassword(password); // Await hashPassword

    try {
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          salt: await bcrypt.genSalt(), // Generate and store salt
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user as UserDto;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users as UserDto[];
  }

  async findOne(id: number): Promise<UserDto | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user as UserDto | null;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return updatedUser as UserDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaErrorCode.RECORD_NOT_FOUND) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaErrorCode.RECORD_NOT_FOUND) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user as UserDto | null;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Invalid email format');
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async findByUsername(username: string): Promise<UserDto | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user as UserDto | null; // Cast
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch user by username',
      );
    }
  }

  private getEmailTemplate(
    locale: Locale,
    verificationLink: string,
  ): { subject: string; body: string } {
    // No changes needed here
    switch (locale) {
      case Locale.PTBR:
        return {
          subject: 'Confirme seu email',
          body: `
            <p class="welcome-text">Obrigado por se juntar ao KAJIX!</p>
            <p>Para completar seu cadastro e acessar todos os nossos recursos com IA, por favor verifique seu endereço de email clicando no botão abaixo:</p>
            <div class="button-container">
              <button class="button" onclick="window.location.href='${verificationLink}'">Confirmar Email</button>
            </div>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #777777; font-style: italic; margin-bottom: 0;">Se você não criou uma conta conosco, por favor ignore este email.</p>
          `,
        };
      case Locale.EN:
        return {
          subject: 'Confirm your email',
          body: `
            <p class="welcome-text">Thank you for joining KAJIX!</p>
            <p>To complete your registration and access all our AI-powered features, please verify your email address by clicking the button below:</p>
            <div class="button-container">
              <button class="button" onclick="window.location.href='${verificationLink}'">Confirm Email</button>
            </div>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #777777; font-style: italic; margin-bottom: 0;">If you did not create an account with us, please disregard this email.</p>
          `,
        };
      default:
        throw new BadRequestException(`Unsupported locale: ${locale}`);
    }
  }

  private getVerificationResponse(): VerificationResponseDto {
    // No changes needed here
    return {
      message: 'Verification email sent successfully',
    };
  }

  async sendVerificationEmail(
    email: string,
    locale: Locale,
  ): Promise<VerificationResponseDto> {
    // No changes needed here
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const verificationToken = this.generateRandomToken(64);
    const verificationLink = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

    const mailFrom = process.env.MAIL_FROM;
    if (!mailFrom) {
      throw new InternalServerErrorException(
        'Mail sender configuration is missing',
      );
    }

    await this.prisma.tmpToken.create({
      data: {
        type: TokenType.EMAIL_CONFIRMATION,
        emailFrom: mailFrom,
        token: verificationToken,
        emailTo: email,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        locale,
      },
    });

    const { subject, body } = this.getEmailTemplate(locale, verificationLink);
    await this.mailService.sendEmail(email, subject, body);

    return this.getVerificationResponse();
  }
}
