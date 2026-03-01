import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { RegisterDto, LoginDto } from '../users/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private walletService: WalletService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Block admin registration via API
    if (registerDto.role === 'admin') {
      throw new UnauthorizedException('Admin accounts cannot be created via registration');
    }

    const user = await this.usersService.create(registerDto);
    
    await this.walletService.createWallet(user.id);
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    
    return {
      access_token,
      token_type: 'bearer',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj._id;
    delete userObj.__v;
    
    return {
      access_token,
      token_type: 'bearer',
      user: userObj,
    };
  }

  async validateUser(payload: any) {
    return this.usersService.findById(payload.sub);
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
