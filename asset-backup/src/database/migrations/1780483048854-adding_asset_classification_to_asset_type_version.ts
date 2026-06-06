import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddingAssetClassificationToAssetTypeVersion1780483048854 implements MigrationInterface {
  name = 'AddingAssetClassificationToAssetTypeVersion1780483048854';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."asset_type_version_classification_enum" AS ENUM('LogSource')`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" ADD "classification" "public"."asset_type_version_classification_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."asset_version_status_enum" RENAME TO "asset_version_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asset_version_status_enum" AS ENUM('inService', 'idle', 'underMaintenance', 'outOfService', 'disabled', 'disposed', 'pending', 'approved', 'declined')`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "status" TYPE "public"."asset_version_status_enum" USING "status"::"text"::"public"."asset_version_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "status" SET DEFAULT 'inService'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."asset_version_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_8c7d13da7b66e42c28c878764e5" FOREIGN KEY ("accountableId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_ad6cd90f7e1ae2c8e0c4ae92163" FOREIGN KEY ("editorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_ad6cd90f7e1ae2c8e0c4ae92163"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_8c7d13da7b66e42c28c878764e5"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asset_version_status_enum_old" AS ENUM('inService', 'idle', 'underMaintenance', 'outOfService', 'disabled', 'disposed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "status" TYPE "public"."asset_version_status_enum_old" USING "status"::"text"::"public"."asset_version_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "status" SET DEFAULT 'inService'`,
    );
    await queryRunner.query(`DROP TYPE "public"."asset_version_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."asset_version_status_enum_old" RENAME TO "asset_version_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" DROP COLUMN "classification"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."asset_type_version_classification_enum"`,
    );
  }
}
