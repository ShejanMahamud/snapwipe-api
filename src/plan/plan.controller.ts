import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/guard/AdminGuard';
import { PlanCreateDto } from './dto/plan-create.dto';
import { PlanUpdateDto } from './dto/plan-update.dto';
import { PlanService } from './plan.service';

@Controller('plans')
export class PlanController {
  constructor(private plan: PlanService) {}
  @Get('all')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  findAll() {
    return this.plan.findAll();
  }

  @Post('create')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  create(@Body() dto: PlanCreateDto) {
    return this.plan.create(dto);
  }

  @Patch('update/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  update(@Body() dto: PlanUpdateDto, @Param('id') id: string) {
    return this.plan.update(dto, id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  delete(@Param('id') id: string) {
    return this.plan.delete(id);
  }
}
