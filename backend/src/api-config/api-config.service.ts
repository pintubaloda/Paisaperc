import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAPIDto, UpdateAPIDto } from './api-config.dto';
import { ServiceType } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiConfigService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateAPIDto): Promise<any> {
    return this.prisma.apiMaster.create({
      data: {
        ...createDto,
        parameters: (createDto.parameters || []) as any,
        headers: (createDto.headers || []) as any,
        statusCheckParams: (createDto.statusCheckParams || []) as any,
        operatorCodes: (createDto.operatorCodes || []) as any,
        responseMappings: (createDto.responseMappings || []) as any,
      },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.apiMaster.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<any> {
    const api = await this.prisma.apiMaster.findUnique({ where: { id } });
    if (!api) {
      throw new NotFoundException('API not found');
    }
    return api;
  }

  async update(id: string, updateDto: UpdateAPIDto): Promise<any> {
    const result = await this.prisma.apiMaster.updateMany({
      where: { id },
      data: {
        ...updateDto,
        ...(updateDto.parameters !== undefined ? { parameters: updateDto.parameters as any } : {}),
        ...(updateDto.headers !== undefined ? { headers: updateDto.headers as any } : {}),
        ...(updateDto.statusCheckParams !== undefined ? { statusCheckParams: updateDto.statusCheckParams as any } : {}),
        ...(updateDto.operatorCodes !== undefined ? { operatorCodes: updateDto.operatorCodes as any } : {}),
        ...(updateDto.responseMappings !== undefined ? { responseMappings: updateDto.responseMappings as any } : {}),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('API not found');
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.prisma.apiMaster.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundException('API not found');
    }
  }

  async getActiveAPIs(apiType: ServiceType): Promise<any[]> {
    return this.prisma.apiMaster.findMany({ where: { apiType, isActive: true } });
  }

  async updateOperatorCodes(id: string, operatorCodes: any[]): Promise<any> {
    const result = await this.prisma.apiMaster.updateMany({
      where: { id },
      data: { operatorCodes: operatorCodes as any },
    });

    if (result.count === 0) {
      throw new NotFoundException('API not found');
    }

    return this.findById(id);
  }

  async updateResponseMappings(id: string, data: any): Promise<any> {
    const result = await this.prisma.apiMaster.updateMany({
      where: { id },
      data: {
        responseMappings: (data.responseMappings || []) as any,
        sampleRequest: data.sampleRequest,
        sampleResponse: data.sampleResponse,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('API not found');
    }

    return this.findById(id);
  }
}
