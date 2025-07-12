import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Util } from 'src/utils/utils';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignupResponseDto } from './dto/register-response.dto';
import { registerDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInErrorResponseDto } from './dto/signin-error-response.dto';
import { SigninResponseDto } from './dto/signin-response.dto';
import { signinDto } from './dto/signin.dto';
import { SignupErrorResponseDto } from './dto/signup-error-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('signup')
  @ApiOperation({
    summary: 'Register user',
    description: 'Register a user',
  })
  @ApiBody({ type: registerDto })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    type: SignupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (Validation Error)',
    type: SignupErrorResponseDto,
  })
  async register(@Body() dto: registerDto, @Req() req: Request) {
    await this.auth.signUp(dto, req);
    return Util.success('Register Successful');
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('signin')
  @ApiOperation({
    summary: 'Login user',
    description: 'Logs in a user and returns a JWT token',
  })
  @ApiBody({ type: signinDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: SigninResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (Validation Error)',
    type: SignInErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: SignInErrorResponseDto,
  })
  async signin(@Body() dto: signinDto) {
    const result = await this.auth.signIn(dto);
    return Util.success('Login Successful', result);
  }
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refreshToken(@Req() req: Request) {
    const user = req.user as { sub: string; email: string };
    const refreshToken =
      (req.cookies?.refresh_token as string) ||
      (req?.body?.refresh_token as string);
    const newAccessToken = await this.auth.refreshTokens(
      user.sub,
      refreshToken,
    );

    return newAccessToken.access_token;
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request) {
    const result = await this.auth.me(req);
    return Util.success('User logged in!', result);
  }

  @Throttle({ default: { limit: 2, ttl: 60 } })
  @Post('password-reset-email')
  async sendPasswordResetEmail(@Body() email: string, @Req() req: Request) {
    await this.auth.sendResetPasswordEmail(email, req);
    return Util.success('Password Reset Email Sent Successfully!');
  }

  @Throttle({ default: { limit: 2, ttl: 60 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
    return Util.success('Password Reset Successfully!');
  }
  @Throttle({ default: { limit: 2, ttl: 60 } })
  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(dto);
    return Util.success('Password Change Successfully!');
  }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logOut(@Req() req: Request) {
    await this.auth.logOut(req);
    return Util.success('Logout successfully!');
  }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('resend-email-verify')
  async resendVerify(@Body() email: string, @Req() req: Request) {
    await this.auth.resendVerifyEmail(email, req);
    return Util.success('Email verify send successfully!');
  }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('verify')
  async verify(@Body() body: { userId: string; verifyToken: string }) {
    await this.auth.verifyEmail(body.verifyToken, body.userId);
    return Util.success('Email address verified!');
  }
}
