import { MigrationInterface, QueryRunner } from 'typeorm';

export class assetTypeVersionIdNotNull1755583017638
  implements MigrationInterface
{
  name = 'assetTypeVersionIdNotNull1755583017638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_800fd913227c95ecee03a3e824e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "assetTypeVersionId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_800fd913227c95ecee03a3e824e" FOREIGN KEY ("assetTypeVersionId") REFERENCES "asset_type_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_800fd913227c95ecee03a3e824e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "assetTypeVersionId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_800fd913227c95ecee03a3e824e" FOREIGN KEY ("assetTypeVersionId") REFERENCES "asset_type_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
