import { ConflictException, Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, comparePassword } from '@/common/utils/hash.util';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    const passwordHash = hashPassword(dto.password);

    if (dto.organizationId) {
      // Registering as Manager/Tenant to an existing organization
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });

      if (!org) {
        throw new NotFoundException('Selected organization does not exist');
      }

      // Resolve user role
      let finalRole: UserRole = UserRole.TENANT;
      if (dto.role === 'MANAGER') finalRole = UserRole.MANAGER;
      if (dto.role === 'OWNER') {
        throw new BadRequestException('Owner accounts can only be created when registering a new organization');
      }

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: finalRole,
          organizationId: org.id,
        },
      });

      return {
        message: `${finalRole.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} account successfully registered under organization: ${org.name}`,
        organizationId: org.id,
        userId: user.id,
      };
    }

    // Traditional flow: Register new organization and create Owner
    if (!dto.organizationName) {
      throw new BadRequestException('Organization Name is required to register a new organization context');
    }

    const slug = dto.organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug collision
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    const finalSlug = existingOrg ? `${slug}-${randomBytes(3).toString('hex')}` : slug;

    // Run transaction
    const transaction = await this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: finalSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.OWNER, // First registration creates OWNER account
          organizationId: org.id,
        },
      });

      return { org, user };
    });

    return {
      message: 'Organization and Owner account successfully registered',
      organizationId: transaction.org.id,
      userId: transaction.user.id,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const isPasswordValid = comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    return this.generateTokens(user.id, user.email, user.role, user.organizationId);
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord?.isRevoked) {
        // Reuse Detected! Invalidate all tokens for this user for security
        await this.prisma.refreshToken.updateMany({
          where: { userId: tokenRecord.userId },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old refresh token (Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.email,
      tokenRecord.user.role,
      tokenRecord.user.organizationId,
    );
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { success: true };
  }

  async getOrganizations() {
    return this.prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
  }

  async validateUserSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Invalid active user session');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: string, organizationId: string) {
    const payload = { sub: userId, email, role, organizationId };
    
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
    });

    const rawRefreshToken = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days expiry

    await this.prisma.refreshToken.create({
      data: {
        token: rawRefreshToken,
        expiresAt,
        userId,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user,
    };
  }
}
