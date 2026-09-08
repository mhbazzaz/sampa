import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTimestampToTimstamptz1756901000880
  implements MigrationInterface
{
  name = 'ChangeTimestampToTimstamptz1756901000880';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "state" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "state" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "state" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "process" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "process" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "process" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "action" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "action" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "action" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "role" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "role" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "role" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset_category" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_category" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_category" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "filter" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "filter_value" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "location_type" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_type" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_type" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "location" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation_type" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset_relation" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset_type_version" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset_type" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "tag" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );

    await queryRunner.query(
      `ALTER TABLE "state_transition" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'Etc/UTC';`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'Etc/UTC';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
