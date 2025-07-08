import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class signinDto {
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
