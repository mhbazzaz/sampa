import { MigrationInterface, QueryRunner } from 'typeorm';

export class MadeAssetIdNullableActionlog1781339068665
  implements MigrationInterface
{
  name = 'MadeAssetIdNullableActionlog1781339068665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "action_log" DROP CONSTRAINT "FK_71a66d858d23f86ba02d41ecdbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ALTER COLUMN "assetId" DROP NOT NULL`,
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
      `ALTER TABLE "action_log" ALTER COLUMN "assetId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_log" ADD CONSTRAINT "FK_71a66d858d23f86ba02d41ecdbc" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
