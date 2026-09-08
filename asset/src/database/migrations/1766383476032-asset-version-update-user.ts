import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssetVersionUpdateUser1766383476032 implements MigrationInterface {
  name = 'AssetVersionUpdateUser1766383476032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD "updateUserId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_c21ebf37b93640c85a2d322e7f5" FOREIGN KEY ("updateUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_c21ebf37b93640c85a2d322e7f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP COLUMN "updateUserId"`,
    );
  }
}
