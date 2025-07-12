import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/guard/AdminGuard';
import { BenefitService } from './benefit.service';
import { BenefitCreateDto } from './dto/benefit-create.dto';
import { BenefitUpdateDto } from './dto/benefit-update.dto';

@Controller('benefits')
export class BenefitController {
  constructor(private benefit: BenefitService) {}

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('all')
  findAll() {
    return this.benefit.findAll();
  }
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('create')
  create(@Body() dto: BenefitCreateDto) {
    return this.benefit.create(dto);
  }
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch('update/:id')
  update(@Body() dto: BenefitUpdateDto, @Param('id') id: string) {
    return this.benefit.update(dto, id);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('delete/:id')
  delete(@Param('id') id: string) {
    return this.benefit.delete(id);
  }
}
