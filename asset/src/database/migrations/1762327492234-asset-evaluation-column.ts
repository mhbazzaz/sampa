import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssetEvaluationColumn1762327492234 implements MigrationInterface {
  name = 'AssetEvaluationColumn1762327492234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD "evaluationScore" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP COLUMN "evaluationScore"`,
    );
  }
}
