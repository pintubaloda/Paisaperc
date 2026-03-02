import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submitDocument(userId: string, data: { docType: string; docNumber: string; docUrl?: string }): Promise<any> {
    return this.prisma.kycDocument.upsert({
      where: { userId_docType: { userId, docType: data.docType } },
      update: {
        docNumber: data.docNumber,
        docUrl: data.docUrl,
        status: 'pending',
        rejectionReason: null,
      },
      create: {
        userId,
        docType: data.docType,
        docNumber: data.docNumber,
        docUrl: data.docUrl,
      },
    });
  }

  async getUserDocuments(userId: string): Promise<any[]> {
    return this.prisma.kycDocument.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getAllPending(): Promise<any[]> {
    return this.prisma.kycDocument.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });
  }

  async getAll(): Promise<any[]> {
    return this.prisma.kycDocument.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async verify(id: string, status: string, verifiedBy: string, rejectionReason?: string): Promise<any> {
    const result = await this.prisma.kycDocument.updateMany({
      where: { id },
      data: {
        status,
        verifiedBy,
        verifiedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
    });

    if (result.count === 0) throw new NotFoundException('KYC document not found');

    return this.prisma.kycDocument.findUnique({ where: { id } });
  }
}
