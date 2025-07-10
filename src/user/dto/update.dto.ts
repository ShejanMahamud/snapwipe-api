import { PartialType } from '@nestjs/mapped-types';
import { registerDto } from 'src/auth/dto/register.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { Role } from 'generated/prisma';

export class UpdateUserDto extends PartialType(registerDto) {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;

  @ApiProperty({ enum: Role, example: Role.user })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
