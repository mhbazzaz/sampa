import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsShareableToAssetType1781953083311
  implements MigrationInterface
{
  name = 'AddIsShareableToAssetType1781953083311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_type" ADD "isShareable" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_type" DROP COLUMN "isShareable"`,
    );
  }
}
