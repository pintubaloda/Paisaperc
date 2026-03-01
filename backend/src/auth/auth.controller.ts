import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '../users/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { mobile: string }) {
    const otp = this.authService.generateOtp();
    console.log(`Mock OTP for ${body.mobile}: ${otp}`);
    return { message: 'OTP sent successfully', otp, mobile: body.mobile };
  }
}
