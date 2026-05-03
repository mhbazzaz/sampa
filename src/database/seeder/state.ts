import { NotFoundException } from '@nestjs/common';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { State } from 'src/states/entities/state.entity';
import { DataSource } from 'typeorm';

export const states: {
  id?: string;
  name: string;
  nameFa: string;
  processName: string;
  order?: number;
}[] = [
  // Assessment Request States
  {
    id: 'b83ee177-0af1-4525-b606-b5c9c5dc2482',
    name: 'initiated',
    nameFa: 'ایجاد درخواست',
    processName: ProcessEnum.AssessmentRequest,
    order: 1,
  },
  {
    name: 'draft',
    nameFa: 'پیش نویس',
    processName: ProcessEnum.AssessmentRequest,
    order: 2,
  },
  {
    name: 'submitted',
    nameFa: 'ثبت شده',
    processName: ProcessEnum.AssessmentRequest,
    order: 3,
  },
  {
    name: 'approved',
    nameFa: 'تأیید شده',
    processName: ProcessEnum.AssessmentRequest,
    order: 4,
  },
  {
    name: 'accepted',
    nameFa: 'پذیرفته شده در امنیت',
    processName: ProcessEnum.AssessmentRequest,
    order: 5,
  },
  {
    name: 'awaitingSpecs',
    nameFa: 'در انتظار تکمیل پیش نیازهای ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    order: 6,
  },
  {
    name: 'preEvaluation',
    nameFa: 'پیش ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    order: 7,
  },
  {
    name: 'onboarding',
    nameFa: 'آماده برگزاری جلسه شناخت',
    processName: ProcessEnum.AssessmentRequest,
    order: 8,
  },
  {
    name: 'underAnalysis',
    nameFa: 'در حال ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    order: 9,
  },
  {
    name: 'statusReported',
    nameFa: 'جمع بندی نتایج ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
    order: 10,
  },
  {
    name: 'closed',
    nameFa: 'اختتام یافته',
    processName: ProcessEnum.AssessmentRequest,
    order: 11,
  },
  {
    name: 'reportIssued',
    nameFa: 'انتشار گزارش ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'supervised',
    nameFa: 'ناظر تعیین شده',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'groupReady',
    nameFa: 'آمادگی گروه ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'pendingLayerSpecs',
    nameFa: 'در انتظار تکمیل پیش نیازهای ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'layerAssessmentCompleted',
    nameFa: 'تکمیل ارزیابی لایه',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'pendingLayerTestcases',
    nameFa: 'در انتظار تکمیل تست های ارزیابی',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'remediateVulnerabilities',
    nameFa: 'رفع آسیب پذیری ها',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'reviewRemediates',
    nameFa: 'بررسی رفع آسیب پذیری ها',
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: 'reEvaluationRequested',
    nameFa: 'درخواست ارزیابی مجدد',
    processName: ProcessEnum.AssessmentRequest,
  },

  // Assessment Layer States
  {
    name: 'initiated',
    id: '300fec67-95ce-4bc3-9bcf-8c3b6c6c3d06',
    nameFa: 'ایجاد لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 1,
  },
  {
    name: 'approved',
    nameFa: 'تأیید شده',
    processName: ProcessEnum.AssessmentLayer,
    order: 2,
  },
  {
    name: 'supervised',
    nameFa: 'ناظر تعیین شده',
    processName: ProcessEnum.AssessmentLayer,
    order: 3,
  },
  {
    name: 'groupReady',
    nameFa: 'آمادگی گروه ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 4,
  },
  {
    name: 'pendingLayerSpecs',
    nameFa: 'در انتظار تکمیل پیش نیازهای ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 5,
  },
  {
    name: 'layerSpecPreEvaluation',
    nameFa: 'در انتظار بررسی پیش نیازهای ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 6,
  },
  {
    name: 'layerSpecOnboarding',
    nameFa: 'تایید ارزیابی پیش نیاز های لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 7,
  },
  {
    name: 'pendingLayerTestcases',
    nameFa: 'در انتظار تکمیل تست های ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 8,
  },
  {
    name: 'layerAssessmentCompleted',
    nameFa: 'تکمیل ارزیابی لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 9,
  },
  {
    name: 'layerAssessmentReview',
    nameFa: 'بررسی نهایی لایه ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 10,
  },
  {
    name: 'layerReportIssued',
    nameFa: 'انتشار گزارش لایه ارزیابی',
    processName: ProcessEnum.AssessmentLayer,
    order: 11,
  },
  {
    name: 'remediateLayerVulnerabilities',
    nameFa: 'رفع آسیب پذیری های لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 12,
  },
  {
    name: 'reviewLayerRemediates',
    nameFa: 'بررسی رفع آسیب پذیری های لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 13,
  },
  {
    name: 'layerReEvaluationRequested',
    nameFa: 'درخواست ارزیابی مجدد لایه',
    processName: ProcessEnum.AssessmentLayer,
    order: 14,
  },

  {
    name: 'layerAssessmentFulfilled',
    nameFa: 'ارزیابی لایه تحقق یافته',
    processName: ProcessEnum.AssessmentLayer,
    order: 15,
  },
  {
    name: 'layerClosure',
    nameFa: 'بسته',
    processName: ProcessEnum.AssessmentLayer,
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
