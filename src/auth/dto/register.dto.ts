import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class registerDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @ApiProperty({ example: 'SecurePassword123@' })
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({
    example:
      'https://ui-avatars.com/api/?name=John+Doe&background=random&color=fff',
  })
  @IsString()
  @IsNotEmpty()
  readonly profilePhoto: string;
}
