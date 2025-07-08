import { ApiProperty } from '@nestjs/swagger';

class ErrorDetailDto {
  @ApiProperty({ example: 'email' })
  field: string | null;

  @ApiProperty({ example: 'Email must be a valid email address' })
  message: string;
}

export class SignupErrorResponseDto {
  @ApiProperty({ example: 'error' })
  status: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({
    type: [ErrorDetailDto],
    required: false,
  })
  errors?: ErrorDetailDto[];

  @ApiProperty({
    example: {
      statusCode: 400,
      timestamp: '2025-07-08T12:00:00.000Z',
      path: '/auth/signup',
    },
  })
  meta: {
    statusCode: number;
    timestamp: string;
    path: string;
  };
}
