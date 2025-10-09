import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Aryan', description: 'Name of the user' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'aryan@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @MinLength(6)
  password: string;
}
