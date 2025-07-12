import { PartialType } from '@nestjs/mapped-types';
import { PlanCreateDto } from './plan-create.dto';

export class PlanUpdateDto extends PartialType(PlanCreateDto) {}
