import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActionLogStatusEnum } from 'src/common/enums/action-log.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ChangelogConfig } from 'src/common/interfaces/change-log-config.interface';
import { ChangeLog } from 'src/common/interfaces/change-log.interface';
import { DataSource, In, LessThan, QueryRunner, Repository } from 'typeorm';
import { ActionLog } from '../entities/action-log.entity';
import { PendingChange } from '../entities/pending-change.entity';
import { ChangelogConfigFactory } from './change-log-configs';
import { GenericChangelogService } from './generic-change-log.service';

@Injectable()
export class ActionLogBufferService {
  private readonly logger = new Logger(ActionLogBufferService.name);

  constructor(
    @InjectRepository(PendingChange)
    private pendingChangeRepo: Repository<PendingChange>,
    private readonly dataSource: DataSource,
    private genericChangelogService: GenericChangelogService,
    private changelogConfigFactory: ChangelogConfigFactory,
  ) {}

  /**
   * Adds a change to the pending_changes table to be flushed later.
   */
  async addChange(
    key: {
      assessmentRequestId: string;
      assessmentLayerId?: string;
    },
    details: {
      entityType: 'request' | 'layer' | 'testcase' | 'spec' | 'remediate';
      beforeEntity: any;
      updateDto: any;
      userId: string;
      ipAddress?: string;
      assessmentRequestCurrentStateId?: string | null;
      assessmentRequestNextStateId?: string | null;
      assessmentLayerCurrentStateId?: string | null;
      assessmentLayerNextStateId?: string | null;
    },
  ): Promise<void> {
    try {
      await this.pendingChangeRepo.save({
        assessmentRequestId: key.assessmentRequestId,
        assessmentLayerId: key.assessmentLayerId || null,
        entityType: details.entityType,
        beforeEntity: details.beforeEntity,
        updateDto: details.updateDto,
        userId: details.userId,
        ipAddress: details.ipAddress || null,
        assessmentRequestCurrentStateId:
          details.assessmentRequestCurrentStateId ?? null,
        assessmentRequestNextStateId:
          details.assessmentRequestNextStateId ?? null,
        assessmentLayerCurrentStateId:
          details.assessmentLayerCurrentStateId ?? null,
        assessmentLayerNextStateId: details.assessmentLayerNextStateId ?? null,
        isFlushed: false,
      });
      this.logger.debug(
        `Pending change added for Request: ${key.assessmentRequestId}, Layer: ${key.assessmentLayerId || 'none'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add pending change: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves pending changes for a specific request and layer.
   */
  private async getPendingChanges(
    key: {
      assessmentRequestId: string;
      assessmentLayerId?: string;
    },
    queryRunner?: QueryRunner,
  ): Promise<PendingChange[]> {
    const pendingChangeRepo = queryRunner
      ? queryRunner.manager.getRepository(PendingChange)
      : this.pendingChangeRepo;
    try {
      const whereClause: any = {
        assessmentRequestId: key.assessmentRequestId,
        isFlushed: false,
      };

      if (key.assessmentLayerId) {
        whereClause.assessmentLayerId = key.assessmentLayerId;
      } else {
        whereClause.assessmentLayerId = null; // using null is sufficient for TypeORM in most cases, or IsNull()
      }

      const pendingChanges = await pendingChangeRepo.find({
        where: whereClause,
        order: { createdAt: 'ASC' },
      });

      this.logger.debug(
        `Found ${pendingChanges.length} pending changes for Request: ${key.assessmentRequestId}, Layer: ${key.assessmentLayerId || 'none'}`,
      );
      return pendingChanges;
    } catch (error) {
      this.logger.error(
        `Failed to get pending changes: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Flushes all pending changes for a given key to an ActionLog record.
   */
  async flushToActionLog(
    key: {
      assessmentRequestId: string;
      assessmentLayerId?: string;
    },
    logData: {
      userId: string;
      ipAddress?: string;
      roleIds: string[];
      action: ActionEnum;
      assessmentRequestCurrentStateId?: string | null;
      assessmentRequestNextStateId?: string | null;
      assessmentLayerCurrentStateId?: string | null;
      assessmentLayerNextStateId?: string | null;
      status: ActionLogStatusEnum;
    },
  ): Promise<ActionLog> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await this.acquireScopeLock(queryRunner, key);

      const pendingChanges = await this.getPendingChanges(key, queryRunner);
      const resolvedStateIds = this.resolveStateIds(pendingChanges, logData);

      if (pendingChanges.length === 0) {
        this.logger.log(
          `No pending changes to flush for Request: ${key.assessmentRequestId}, Layer: ${key.assessmentLayerId || 'none'}. Creating ActionLog for state transition only.`,
        );
        const actionLog = await queryRunner.manager
          .getRepository(ActionLog)
          .save({
            ...logData,
            ...resolvedStateIds,
            assessmentRequestId: key.assessmentRequestId,
            assessmentLayerId: key.assessmentLayerId || null,
            changes: undefined,
          });
        await queryRunner.commitTransaction();
        return actionLog;
      }

      const allChanges: ChangeLog[] = [];

      for (const pendingChange of pendingChanges) {
        const config = this.getConfigForEntity(pendingChange.entityType);
        const enrichedChanges =
          await this.genericChangelogService.buildAndEnrichChangeLog(
            pendingChange.beforeEntity,
            pendingChange.updateDto,
            config,
          );
        allChanges.push(...enrichedChanges);
      }

      const actionLog = await queryRunner.manager
        .getRepository(ActionLog)
        .save({
          ...logData,
          ...resolvedStateIds,
          assessmentRequestId: key.assessmentRequestId,
          assessmentLayerId: key.assessmentLayerId || null,
          changes: allChanges.length > 0 ? allChanges : undefined,
        });

      await queryRunner.manager
        .getRepository(PendingChange)
        .update(
          { id: In(pendingChanges.map((pc) => pc.id)) },
          { isFlushed: true },
        );

      this.logger.log(
        `Flushed ${pendingChanges.length} pending changes to ActionLog ${actionLog.id}`,
      );
      await queryRunner.commitTransaction();
      return actionLog;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(
        `Failed to flush to ActionLog: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------
  private async acquireScopeLock(
    queryRunner: QueryRunner,
    key: {
      assessmentRequestId: string;
      assessmentLayerId?: string;
    },
  ) {
    const scopeKey = `${key.assessmentRequestId}:${key.assessmentLayerId ?? 'request'}`;
    await queryRunner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      scopeKey,
    ]);
  }

  //------------------------------
  private resolveStateIds(
    pendingChanges: PendingChange[],
    logData: {
      assessmentRequestCurrentStateId?: string | null;
      assessmentRequestNextStateId?: string | null;
      assessmentLayerCurrentStateId?: string | null;
      assessmentLayerNextStateId?: string | null;
    },
  ) {
    const latestPendingChangeWithValue = <K extends keyof PendingChange>(
      field: K,
    ) => {
      for (let i = pendingChanges.length - 1; i >= 0; i--) {
        const value = pendingChanges[i][field];
        if (value !== null && value !== undefined) {
          return value as string;
        }
      }
      return null;
    };

    return {
      assessmentRequestCurrentStateId:
        logData.assessmentRequestCurrentStateId !== undefined
          ? logData.assessmentRequestCurrentStateId
          : latestPendingChangeWithValue('assessmentRequestCurrentStateId'),
      assessmentRequestNextStateId:
        logData.assessmentRequestNextStateId !== undefined
          ? logData.assessmentRequestNextStateId
          : latestPendingChangeWithValue('assessmentRequestNextStateId'),
      assessmentLayerCurrentStateId:
        logData.assessmentLayerCurrentStateId !== undefined
          ? logData.assessmentLayerCurrentStateId
          : latestPendingChangeWithValue('assessmentLayerCurrentStateId'),
      assessmentLayerNextStateId:
        logData.assessmentLayerNextStateId !== undefined
          ? logData.assessmentLayerNextStateId
          : latestPendingChangeWithValue('assessmentLayerNextStateId'),
    };
  }

  /**
   * Gets the configuration for resolving fields based on entity type.
   */
  private getConfigForEntity(
    entityType: 'request' | 'layer' | 'testcase' | 'spec' | 'remediate',
  ): ChangelogConfig {
    switch (entityType) {
      case 'request':
        return this.changelogConfigFactory.getAssessmentRequestConfig();
      case 'layer':
        return this.changelogConfigFactory.getAssessmentLayerConfig();
      case 'testcase':
        return this.changelogConfigFactory.getTestcaseContentConfig();
      case 'spec':
        return this.changelogConfigFactory.getRequestSpecContentConfig();
      case 'remediate':
        return this.changelogConfigFactory.getTestcaseRemediateConfig();
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Cleans up old flushed pending changes.
   */
  async cleanupFlushedChanges(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.pendingChangeRepo.delete({
      isFlushed: true,
      createdAt: LessThan(cutoffDate),
    });

    const deletedCount = result.affected || 0;
    this.logger.log(
      `Cleaned up ${deletedCount} flushed pending changes older than ${olderThanDays} days`,
    );
    return deletedCount;
  }
}
