import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../database/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  email: string;
}

export class UserWithTokenResponseDto {
  @ApiProperty({ type: UserResponseDto, description: 'User data without password' })
  user: Omit<User, 'password'>;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;
}
