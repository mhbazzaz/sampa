import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1754197701485 implements MigrationInterface {
  name = 'Initial1754197701485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "state_transition" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "processId" uuid NOT NULL, "actionId" uuid NOT NULL, "currentStateId" uuid NOT NULL, "nextStateId" uuid NOT NULL, CONSTRAINT "PK_08a49842a67b84f47fab2746ea2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "state" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, "processId" uuid NOT NULL, CONSTRAINT "PK_549ffd046ebab1336c3a8030a12" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "process" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_d5e3ab0f6df55ee74ca24967952" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."action_tier_enum" AS ENUM('backend', 'frontend')`,
    );
    await queryRunner.query(
      `CREATE TABLE "action" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, "tier" "public"."action_tier_enum" NOT NULL, "processId" uuid NOT NULL, CONSTRAINT "PK_2d9db9cf5edfbbae74eb56e3a39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."role_category_enum" AS ENUM('Internal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, "nameFa" character varying NOT NULL, "category" "public"."role_category_enum" NOT NULL DEFAULT 'Internal', "superiorId" uuid, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "role_nameFa_deletedAt" ON "role" ("nameFa") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "role_name_deletedAt" ON "role" ("name") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_34bcae130ac8ab9cb8f738a40f1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "asset_category_name_deletedAt" ON "asset_category" ("name") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "filter" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "key" character varying NOT NULL, CONSTRAINT "PK_3c5d89c1607d52ce265c7348f70" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "filter_key_deletedAt" ON "filter" ("key", "deletedAt") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "filter_value" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "value" character varying NOT NULL, "filterId" uuid NOT NULL, CONSTRAINT "PK_4b1d8913e33a666e65ffecf0a35" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."location_type_category_enum" AS ENUM('physical', 'virtual')`,
    );
    await queryRunner.query(
      `CREATE TABLE "location_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, "category" "public"."location_type_category_enum" NOT NULL DEFAULT 'physical', CONSTRAINT "PK_f765ccd86804048e9c1ea71db99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, "code" character varying NOT NULL, "exCode" character varying, "address" character varying NOT NULL, "parentId" uuid, "locationTypeId" uuid NOT NULL, CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_type_relation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "parentId" uuid NOT NULL, "childId" uuid NOT NULL, "assetRelationTypeId" uuid NOT NULL, CONSTRAINT "PK_285a35cb09798d06c41a0d4fe8a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asset_relation_type_direction_enum" AS ENUM('forward', 'reverse', 'bidirectional')`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_relation_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, "direction" "public"."asset_relation_type_direction_enum" NOT NULL DEFAULT 'bidirectional', CONSTRAINT "PK_e1917e0d9130c23d46442a472eb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "asset_relation_type_name_deletedAt" ON "asset_relation_type" ("name") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_relation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "assetRelationTypeId" uuid NOT NULL, "parentId" uuid NOT NULL, "childId" uuid NOT NULL, CONSTRAINT "PK_aa1b1faa23808990a3a79cd12fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asset_version_status_enum" AS ENUM('inService', 'idle', 'underMaintenance', 'outOfService', 'disabled', 'disposed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "version" integer NOT NULL DEFAULT '1', "baseline" character varying NOT NULL, "content" character varying NOT NULL, "status" "public"."asset_version_status_enum" NOT NULL DEFAULT 'inService', "accountableUnitId" character varying, "accountableId" character varying, "editorId" character varying, "editorUnitId" character varying, "archived" boolean NOT NULL DEFAULT false, "assetTypeVersionId" uuid, "assetId" uuid, "locationId" uuid, CONSTRAINT "PK_e0babbc4fc1033532c9a0d4c63e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "asset_baseline_version_deletedAt" ON "asset_version" ("baseline", "version", "deletedAt") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_type_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "content" character varying NOT NULL, "archived" boolean NOT NULL DEFAULT false, "hasLocation" boolean NOT NULL DEFAULT false, "version" integer NOT NULL DEFAULT '1', "assetTypeId" uuid NOT NULL, CONSTRAINT "PK_41d7b2f26779970b17ca8c4b3a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "iconPath" character varying, "assetCategoryId" uuid NOT NULL, CONSTRAINT "PK_9b5ee2748943131ed9d9831e8c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "asset_type_name_deletedAt" ON "asset_type" ("name") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "asset_type_code_deletedAt" ON "asset_type" ("code") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "asset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "referenceId" character varying NOT NULL, "externalRefId" character varying, "name" character varying NOT NULL, "description" character varying, "assetTypeId" uuid NOT NULL, CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "asset_referenceId_deletedAt" ON "asset" ("referenceId") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "tag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "name" character varying NOT NULL, "isEnabled" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"), CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "tag_name_deletedAt" ON "tag" ("name") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "_v" integer NOT NULL, "filePath" character varying, "errorFilePath" character varying, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "action_role" ("actionId" uuid NOT NULL, "roleId" uuid NOT NULL, CONSTRAINT "PK_a67a7716d6d5f36e2e521446074" PRIMARY KEY ("actionId", "roleId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35aba03771147772167b8ca1df" ON "action_role" ("actionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70756648b01c479dbd9f8a5758" ON "action_role" ("roleId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_role" ("roleId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_7b4e17a669299579dfa55a3fc35" PRIMARY KEY ("roleId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dba55ed826ef26b5b22bd39409" ON "user_role" ("roleId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab40a6f0cd7d3ebfcce082131f" ON "user_role" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "filter_asset_type_versions_asset_type_version" ("filterId" uuid NOT NULL, "assetTypeVersionId" uuid NOT NULL, CONSTRAINT "PK_25fc3d4dc87a16e859e9a961b39" PRIMARY KEY ("filterId", "assetTypeVersionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_045ed5615645466f50dac617d2" ON "filter_asset_type_versions_asset_type_version" ("filterId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f34b09aa7e3e90f1af3eac6ad" ON "filter_asset_type_versions_asset_type_version" ("assetTypeVersionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "filter_value_asset_version" ("filterValueId" uuid NOT NULL, "assetVersionId" uuid NOT NULL, CONSTRAINT "PK_210eef48ad8f9c680e90a309a98" PRIMARY KEY ("filterValueId", "assetVersionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab1608816f1510f685ad207750" ON "filter_value_asset_version" ("filterValueId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a6924cf83feee5d001ebbcf70" ON "filter_value_asset_version" ("assetVersionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "asset_type_version_location_type" ("locationTypeId" uuid NOT NULL, "assetTypeVersionId" uuid NOT NULL, CONSTRAINT "PK_1a9ef781e30e072c080bada2644" PRIMARY KEY ("locationTypeId", "assetTypeVersionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9151c01f990a94e5d14b298e54" ON "asset_type_version_location_type" ("locationTypeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72efe1dd3072108fa3d828480e" ON "asset_type_version_location_type" ("assetTypeVersionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tag_assets_asset" ("tagId" uuid NOT NULL, "assetId" uuid NOT NULL, CONSTRAINT "PK_94ba01d454bcaa349308c3262c1" PRIMARY KEY ("tagId", "assetId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59a12d9f1ad9402f19d93c996f" ON "tag_assets_asset" ("tagId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc177e6974ac1aa1e7c1579efa" ON "tag_assets_asset" ("assetId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tag_locations_location" ("tagId" uuid NOT NULL, "locationId" uuid NOT NULL, CONSTRAINT "PK_b1581bc8f767edbdfac8e04118c" PRIMARY KEY ("tagId", "locationId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41777ef785bd63a10579e96523" ON "tag_locations_location" ("tagId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c90a293f5ad615b3f73416a1c3" ON "tag_locations_location" ("locationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" ADD CONSTRAINT "FK_d8fb072c6eb114222f74c0c7445" FOREIGN KEY ("processId") REFERENCES "process"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" ADD CONSTRAINT "FK_9353ed6bc0c041e6620008bc585" FOREIGN KEY ("actionId") REFERENCES "action"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" ADD CONSTRAINT "FK_de16c89dd1082adf8cbb76b6e58" FOREIGN KEY ("currentStateId") REFERENCES "state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" ADD CONSTRAINT "FK_f5132980c65bfd380b3dd589901" FOREIGN KEY ("nextStateId") REFERENCES "state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "state" ADD CONSTRAINT "FK_5e3119aaaa88b445d4a3560368a" FOREIGN KEY ("processId") REFERENCES "process"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "action" ADD CONSTRAINT "FK_ae4c2f2dda58e3dfcea93c75872" FOREIGN KEY ("processId") REFERENCES "process"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role" ADD CONSTRAINT "FK_e591c8939fca29f7ba58c85f503" FOREIGN KEY ("superiorId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value" ADD CONSTRAINT "FK_95a3c2faaa1f2dd5b93ee3d16f6" FOREIGN KEY ("filterId") REFERENCES "filter"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_9123571b1f7aadc5ee8a6f3f152" FOREIGN KEY ("parentId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_84ea3d2e2ec24158c09e2b85d12" FOREIGN KEY ("locationTypeId") REFERENCES "location_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" ADD CONSTRAINT "FK_3478bb4560c45e86adfe986bdbb" FOREIGN KEY ("parentId") REFERENCES "asset_type_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" ADD CONSTRAINT "FK_228f28f05d0db2bb8355adbe35a" FOREIGN KEY ("childId") REFERENCES "asset_type_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" ADD CONSTRAINT "FK_b7db8eeb6a81a7e680aebb53630" FOREIGN KEY ("assetRelationTypeId") REFERENCES "asset_relation_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" ADD CONSTRAINT "FK_950e5c358eb0c6177a9a2d4e5b9" FOREIGN KEY ("assetRelationTypeId") REFERENCES "asset_relation_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" ADD CONSTRAINT "FK_2b5f9d1abdb7331158b52814b10" FOREIGN KEY ("parentId") REFERENCES "asset_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" ADD CONSTRAINT "FK_caff995452a780befd99fcb0572" FOREIGN KEY ("childId") REFERENCES "asset_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_800fd913227c95ecee03a3e824e" FOREIGN KEY ("assetTypeVersionId") REFERENCES "asset_type_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_5c2dc240731f278c488b0c4abe5" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" ADD CONSTRAINT "FK_0e289b0335ed14a3af156e0f6cf" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" ADD CONSTRAINT "FK_ad84b14825939d20d47685e00df" FOREIGN KEY ("assetTypeId") REFERENCES "asset_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type" ADD CONSTRAINT "FK_038edab4fc44e232570c6b80edb" FOREIGN KEY ("assetCategoryId") REFERENCES "asset_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" ADD CONSTRAINT "FK_53824cd90f4ae4ed1896f9adeb0" FOREIGN KEY ("assetTypeId") REFERENCES "asset_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_role" ADD CONSTRAINT "FK_35aba03771147772167b8ca1df7" FOREIGN KEY ("actionId") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_role" ADD CONSTRAINT "FK_70756648b01c479dbd9f8a57587" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" ADD CONSTRAINT "FK_dba55ed826ef26b5b22bd39409b" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" ADD CONSTRAINT "FK_ab40a6f0cd7d3ebfcce082131fd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_asset_type_versions_asset_type_version" ADD CONSTRAINT "FK_045ed5615645466f50dac617d2e" FOREIGN KEY ("filterId") REFERENCES "filter"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_asset_type_versions_asset_type_version" ADD CONSTRAINT "FK_7f34b09aa7e3e90f1af3eac6ad9" FOREIGN KEY ("assetTypeVersionId") REFERENCES "asset_type_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value_asset_version" ADD CONSTRAINT "FK_ab1608816f1510f685ad2077506" FOREIGN KEY ("filterValueId") REFERENCES "filter_value"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value_asset_version" ADD CONSTRAINT "FK_3a6924cf83feee5d001ebbcf708" FOREIGN KEY ("assetVersionId") REFERENCES "asset_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version_location_type" ADD CONSTRAINT "FK_9151c01f990a94e5d14b298e54f" FOREIGN KEY ("locationTypeId") REFERENCES "location_type"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version_location_type" ADD CONSTRAINT "FK_72efe1dd3072108fa3d828480e4" FOREIGN KEY ("assetTypeVersionId") REFERENCES "asset_type_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_assets_asset" ADD CONSTRAINT "FK_59a12d9f1ad9402f19d93c996f4" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_assets_asset" ADD CONSTRAINT "FK_bc177e6974ac1aa1e7c1579efa3" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_locations_location" ADD CONSTRAINT "FK_41777ef785bd63a10579e965238" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_locations_location" ADD CONSTRAINT "FK_c90a293f5ad615b3f73416a1c36" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tag_locations_location" DROP CONSTRAINT "FK_c90a293f5ad615b3f73416a1c36"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_locations_location" DROP CONSTRAINT "FK_41777ef785bd63a10579e965238"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_assets_asset" DROP CONSTRAINT "FK_bc177e6974ac1aa1e7c1579efa3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_assets_asset" DROP CONSTRAINT "FK_59a12d9f1ad9402f19d93c996f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version_location_type" DROP CONSTRAINT "FK_72efe1dd3072108fa3d828480e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version_location_type" DROP CONSTRAINT "FK_9151c01f990a94e5d14b298e54f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value_asset_version" DROP CONSTRAINT "FK_3a6924cf83feee5d001ebbcf708"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value_asset_version" DROP CONSTRAINT "FK_ab1608816f1510f685ad2077506"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_asset_type_versions_asset_type_version" DROP CONSTRAINT "FK_7f34b09aa7e3e90f1af3eac6ad9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_asset_type_versions_asset_type_version" DROP CONSTRAINT "FK_045ed5615645466f50dac617d2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" DROP CONSTRAINT "FK_ab40a6f0cd7d3ebfcce082131fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" DROP CONSTRAINT "FK_dba55ed826ef26b5b22bd39409b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_role" DROP CONSTRAINT "FK_70756648b01c479dbd9f8a57587"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_role" DROP CONSTRAINT "FK_35aba03771147772167b8ca1df7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset" DROP CONSTRAINT "FK_53824cd90f4ae4ed1896f9adeb0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type" DROP CONSTRAINT "FK_038edab4fc44e232570c6b80edb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_version" DROP CONSTRAINT "FK_ad84b14825939d20d47685e00df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_0e289b0335ed14a3af156e0f6cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_5c2dc240731f278c488b0c4abe5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_version" DROP CONSTRAINT "FK_800fd913227c95ecee03a3e824e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" DROP CONSTRAINT "FK_caff995452a780befd99fcb0572"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" DROP CONSTRAINT "FK_2b5f9d1abdb7331158b52814b10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_relation" DROP CONSTRAINT "FK_950e5c358eb0c6177a9a2d4e5b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" DROP CONSTRAINT "FK_b7db8eeb6a81a7e680aebb53630"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" DROP CONSTRAINT "FK_228f28f05d0db2bb8355adbe35a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_type_relation" DROP CONSTRAINT "FK_3478bb4560c45e86adfe986bdbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_84ea3d2e2ec24158c09e2b85d12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_9123571b1f7aadc5ee8a6f3f152"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filter_value" DROP CONSTRAINT "FK_95a3c2faaa1f2dd5b93ee3d16f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role" DROP CONSTRAINT "FK_e591c8939fca29f7ba58c85f503"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action" DROP CONSTRAINT "FK_ae4c2f2dda58e3dfcea93c75872"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state" DROP CONSTRAINT "FK_5e3119aaaa88b445d4a3560368a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" DROP CONSTRAINT "FK_f5132980c65bfd380b3dd589901"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" DROP CONSTRAINT "FK_de16c89dd1082adf8cbb76b6e58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" DROP CONSTRAINT "FK_9353ed6bc0c041e6620008bc585"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_transition" DROP CONSTRAINT "FK_d8fb072c6eb114222f74c0c7445"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c90a293f5ad615b3f73416a1c3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_41777ef785bd63a10579e96523"`,
    );
    await queryRunner.query(`DROP TABLE "tag_locations_location"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bc177e6974ac1aa1e7c1579efa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_59a12d9f1ad9402f19d93c996f"`,
    );
    await queryRunner.query(`DROP TABLE "tag_assets_asset"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72efe1dd3072108fa3d828480e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9151c01f990a94e5d14b298e54"`,
    );
    await queryRunner.query(`DROP TABLE "asset_type_version_location_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a6924cf83feee5d001ebbcf70"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab1608816f1510f685ad207750"`,
    );
    await queryRunner.query(`DROP TABLE "filter_value_asset_version"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f34b09aa7e3e90f1af3eac6ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_045ed5615645466f50dac617d2"`,
    );
    await queryRunner.query(
      `DROP TABLE "filter_asset_type_versions_asset_type_version"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab40a6f0cd7d3ebfcce082131f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dba55ed826ef26b5b22bd39409"`,
    );
    await queryRunner.query(`DROP TABLE "user_role"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70756648b01c479dbd9f8a5758"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_35aba03771147772167b8ca1df"`,
    );
    await queryRunner.query(`DROP TABLE "action_role"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP INDEX "public"."tag_name_deletedAt"`);
    await queryRunner.query(`DROP TABLE "tag"`);
    await queryRunner.query(
      `DROP INDEX "public"."asset_referenceId_deletedAt"`,
    );
    await queryRunner.query(`DROP TABLE "asset"`);
    await queryRunner.query(`DROP INDEX "public"."asset_type_code_deletedAt"`);
    await queryRunner.query(`DROP INDEX "public"."asset_type_name_deletedAt"`);
    await queryRunner.query(`DROP TABLE "asset_type"`);
    await queryRunner.query(`DROP TABLE "asset_type_version"`);
    await queryRunner.query(
      `DROP INDEX "public"."asset_baseline_version_deletedAt"`,
    );
    await queryRunner.query(`DROP TABLE "asset_version"`);
    await queryRunner.query(`DROP TYPE "public"."asset_version_status_enum"`);
    await queryRunner.query(`DROP TABLE "asset_relation"`);
    await queryRunner.query(
      `DROP INDEX "public"."asset_relation_type_name_deletedAt"`,
    );
    await queryRunner.query(`DROP TABLE "asset_relation_type"`);
    await queryRunner.query(
      `DROP TYPE "public"."asset_relation_type_direction_enum"`,
    );
    await queryRunner.query(`DROP TABLE "asset_type_relation"`);
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP TABLE "location_type"`);
    await queryRunner.query(`DROP TYPE "public"."location_type_category_enum"`);
    await queryRunner.query(`DROP TABLE "filter_value"`);
    await queryRunner.query(`DROP INDEX "public"."filter_key_deletedAt"`);
    await queryRunner.query(`DROP TABLE "filter"`);
    await queryRunner.query(
      `DROP INDEX "public"."asset_category_name_deletedAt"`,
    );
    await queryRunner.query(`DROP TABLE "asset_category"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP INDEX "public"."role_name_deletedAt"`);
    await queryRunner.query(`DROP INDEX "public"."role_nameFa_deletedAt"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TYPE "public"."role_category_enum"`);
    await queryRunner.query(`DROP TABLE "action"`);
    await queryRunner.query(`DROP TYPE "public"."action_tier_enum"`);
    await queryRunner.query(`DROP TABLE "process"`);
    await queryRunner.query(`DROP TABLE "state"`);
    await queryRunner.query(`DROP TABLE "state_transition"`);
  }
}
