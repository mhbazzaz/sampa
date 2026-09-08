import { MigrationInterface, QueryRunner } from 'typeorm';

export class IsEnabledUsers1761126094926 implements MigrationInterface {
  name = 'IsEnabledUsers1761126094926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "isEnable" boolean DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isEnable"`);
  }
}
