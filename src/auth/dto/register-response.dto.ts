import { ApiProperty } from '@nestjs/swagger';

export class SignupResponseDto {
  @ApiProperty({ example: true })
  status: string;

  @ApiProperty({ example: 'Register Successful' })
  message: string;

  @ApiProperty({
    example: {
      statusCode: 200,
      timestamp: '2025-07-08T10:25:00.000Z',
      path: '/auth/signup',
    },
  })
  meta: {
    statusCode: number;
    timestamp: string;
    path: string;
  };
}
