import { MigrationInterface, QueryRunner } from 'typeorm';

export class Gi1770724168370 implements MigrationInterface {
  name = 'Gi1770724168370';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."action_log_action_enum" RENAME TO "action_log_action_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."action_log_action_enum" AS ENUM('Create Asset', 'Update Asset', 'Delete Asset', 'Authentication', 'Authorization')`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ALTER COLUMN "action" TYPE "public"."action_log_action_enum" USING "action"::"text"::"public"."action_log_action_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."action_log_action_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."action_log_status_enum" RENAME TO "action_log_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."action_log_status_enum" AS ENUM('Success', 'Failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ALTER COLUMN "status" TYPE "public"."action_log_status_enum" USING "status"::"text"::"public"."action_log_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."action_log_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."action_log_status_enum_old" AS ENUM('success', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ALTER COLUMN "status" TYPE "public"."action_log_status_enum_old" USING "status"::"text"::"public"."action_log_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."action_log_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."action_log_status_enum_old" RENAME TO "action_log_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."action_log_action_enum_old" AS ENUM('create_asset', 'update_asset', 'delete_asset')`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ALTER COLUMN "action" TYPE "public"."action_log_action_enum_old" USING "action"::"text"::"public"."action_log_action_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."action_log_action_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."action_log_action_enum_old" RENAME TO "action_log_action_enum"`,
    );
  }
}
