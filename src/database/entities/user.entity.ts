import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ example: 1, description: 'Unique user ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Aryan', description: 'Name of the user' })
  @Column()
  name: string;

  @ApiProperty({ example: 'aryan@example.com', description: 'Email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @Column()
  password: string;
}
