import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStateColumnsToPendingChanges1715200001000
  implements MigrationInterface
{
  name = 'AddStateColumnsToPendingChanges1715200001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('pending_changes', [
      new TableColumn({
        name: 'assessment_request_current_state_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'assessment_request_next_state_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'assessment_layer_current_state_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'assessment_layer_next_state_id',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('pending_changes', [
      'assessment_request_current_state_id',
      'assessment_request_next_state_id',
      'assessment_layer_current_state_id',
      'assessment_layer_next_state_id',
    ]);
  }
}
