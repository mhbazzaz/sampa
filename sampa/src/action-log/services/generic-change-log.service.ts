import { Injectable } from '@nestjs/common';
import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';
import { ChangelogConfig } from 'src/common/interfaces/change-log-config.interface';
import { ChangeLog } from 'src/common/interfaces/change-log.interface';
import { In, Repository } from 'typeorm';

@Injectable()
export class GenericChangelogService {
  //------------------------------
  async buildAndEnrichChangeLog<T extends Record<string, any>>(
    beforeEntity: T,
    updateDto: Partial<T>,
    config: ChangelogConfig,
    entityType?: EntityTypeEnum,
  ): Promise<ChangeLog[]> {
    const changes = this.buildChangeLog(
      beforeEntity,
      updateDto,
      config.trackedFields,
      entityType,
    );
    return this.enrichChangesWithDisplayValues(changes, config);
  }

  //------------------------------
  private buildChangeLog<T extends Record<string, any>>(
    beforeEntity: T,
    updateDto: Partial<T>,
    trackedFields: string[],
    entityType?: EntityTypeEnum,
  ): ChangeLog[] {
    const changes: ChangeLog[] = [];

    for (const field of trackedFields) {
      const oldVal = beforeEntity[field];
      const newVal = updateDto[field];

      if (newVal === undefined || oldVal === newVal) continue;

      changes.push({
        entityType,
        updateData: field,
        oldValue: oldVal,
        newValue: newVal,
        oldDisplayValue: null,
        newDisplayValue: null,
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

        if (Array.isArray(change.oldValue)) {
          change.oldValue.forEach((id) => group.ids.add(id));
        } else if (change.oldValue) {
          group.ids.add(change.oldValue);
        }

        if (Array.isArray(change.newValue)) {
          change.newValue.forEach((id) => group.ids.add(id));
        } else if (change.newValue) {
          group.ids.add(change.newValue);
        }
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

          const entities = await repository.find({
            where: { id: In(Array.from(group.ids)) } as any,
          });
          const entityMap = new Map(entities.map((e: any) => [e.id, e]));

          for (const change of group.changes) {
            if (Array.isArray(change.oldValue)) {
              change.oldDisplayValue = change.oldValue
                .map((id) => {
                  const entity = entityMap.get(id);
                  return entity?.[group.labelField] ?? null;
                })
                .filter(Boolean);
            } else {
              const oldEntity: any = change.oldValue
                ? entityMap.get(change.oldValue)
                : null;
              change.oldDisplayValue = oldEntity?.[group.labelField] ?? null;
            }

            if (Array.isArray(change.newValue)) {
              change.newDisplayValue = change.newValue
                .map((id) => {
                  const entity = entityMap.get(id);
                  return entity?.[group.labelField] ?? null;
                })
                .filter(Boolean);
            } else {
              const newEntity: any = change.newValue
                ? entityMap.get(change.newValue)
                : null;
              change.newDisplayValue = newEntity?.[group.labelField] ?? null;
            }
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
