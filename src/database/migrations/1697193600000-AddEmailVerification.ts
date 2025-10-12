import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerification1697193600000 implements MigrationInterface {
  name = 'AddEmailVerification1697193600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'isEmailVerified',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'emailVerificationToken',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'emailVerificationTokenExpires',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'isEmailVerified',
      'emailVerificationToken',
      'emailVerificationTokenExpires',
    ]);
  }
}
