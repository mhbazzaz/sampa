import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePendingChangesTable1715200000000 implements MigrationInterface {
  name = 'CreatePendingChangesTable1715200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.createTable(
      new Table({
        name: 'pending_changes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'assessment_request_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'assessment_layer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'entity_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'before_entity',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'update_dto',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_flushed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'pending_changes',
      new TableIndex({
        name: 'IDX_PENDING_CHANGES_REQUEST_ID',
        columnNames: ['assessment_request_id'],
      }),
    );

    await queryRunner.createIndex(
      'pending_changes',
      new TableIndex({
        name: 'IDX_PENDING_CHANGES_LAYER_ID',
        columnNames: ['assessment_layer_id'],
      }),
    );

    await queryRunner.createIndex(
      'pending_changes',
      new TableIndex({
        name: 'IDX_PENDING_CHANGES_IS_FLUSHED',
        columnNames: ['is_flushed'],
      }),
    );

    await queryRunner.createIndex(
      'pending_changes',
      new TableIndex({
        name: 'IDX_PENDING_CHANGES_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('pending_changes', 'IDX_PENDING_CHANGES_CREATED_AT');
    await queryRunner.dropIndex('pending_changes', 'IDX_PENDING_CHANGES_IS_FLUSHED');
    await queryRunner.dropIndex('pending_changes', 'IDX_PENDING_CHANGES_LAYER_ID');
    await queryRunner.dropIndex('pending_changes', 'IDX_PENDING_CHANGES_REQUEST_ID');
    await queryRunner.dropTable('pending_changes');
  }
}
