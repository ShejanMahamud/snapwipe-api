import { IsNotEmpty, IsString } from 'class-validator';

export class BenefitCreateDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;
  @IsString()
  @IsNotEmpty()
  readonly slug: string;
}
