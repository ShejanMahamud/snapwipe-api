import { PartialType } from '@nestjs/mapped-types';
import { BenefitCreateDto } from './benefit-create.dto';

export class BenefitUpdateDto extends PartialType(BenefitCreateDto) {}
