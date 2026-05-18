import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeAccountableEditorTypeToUuid1756807706506
  implements MigrationInterface
{
  name = 'ChangeAccountableEditorTypeToUuid1756807706506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "editorId" TYPE UUID USING "editorId"::uuid;`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "editorUnitId" TYPE UUID USING "editorUnitId"::uuid;`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "accountableId" TYPE UUID USING "accountableId"::uuid;`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "accountableUnitId" TYPE UUID USING "accountableUnitId"::uuid;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "editorId" TYPE character varying USING "editorId";`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "editorUnitId" TYPE character varying USING "editorUnitId";`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "accountableId" TYPE character varying USING "accountableId";`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."asset_version" ALTER COLUMN "accountableUnitId" TYPE character varying USING "accountableUnitId";`,
    );
  }
}
