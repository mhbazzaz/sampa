import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActionLog1767776282508 implements MigrationInterface {
  name = 'ActionLog1767776282508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."action_log_action_enum" AS ENUM('create_asset', 'update_asset', 'delete_asset')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."action_log_status_enum" AS ENUM('Success', 'Failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "action_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "_v" integer NOT NULL, "userId" uuid NOT NULL, "ipAddress" character varying, "roleIds" text array NOT NULL, "action" "public"."action_log_action_enum" NOT NULL, "assetId" uuid NOT NULL, "assetOldBaseline" character varying, "assetNewBaseline" character varying, "changes" jsonb, "status" "public"."action_log_status_enum" NOT NULL, CONSTRAINT "PK_63cffa5d8af90621882f0388359" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ADD CONSTRAINT "FK_6587094d9a54285915b90533c42" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ADD CONSTRAINT "FK_71a66d858d23f86ba02d41ecdbc" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "action_log" DROP CONSTRAINT "FK_71a66d858d23f86ba02d41ecdbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" DROP CONSTRAINT "FK_6587094d9a54285915b90533c42"`,
    );
    await queryRunner.query(`DROP TABLE "action_log"`);
    await queryRunner.query(`DROP TYPE "public"."action_log_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."action_log_action_enum"`);
  }
}
