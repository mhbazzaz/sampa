import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as sanitizeHtml from 'sanitize-html';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { FindOptionsWhere } from 'typeorm';
import { CreateTestcaseItemDto } from '../dto/input/create-test-case-item.dto';
import { FindFilteredTestcaseItemQueryDto } from '../dto/input/find-filtered-test-case-item.dto';
import { UpdateTestcaseItemDto } from '../dto/input/update-test-case-item.dto';
import { TestcaseItem } from '../entities/testcase-item.entity';
import { TestcaseItemRepository } from '../repositories/testcase-item.repository';

const sanitizeConfig = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'data'],
};

@Injectable()
export class TestcaseItemService {
  constructor(
    private readonly testcaseItemRepository: TestcaseItemRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateTestcaseItemDto): Promise<TestcaseItem> {
    const cleanProvesDefault = sanitizeHtml(
      data.provesDefault || '',
      sanitizeConfig,
    );
    const cleanSuggestionDefault = sanitizeHtml(
      data.suggestionDefault || '',
      sanitizeConfig,
    );

    return await this.testcaseItemRepository.createTransactional({
      ...data,
      provesDefault: cleanProvesDefault,
      suggestionDefault: cleanSuggestionDefault,
    });
  }

  //------------------------------
  async findOne(id: string): Promise<TestcaseItem | null> {
    return await this.testcaseItemRepository.findOneWithEnabledRelations(id);
  }

  //------------------------------
  async findAll() {
    return await this.testcaseItemRepository.findAllWithEnabledRelations();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<TestcaseItem>,
    updatePayload: UpdateTestcaseItemDto,
  ): Promise<TestcaseItem | null> {
    if (updatePayload.provesDefault) {
      updatePayload.provesDefault = sanitizeHtml(
        updatePayload.provesDefault,
        sanitizeConfig,
      );
    }
    if (updatePayload.suggestionDefault) {
      updatePayload.suggestionDefault = sanitizeHtml(
        updatePayload.suggestionDefault,
        sanitizeConfig,
      );
    }

    return await this.testcaseItemRepository.updateTransactional(
      data,
      updatePayload,
    );
  }

  //------------------------------
  async getFilteredTestcaseItems(query: FindFilteredTestcaseItemQueryDto) {
    return await this.testcaseItemRepository.getFilteredTestcaseItems(query);
  }

  //------------------------------
  async findAllPagination(query: PaginationDto) {
    return await this.testcaseItemRepository.findAllPagination(
      query.skip,
      query.take,
      {
        relations: {
          testcaseGroup: {
            assessmentType: true,
          },
          testcaseContents: true,
          assetTestCases: {
            assetType: true,
          },
          environments: true,
        },
        order: { createdAt: 'DESC' },
      },
    );
  }

  //------------------------------
  async remove(id: string) {
    const relations = [];
    const row = await this.testcaseItemRepository.findOne({
      where: { id },
      relations: { testcaseContents: true },
    });

    if (!row) {
      throw new NotFoundException();
    }

    if (row.testcaseContents && row.testcaseContents.length > 0) {
      relations.push(this.i18nService.t('objects.test case content'));
    }

    if (relations.length > 0) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_HAS_RELATION', {
          args: {
            property: relations.join(` ${this.i18nService.t('objects.and')} `),
          },
        }),
      );
    }

    return await this.testcaseItemRepository.findAndDelete({ id });
  }
}
