import { ApiProperty } from '@nestjs/swagger';

export class SigninResponseDto {
  @ApiProperty({ example: true })
  status: string;

  @ApiProperty({ example: 'Login Successful' })
  message: string;

  @ApiProperty({
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  data: {
    access_token: string;
    refresh_token: string;
  };

  @ApiProperty({
    example: {
      statusCode: 200,
      timestamp: '2025-07-08T10:25:00.000Z',
      path: '/auth/signin',
    },
  })
  meta: {
    statusCode: number;
    timestamp: string;
    path: string;
  };
}
