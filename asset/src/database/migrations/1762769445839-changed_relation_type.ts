import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangedRelationType1762769445839 implements MigrationInterface {
  name = 'ChangedRelationType1762769445839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."asset_relation_type_direction_enum" RENAME TO "asset_relation_type_direction_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asset_relation_type_direction_enum" AS ENUM('directional', 'bidirectional')`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "direction" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "direction" TYPE "public"."asset_relation_type_direction_enum" USING "direction"::"text"::"public"."asset_relation_type_direction_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "direction" SET DEFAULT 'bidirectional'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."asset_relation_type_direction_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."asset_relation_type_direction_enum_old" AS ENUM('forward', 'reverse', 'bidirectional')`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "direction" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "direction" TYPE "public"."asset_relation_type_direction_enum_old" USING "direction"::"text"::"public"."asset_relation_type_direction_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "direction" SET DEFAULT 'bidirectional'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."asset_relation_type_direction_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."asset_relation_type_direction_enum_old" RENAME TO "asset_relation_type_direction_enum"`,
    );
  }
}
