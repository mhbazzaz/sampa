import { NotFoundException } from '@nestjs/common';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { StateSideEnum } from 'src/common/enums/state-side.enum';
import { Process } from 'src/process/entities/process.entity';
import { State } from 'src/states/entities/state.entity';
import { DataSource } from 'typeorm';

export const states: {
  id?: string;
  name: string;
  nameFa: string;
  processName: string;
  side: StateSideEnum | null;
  order?: number;
}[] = [
  // Assessment Request States
  {
    id: 'b83ee177-0af1-4525-b606-b5c9c5dc2482',
    name: 'initiated',
    nameFa: 'ایجاد درخواست',
    processName: ProcessEnum.AssessmentRequest,
    order: 1,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'draft',
    nameFa: 'پیش نویس',
    processName: ProcessEnum.AssessmentRequest,
    order: 2,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'submitted',
    nameFa: 'ثبت شده',
    processName: ProcessEnum.AssessmentRequest,
    order: 3,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'approved',
    nameFa: 'تأیید شده',
    processName: ProcessEnum.AssessmentRequest,
    order: 4,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'accepted',
    nameFa: 'پذیرفته شده در امنیت',
    processName: ProcessEnum.AssessmentRequest,
    order: 5,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'groupReady',
    nameFa: 'آمادگی گروه ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    order: 6,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'onboarding',
    nameFa: 'جلسه شناخت',
    processName: ProcessEnum.AssessmentRequest,
    order: 7,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'underAnalysis',
    nameFa: 'در حال ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    order: 8,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'statusReported',
    nameFa: 'جمع بندی نتایج ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    order: 9,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'closed',
    nameFa: 'اختتام یافته',
    processName: ProcessEnum.AssessmentRequest,
    order: 10,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'reportIssued',
    nameFa: 'انتشار گزارش ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'supervised',
    nameFa: 'ناظر تعیین شده',
    processName: ProcessEnum.AssessmentRequest,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'layerAssessmentCompleted',
    nameFa: 'تکمیل ارزیابی لایه',
    processName: ProcessEnum.AssessmentRequest,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'pendingLayerTestcases',
    nameFa: 'در انتظار تکمیل تست های ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'remediateVulnerabilities',
    nameFa: 'رفع آسیب پذیری ها',
    processName: ProcessEnum.AssessmentRequest,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'reviewRemediates',
    nameFa: 'بررسی رفع آسیب پذیری ها',
    processName: ProcessEnum.AssessmentRequest,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'reEvaluationRequested',
    nameFa: 'درخواست ارزیابی مجدد',
    processName: ProcessEnum.AssessmentRequest,
    side: StateSideEnum.Applicant,
  },

  // Assessment Layer States
  {
    name: 'initiated',
    id: '300fec67-95ce-4bc3-9bcf-8c3b6c6c3d06',
    nameFa: 'ایجاد لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 1,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'approved',
    nameFa: 'تأیید شده',
    processName: ProcessEnum.AssessmentLayer,
    order: 2,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'SAM assigned',
    nameFa: 'سرپرست تعیین شده',
    processName: ProcessEnum.AssessmentLayer,
    order: 3,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'supervised',
    nameFa: 'ناظر تعیین شده',
    processName: ProcessEnum.AssessmentLayer,
    order: 4,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'groupReady',
    nameFa: 'آمادگی گروه ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 5,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'onboarding',
    nameFa: 'جلسه شناخت',
    processName: ProcessEnum.AssessmentLayer,
    order: 6,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'layerAssessmentCompleted',
    nameFa: 'تکمیل تست های ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 7,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'layerAssessmentReviewBySAM',
    nameFa: 'بررسی ارزیابی توسط ناظر',
    processName: ProcessEnum.AssessmentLayer,
    order: 8,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'layerAssessmentReviewBySAMDone',
    nameFa: 'ارزیابی لایه توسط سرپرست تحقق یافته',
    processName: ProcessEnum.AssessmentLayer,
    order: 9,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'layerReportIssued',
    nameFa: 'انتشار گزارش لایه ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 10,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'remediateLayerVulnerabilities',
    nameFa: 'بررسی رفع آسیب پذیری های اعلام شده لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 11,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'reviewLayerRemediates',
    nameFa: 'رفع آسیب پذیری های لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 12,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'layerReEvaluationRequested',
    nameFa: 'بررسی رفع آسیب پذیری های لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 13,
    side: StateSideEnum.Applicant,
  },
  {
    name: 'layerAssessmentFulfilled',
    nameFa: 'ارزیابی لایه تحقق یافته',
    processName: ProcessEnum.AssessmentLayer,
    order: 14,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'pendingLayerTestcases',
    nameFa: 'در انتظار تکمیل تست های ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    side: StateSideEnum.Assessment,
  },
  {
    name: 'layerClosure',
    nameFa: 'بسته',
    order: 15,
    processName: ProcessEnum.AssessmentLayer,
    side: StateSideEnum.Assessment,
  },
];

export const StateSeeder = async (datasource: DataSource) => {
  const oldState = await datasource
    .getRepository(State)
    .find({ relations: { process: true } });
  for (let i = 0; i < oldState.length; i++) {
    const element = oldState[i];
    const fi = states.findIndex(
      (state) =>
        state.name === element.name &&
        state.processName === element.process?.name,
    );
    if (fi === -1) {
      try {
        await datasource.getRepository(State).remove(element);
      } catch (error) {
        console.log("couldn't delete", error);
      }
    }
  }
  for (let i = 0; i < states.length; i++) {
    const { processName, ...element } = states[i];

    const process = await datasource
      .getRepository(Process)
      .findOne({ where: { name: processName } });
    if (!process) {
      console.log(processName);
      throw new NotFoundException('process');
    }

    const record = await datasource
      .getRepository(State)
      .findOne({ where: { name: element.name, processId: process.id } });

    if (record) {
      await datasource
        .getRepository(State)
        .update({ name: element.name, processId: process.id }, element);
      continue;
    }
    const state = new State(element);

    await datasource
      .getRepository(State)
      .save({ ...state, processId: process.id });
  }

  return true;
};
