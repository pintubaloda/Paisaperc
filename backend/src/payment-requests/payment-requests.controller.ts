import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PaymentRequestsService } from './payment-requests.service';
import { CreatePaymentRequestDto, UpdatePaymentRequestDto } from './payment-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(private readonly paymentRequestsService: PaymentRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: diskStorage({
        destination: './uploads/payment-proofs',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async create(
    @Request() req,
    @Body() createDto: CreatePaymentRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const proofUrl = file ? `/uploads/payment-proofs/${file.filename}` : undefined;
    return this.paymentRequestsService.create(req.user.id, createDto, proofUrl);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findMy(@Request() req) {
    return this.paymentRequestsService.findByUserId(req.user.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.paymentRequestsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdatePaymentRequestDto) {
    return this.paymentRequestsService.update(id, updateDto);
  }
}
