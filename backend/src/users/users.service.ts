import { Injectable, ConflictException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { RegisterDto, UpdateKycDto } from './user.dto';
import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(forwardRef(() => WalletService)) private walletService: WalletService,
  ) {}

  async create(registerDto: RegisterDto): Promise<any> {
    const existing = await this.userModel.findOne({ email: registerDto.email });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = new this.userModel({
      ...registerDto,
      password: hashedPassword,
      id: uuidv4(),
      apiKey: registerDto.role === 'api_user' ? uuidv4() : undefined,
      apiSecret: registerDto.role === 'api_user' ? uuidv4() : undefined,
    });

    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj._id;
    delete userObj.__v;
    
    return userObj;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findOne({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<any[]> {
    const users = await this.userModel.find().select('-password -_id -__v');
    return users;
  }

  async updateKyc(userId: string, kycDto: UpdateKycDto): Promise<any> {
    const user = await this.userModel.findOneAndUpdate(
      { id: userId },
      { ...kycDto, kycStatus: true },
      { new: true }
    ).select('-password -_id -__v');
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async toggleUserStatus(userId: string): Promise<any> {
    const user = await this.findById(userId);
    user.isActive = !user.isActive;
    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj._id;
    delete userObj.__v;
    
    return userObj;
  }
}
