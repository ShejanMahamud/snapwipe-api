import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlanCreateDto } from './dto/plan-create.dto';
import { PlanUpdateDto } from './dto/plan-update.dto';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.plan.findMany({
      where: {
        status: true,
      },
    });
  }

  create(dto: PlanCreateDto) {
    const { benefits, ...planData } = dto;
    const result = this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          ...planData,
          price: new Prisma.Decimal(dto.price),
        },
      });
      await Promise.all(
        benefits.map((benefit) => {
          return tx.planBenefit.create({
            data: {
              benefitId: benefit.benefitId,
              planId: plan.id,
              value: benefit.value,
            },
          });
        }),
      );
    });
    return result;
  }
  update(dto: PlanUpdateDto, id: string) {
    console.log(dto, id);
    const { benefits, ...planData } = dto;
    const result = this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.update({
        where: {
          id,
        },
        data: {
          ...planData,
        },
      });
      if (benefits) {
        await tx.planBenefit.deleteMany({
          where: {
            planId: id,
          },
        });
        await Promise.all(
          benefits.map((benefit) => {
            return tx.planBenefit.create({
              data: {
                benefitId: benefit.benefitId,
                planId: plan.id,
                value: benefit.value,
              },
            });
          }),
        );
      }
    });
    return result;
  }
  delete(id: string) {
    return this.prisma.plan.delete({
      where: {
        id,
      },
    });
  }
}
