import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { PlanPeriod, PlanType } from 'generated/prisma';

export class PlanCreateDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;
  @IsNumber()
  @IsNotEmpty()
  readonly price: number;
  @IsString()
  @IsNotEmpty()
  readonly stripePriceId: string;
  @IsEnum(PlanType)
  @IsNotEmpty()
  readonly planType: PlanType;
  @IsEnum(PlanPeriod)
  @IsNotEmpty()
  readonly planPeriod: PlanPeriod;
  @IsNumber()
  @IsNotEmpty()
  readonly credits: number;
  @IsBoolean()
  @IsNotEmpty()
  readonly status: boolean;
  @IsArray()
  @IsNotEmpty()
  readonly benefits: { benefitId: string; value: string }[];
}
