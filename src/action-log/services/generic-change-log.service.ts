import { Injectable } from '@nestjs/common';
import { ChangelogConfig } from 'src/common/interfaces/change-log-config.interface';
import { ChangeLog } from 'src/common/interfaces/change-log.interface';
import { Repository } from 'typeorm';

@Injectable()
export class GenericChangelogService {
  //------------------------------
  async buildAndEnrichChangeLog<T extends Record<string, any>>(
    beforeEntity: T,
    updateDto: Partial<T>,
    config: ChangelogConfig,
  ): Promise<ChangeLog[]> {
    const changes = this.buildChangeLog(
      beforeEntity,
      updateDto,
      config.trackedFields,
    );
    return this.enrichChangesWithDisplayValues(changes, config);
  }

  //------------------------------
  private buildChangeLog<T extends Record<string, any>>(
    beforeEntity: T,
    updateDto: Partial<T>,
    trackedFields: string[],
  ): ChangeLog[] {
    const changes: ChangeLog[] = [];

    for (const field of trackedFields) {
      const oldVal = beforeEntity[field];
      const newVal = updateDto[field];

      if (newVal === undefined || oldVal === newVal) continue;

      changes.push({
        updateData: field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }

    return changes;
  }

  //------------------------------
  private async enrichChangesWithDisplayValues(
    changes: ChangeLog[],
    config: ChangelogConfig,
  ): Promise<ChangeLog[]> {
    const repositoryChanges = new Map<
      Repository<any>,
      {
        changes: ChangeLog[];
        labelField: string;
        ids: Set<any>;
      }
    >();
    const userIds = new Set<string>();

    for (const change of changes) {
      const resolver = config.fieldResolvers[change.updateData];
      if (!resolver) continue;

      if (
        resolver.type === 'repository' &&
        resolver.repository &&
        resolver.labelField
      ) {
        if (!repositoryChanges.has(resolver.repository)) {
          repositoryChanges.set(resolver.repository, {
            changes: [],
            labelField: resolver.labelField,
            ids: new Set(),
          });
        }
        const group = repositoryChanges.get(resolver.repository)!;
        group.changes.push(change);
        if (change.oldValue) group.ids.add(change.oldValue);
        if (change.newValue) group.ids.add(change.newValue);
      }

      if (resolver.type === 'httpUser') {
        if (change.oldValue) userIds.add(change.oldValue);
        if (change.newValue) userIds.add(change.newValue);
      }
    }

    await Promise.all(
      Array.from(repositoryChanges.entries()).map(
        async ([repository, group]) => {
          if (group.ids.size === 0) return;

          const entities = await repository.findByIds(Array.from(group.ids));
          const entityMap = new Map(entities.map((e) => [e.id, e]));

          for (const change of group.changes) {
            const oldEntity = change.oldValue
              ? entityMap.get(change.oldValue)
              : null;
            const newEntity = change.newValue
              ? entityMap.get(change.newValue)
              : null;

            change.oldDisplayValue = oldEntity?.[group.labelField] ?? null;
            change.newDisplayValue = newEntity?.[group.labelField] ?? null;
          }
        },
      ),
    );

    if (userIds.size > 0 && config.fetchUsers) {
      const usersById = await config.fetchUsers(Array.from(userIds));

      for (const change of changes) {
        const resolver = config.fieldResolvers[change.updateData];
        if (resolver?.type === 'httpUser') {
          this.enrichUserField(change, usersById);
        }
      }
    }

    return changes;
  }

  //------------------------------
  private enrichUserField(
    change: ChangeLog,
    usersById: Map<string, any>,
  ): void {
    const oldUser = change.oldValue ? usersById.get(change.oldValue) : null;
    const newUser = change.newValue ? usersById.get(change.newValue) : null;

    change.oldDisplayValue = oldUser
      ? `${oldUser.firstName} ${oldUser.lastName}`
      : null;

    change.newDisplayValue = newUser
      ? `${newUser.firstName} ${newUser.lastName}`
      : null;
  }
}
