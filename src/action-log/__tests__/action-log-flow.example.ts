/**
 * Action Log Flow Example & Test Template
 * 
 * This file demonstrates how the action log system works
 * and provides templates for future unit/integration tests.
 */

import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';

// ============================================================================
// EXAMPLE FLOW: Spec Content Update → State Transition
// ============================================================================

/**
 * Scenario: User updates spec content, then transitions layer state
 * 
 * Expected Flow:
 * 1. User updates spec content for a layer
 * 2. System buffers the change to pending_changes table
 * 3. User transitions the layer to next state (e.g., accept specs)
 * 4. System flushes pending changes to action_log table
 * 5. Both business state and audit log are committed atomically
 * 
 * Database Operations:
 * - INSERT into request_spec_content (spec value updated)
 * - INSERT into pending_changes (change buffered)
 * - UPDATE assessment_layer (state transitioned)
 * - INSERT into action_log (final audit record)
 * - UPDATE pending_changes (marked as flushed)
 * - COMMIT (all operations together)
 */

// ============================================================================
// TEST TEMPLATE: Unit Tests for ActionLogBufferService
// ============================================================================

describe('ActionLogBufferService', () => {
  let service: ActionLogBufferService;
  let pendingChangeRepo: Repository<PendingChange>;
  let actionLogRepo: Repository<ActionLog>;
  let dataSource: DataSource;

  beforeEach(async () => {
    // Setup test module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionLogBufferService,
        {
          provide: getRepositoryToken(PendingChange),
          useValue: mockPendingChangeRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: GenericChangelogService,
          useValue: mockGenericChangelogService,
        },
        {
          provide: ChangelogConfigFactory,
          useValue: mockChangelogConfigFactory,
        },
      ],
    }).compile();

    service = module.get<ActionLogBufferService>(ActionLogBufferService);
  });

  // ========================================
  // Test: addChange()
  // ========================================
  
  describe('addChange', () => {
    it('should buffer a spec content change', async () => {
      const key = {
        assessmentRequestId: 'request-123',
        assessmentLayerId: 'layer-456',
      };
      
      const details = {
        entityType: EntityTypeEnum.Spec,
        beforeEntity: {},
        updateDto: { value: JSON.stringify({ key: 'value' }) },
        userId: 'user-789',
        assessmentRequestCurrentStateId: 'state-1',
        assessmentRequestNextStateId: 'state-1',
        assessmentLayerCurrentStateId: 'layer-state-1',
        assessmentLayerNextStateId: 'layer-state-1',
      };

      await service.addChange(key, details);

      expect(pendingChangeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assessmentRequestId: key.assessmentRequestId,
          assessmentLayerId: key.assessmentLayerId,
          entityType: EntityTypeEnum.Spec,
          isFlushed: false,
        })
      );
    });

    it('should buffer a testcase content change', async () => {
      const key = {
        assessmentRequestId: 'request-123',
      };
      
      const details = {
        entityType: EntityTypeEnum.Testcase,
        beforeEntity: { observations: 'old value' },
        updateDto: { observations: 'new value' },
        userId: 'user-789',
        assessmentRequestCurrentStateId: 'state-1',
        assessmentRequestNextStateId: 'state-1',
        assessmentLayerCurrentStateId: null,
        assessmentLayerNextStateId: null,
      };

      await service.addChange(key, details);

      expect(pendingChangeRepo.save).toHaveBeenCalled();
    });
  });

  // ========================================
  // Test: flushToActionLog()
  // ========================================
  
  describe('flushToActionLog', () => {
    it('should flush pending changes to action log', async () => {
      const key = {
        assessmentRequestId: 'request-123',
        assessmentLayerId: 'layer-456',
      };

      const logData = {
        userId: 'user-789',
        roleIds: ['role-1'],
        action: ActionEnum.LayerSpecPreEvaluationAccept,
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestCurrentStateId: 'state-1',
        assessmentRequestNextStateId: 'state-1',
        assessmentLayerCurrentStateId: 'layer-state-1',
        assessmentLayerNextStateId: 'layer-state-2',
      };

      // Mock pending changes
      mockPendingChangeRepo.find.mockResolvedValue([
        {
          id: 'pending-1',
          entityType: EntityTypeEnum.Spec,
          beforeEntity: {},
          updateDto: { value: 'new-value' },
          isFlushed: false,
        },
      ]);

      const result = await service.flushToActionLog(key, logData);

      expect(result).toBeDefined();
      expect(result.assessmentRequestId).toBe(key.assessmentRequestId);
      expect(result.assessmentLayerId).toBe(key.assessmentLayerId);
      expect(mockPendingChangeRepo.update).toHaveBeenCalledWith(
        { id: In(['pending-1']) },
        { isFlushed: true }
      );
    });

    it('should create action log without changes when no pending changes exist', async () => {
      const key = {
        assessmentRequestId: 'request-123',
      };

      const logData = {
        userId: 'user-789',
        roleIds: ['role-1'],
        action: ActionEnum.PreEvaluationAccept,
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestCurrentStateId: 'state-1',
        assessmentRequestNextStateId: 'state-2',
        assessmentLayerCurrentStateId: null,
        assessmentLayerNextStateId: null,
      };

      // Mock no pending changes
      mockPendingChangeRepo.find.mockResolvedValue([]);

      const result = await service.flushToActionLog(key, logData);

      expect(result).toBeDefined();
      expect(result.changes).toBeUndefined();
      expect(result.action).toBe(ActionEnum.PreEvaluationAccept);
    });

    it('should work with external QueryRunner for atomic operations', async () => {
      const queryRunner = mockDataSource.createQueryRunner();
      const key = { assessmentRequestId: 'request-123' };
      const logData = {
        userId: 'user-789',
        roleIds: ['role-1'],
        action: ActionEnum.PreEvaluationAccept,
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestCurrentStateId: 'state-1',
        assessmentRequestNextStateId: 'state-2',
        assessmentLayerCurrentStateId: null,
        assessmentLayerNextStateId: null,
      };

      await service.flushToActionLog(key, logData, queryRunner);

      // Should NOT start/commit transaction (caller manages it)
      expect(queryRunner.startTransaction).not.toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // Test: cleanupFlushedChanges()
  // ========================================
  
  describe('cleanupFlushedChanges', () => {
    it('should delete old flushed pending changes', async () => {
      mockPendingChangeRepo.delete.mockResolvedValue({ affected: 42 });

      const deletedCount = await service.cleanupFlushedChanges(7);

      expect(deletedCount).toBe(42);
      expect(mockPendingChangeRepo.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          isFlushed: true,
        })
      );
    });
  });
});

