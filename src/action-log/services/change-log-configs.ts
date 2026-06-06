import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { ChangelogConfig } from 'src/common/interfaces/change-log-config.interface';
import { Environment } from 'src/environment/entities/environment.entity';
import { Member } from 'src/member/entities/member.entity';
import { RequestSpecGroup } from 'src/spec/entities/request-spec-group.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { State } from 'src/states/entities/state.entity';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';
import { TestcaseGroup } from 'src/test-case/entities/testcase-group.entity';
import { TestcaseItem } from 'src/test-case/entities/testcase-item.entity';
import { Vault } from 'src/vault/vault';
import { Repository } from 'typeorm';

@Injectable()
export class ChangelogConfigFactory {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Environment)
    private readonly environmentRepository: Repository<Environment>,
    @InjectRepository(AssessmentType)
    private readonly assessmentTypeRepository: Repository<AssessmentType>,
    @InjectRepository(TestcaseGroup)
    private readonly testcaseGroupRepository: Repository<TestcaseGroup>,
    @InjectRepository(TestcaseContent)
    private readonly testcaseContentRepository: Repository<TestcaseContent>,
    @InjectRepository(TestcaseItem)
    private readonly testcaseItemRepository: Repository<TestcaseItem>,
    @InjectRepository(RequestSpecItem)
    private readonly requestSpecItemRepository: Repository<RequestSpecItem>,
    @InjectRepository(RequestSpecGroup)
    private readonly requestSpecGroupRepository: Repository<RequestSpecGroup>,
    @InjectRepository(AssetType)
    private readonly assetTypeRepository: Repository<AssetType>,
  ) {}

  //------------------------------
  getAssessmentRequestConfig(): ChangelogConfig {
    return {
      trackedFields: [
        'requestNumber',
        'stateId',
        'applicantId',
        'applicantManagerId',
        'cisoId',
        'finalState',
        'assetToAuditBaseline',
        'environmentId',
      ],
      fieldResolvers: {
        stateId: {
          type: 'repository',
          repository: this.stateRepository,
          labelField: 'name',
        },
        applicantId: { type: 'httpUser' },
        applicantManagerId: { type: 'httpUser' },
        cisoId: { type: 'httpUser' },
        environmentId: {
          type: 'repository',
          repository: this.environmentRepository,
          labelField: 'name',
        },
      },
      fetchUsers: (userIds) => this.fetchUsersByIds(userIds),
    };
  }

  //------------------------------
  getAssessmentLayerConfig(): ChangelogConfig {
    return {
      trackedFields: [
        'stateId',
        'assessmentRequestId',
        'assessmentTypeId',
        'criticalVulnerabilitiesCount',
        'highVulnerabilitiesCount',
        'mediumVulnerabilitiesCount',
        'lowVulnerabilitiesCount',
      ],
      fieldResolvers: {
        stateId: {
          type: 'repository',
          repository: this.stateRepository,
          labelField: 'name',
        },
        assessmentTypeId: {
          type: 'repository',
          repository: this.assessmentTypeRepository,
          labelField: 'name',
        },
      },
    };
  }

  //------------------------------
  getTestcaseItemConfig(): ChangelogConfig {
    return {
      trackedFields: [
        'name',
        'nameFa',
        'objective',
        'approach',
        'methodology',
        'observationsDefault',
        'provesDefault',
        'referencesDefault',
        'suggestionDefault',
        'isMultiValue',
        'isOptional',
        'isEnabled',
        'testcaseGroupId',
      ],
      fieldResolvers: {
        testcaseGroupId: {
          type: 'repository',
          repository: this.testcaseGroupRepository,
          labelField: 'name',
        },
      },
      fetchUsers: (userIds) => this.fetchUsersByIds(userIds),
    };
  }

  //------------------------------
  getTestcaseContentConfig(): ChangelogConfig {
    return {
      trackedFields: [
        'observations',
        'proves',
        'references',
        'suggestions',
        'criticality',
        'status',
        'assessmentRequestId',
        'testcaseItemId',
      ],
      fieldResolvers: {
        testcaseItemId: {
          type: 'repository',
          repository: this.testcaseItemRepository,
          labelField: 'name',
        },
      },
      fetchUsers: (userIds) => this.fetchUsersByIds(userIds),
    };
  }

  //------------------------------
  getTestcaseRemediateConfig(): ChangelogConfig {
    return {
      trackedFields: [
        'approach',
        'testcaseContentId',
        'reason',
        'solution',
        'references',
        'dueDate',
        'memberId',
      ],
      fieldResolvers: {
        testcaseContentId: {
          type: 'repository',
          repository: this.testcaseContentRepository,
          labelField: 'id',
        },
        memberId: {
          type: 'repository',
          repository: this.memberRepository,
          labelField: 'name',
        },
      },
      fetchUsers: (userIds) => this.fetchUsersByIds(userIds),
    };
  }

  //------------------------------
  getRequestSpecContentConfig(): ChangelogConfig {
    return {
      trackedFields: ['value', 'assessmentRequestId', 'requestSpecItemId'],
      fieldResolvers: {
        requestSpecItemId: {
          type: 'repository',
          repository: this.requestSpecItemRepository,
          labelField: 'name',
        },
      },
      fetchUsers: (userIds) => this.fetchUsersByIds(userIds),
    };
  }

  //------------------------------
  getRequestSpecItemConfig(): ChangelogConfig {
    return {
      trackedFields: [
        'value',
        'isMultiValue',
        'isOptional',
        'name',
        'description',
        'requestSpecGroupId',
        'assetTypeId',
        'environmentId',
      ],
      fieldResolvers: {
        requestSpecGroupId: {
          type: 'repository',
          repository: this.requestSpecGroupRepository,
          labelField: 'name',
        },
        assetTypeId: {
          type: 'repository',
          repository: this.assetTypeRepository,
          labelField: 'name',
        },
        environmentId: {
          type: 'repository',
          repository: this.environmentRepository,
          labelField: 'name',
        },
      },
      fetchUsers: (userIds) => this.fetchUsersByIds(userIds),
    };
  }

  //------------------------------
  private async fetchUsersByIds(userIds: string[]): Promise<Map<string, any>> {
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueIds.length === 0) return new Map();

    const userMap = new Map<string, any>();

    try {
      const [IDP_SERVICE_INTERNAL_TOKEN, IDP_SERVICE_URL] = await Promise.all([
        Vault.instance.get('IDP_SERVICE_INTERNAL_TOKEN', 'share'),
        Vault.instance.get('IDP_SERVICE_URL'),
      ]);

      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const { data } = await axios.get(
              `${IDP_SERVICE_URL}/idp/api/v1/users/${id}`,
              {
                headers: {
                  'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
                },
              },
            );
            userMap.set(id, data.data);
          } catch (error) {
            console.error(`Failed to fetch user ${id}:`, error.message);
            userMap.set(id, null);
          }
        }),
      );
    } catch (error) {
      console.error('Failed to fetch vault credentials:', error);
    }

    return userMap;
  }
}
