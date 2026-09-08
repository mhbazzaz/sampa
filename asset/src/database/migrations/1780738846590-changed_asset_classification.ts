import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangedAssetClassification1780738846590
  implements MigrationInterface
{
  name = 'ChangedAssetClassification1780738846590';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."asset_type_version_classification_enum" RENAME TO "asset_type_version_classification_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asset_type_version_classification_enum" AS ENUM('Log Source Watcher')`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" ALTER COLUMN "classification" TYPE "public"."asset_type_version_classification_enum" USING "classification"::"text"::"public"."asset_type_version_classification_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."asset_type_version_classification_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."asset_type_version_classification_enum_old" AS ENUM('LogSource')`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" ALTER COLUMN "classification" TYPE "public"."asset_type_version_classification_enum_old" USING "classification"::"text"::"public"."asset_type_version_classification_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."asset_type_version_classification_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."asset_type_version_classification_enum_old" RENAME TO "asset_type_version_classification_enum"`,
    );
  }
}
