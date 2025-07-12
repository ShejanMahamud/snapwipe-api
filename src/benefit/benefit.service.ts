import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BenefitCreateDto } from './dto/benefit-create.dto';
import { BenefitUpdateDto } from './dto/benefit-update.dto';

@Injectable()
export class BenefitService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.benefit.findMany({});
  }

  create(dto: BenefitCreateDto) {
    return this.prisma.benefit.create({
      data: {
        ...dto,
      },
    });
  }
  update(dto: BenefitUpdateDto, id: string) {
    return this.prisma.benefit.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
    });
  }
  delete(id: string) {
    return this.prisma.benefit.delete({
      where: {
        id,
      },
    });
  }
}
