import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

@Module({
  imports: [],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
