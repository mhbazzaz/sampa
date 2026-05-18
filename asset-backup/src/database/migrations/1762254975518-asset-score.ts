import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssetScore1762254975518 implements MigrationInterface {
  name = 'AssetScore1762254975518';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "asset_score" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "_v" integer NOT NULL, "value" numeric(10,2) NOT NULL, "description" character varying NOT NULL, "factorId" uuid NOT NULL, CONSTRAINT "PK_9d1a27cd9dfc9ef78cb7abd76ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_scoring_factor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "_v" integer NOT NULL, "weight" numeric(10,2) NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_6e14628af96e61a9cb960f1b372" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD "financialScore" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD "reputationScore" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD "confidentialityScore" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD "integrityScore" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD "availabilityScore" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_score" ADD CONSTRAINT "FK_e235dff43f55f911b1fe7518502" FOREIGN KEY ("factorId") REFERENCES "asset_scoring_factor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asset_score" DROP CONSTRAINT "FK_e235dff43f55f911b1fe7518502"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP COLUMN "availabilityScore"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP COLUMN "integrityScore"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP COLUMN "confidentialityScore"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP COLUMN "reputationScore"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP COLUMN "financialScore"`,
    );
    await queryRunner.query(`DROP TABLE "asset_scoring_factor"`);
    await queryRunner.query(`DROP TABLE "asset_score"`);
  }
}