// ============================================================================
// TEST TEMPLATE: Integration Tests
// ============================================================================

describe('Action Log Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Setup test database and application
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================================
  // Integration Test: Complete Flow
  // ========================================
  
  it('should create audit log for spec update followed by state transition', async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Create test data (request, layer, spec item)
      const request = await createTestAssessmentRequest(queryRunner);
      const layer = await createTestAssessmentLayer(queryRunner, request.id);
      const specItem = await createTestSpecItem(queryRunner);

      // Step 2: Update spec content (triggers addChange)
      await specContentService.updateSpecForLayer({
        specItemId: specItem.id,
        value: { answer: 'test value' },
        assessmentLayerId: layer.id,
      }, testMember);

      // Verify pending change was created
      const pendingChanges = await queryRunner.manager
        .getRepository(PendingChange)
        .find({
          where: {
            assessmentRequestId: request.id,
            assessmentLayerId: layer.id,
            isFlushed: false,
          },
        });
      
      expect(pendingChanges).toHaveLength(1);
      expect(pendingChanges[0].entityType).toBe('spec');

      // Step 3: Transition layer state (triggers flushToActionLog)
      await layerService.acceptLayerSpec(
        layer.id,
        { action: ActionEnum.LayerSpecPreEvaluationAccept },
        testMember,
        testMemberRoles,
      );

      // Step 4: Verify action log was created
      const actionLogs = await queryRunner.manager
        .getRepository(ActionLog)
        .find({
          where: {
            assessmentRequestId: request.id,
            assessmentLayerId: layer.id,
          },
        });

      expect(actionLogs).toHaveLength(1);
      expect(actionLogs[0].action).toBe(ActionEnum.LayerSpecPreEvaluationAccept);
      expect(actionLogs[0].changes).toBeDefined();
      expect(actionLogs[0].changes).toHaveLength(1);
      expect(actionLogs[0].changes[0].updateData).toBe('value');

      // Step 5: Verify pending change was marked as flushed
      const flushedChanges = await queryRunner.manager
        .getRepository(PendingChange)
        .find({
          where: {
            assessmentRequestId: request.id,
            assessmentLayerId: layer.id,
            isFlushed: true,
          },
        });

      expect(flushedChanges).toHaveLength(1);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  });

  // ========================================
  // Integration Test: Rollback Scenario
  // ========================================
  
  it('should rollback both business and audit changes on error', async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await createTestAssessmentRequest(queryRunner);
      const layer = await createTestAssessmentLayer(queryRunner, request.id);

      // Create some pending changes
      await actionLogBufferService.addChange(
        { assessmentRequestId: request.id, assessmentLayerId: layer.id },
        {
          entityType: EntityTypeEnum.Spec,
          beforeEntity: {},
          updateDto: { value: 'test' },
          userId: testMember.id,
          assessmentRequestCurrentStateId: request.stateId,
          assessmentRequestNextStateId: request.stateId,
          assessmentLayerCurrentStateId: layer.stateId,
          assessmentLayerNextStateId: layer.stateId,
        },
      );

      // Simulate an error during flush
      jest.spyOn(actionLogBufferService, 'flushToActionLog')
        .mockRejectedValue(new Error('Test error'));

      // Attempt state transition (should fail and rollback)
      await expect(
        layerService.acceptLayerSpec(layer.id, {}, testMember, testMemberRoles)
      ).rejects.toThrow();

      await queryRunner.rollbackTransaction();

      // Verify no action log was created
      const actionLogs = await dataSource.getRepository(ActionLog).find({
        where: { assessmentRequestId: request.id },
      });

      expect(actionLogs).toHaveLength(0);

    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createTestAssessmentRequest(queryRunner: QueryRunner) {
  return queryRunner.manager.getRepository(AssessmentRequest).save({
    requestNumber: 'TEST-001',
    stateId: 'initial-state',
    applicantId: 'user-1',
    applicantManagerId: 'user-2',
    cisoId: 'user-3',
    environmentId: 'env-1',
  });
}

async function createTestAssessmentLayer(
  queryRunner: QueryRunner,
  assessmentRequestId: string,
) {
  return queryRunner.manager.getRepository(AssessmentLayer).save({
    assessmentRequestId,
    stateId: 'pending-specs',
    assessmentTypeId: 'type-1',
  });
}

async function createTestSpecItem(queryRunner: QueryRunner) {
  return queryRunner.manager.getRepository(RequestSpecItem).save({
    name: 'Test Spec Item',
    requestSpecGroupId: 'group-1',
    assetTypeId: 'asset-type-1',
    environmentId: 'env-1',
  });
}
