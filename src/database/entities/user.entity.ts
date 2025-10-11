import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

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

  @ApiProperty({
    example: Role.USER,
    description: 'User role',
    enum: Role,
    default: Role.USER,
  })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @ApiProperty({ example: 'cus_1234567890', description: 'Stripe Customer ID' })
  @Column({ nullable: true })
  stripeCustomerId?: string;
}
