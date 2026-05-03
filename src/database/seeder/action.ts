import { NotFoundException } from '@nestjs/common';
import { Action } from 'src/action/entities/action.entity';
import { ActionTierEnum } from 'src/common/enums/action-tier.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { DataSource } from 'typeorm';

const actions: {
  name: string;
  tier: ActionTierEnum;
  processName: string;
}[] = [
  // Assessment Request Process Actions
  {
    name: ActionEnum.InitiatedSave,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.InitiatedRegister,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.DraftRegister,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.DraftModify,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.SubmittedApprove,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.SubmittedDecline,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.SubmittedModify,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.ApprovedAccept,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.ApprovedDisapprove,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.ApprovedModify,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.AcceptedArrangeTeam,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.AcceptedReconsider,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.AwaitingSpecsProvideSpecs,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.PreEvaluationAccept,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.PreEvaluationReject,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.OnboardingFinalizeSpecs,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.StatusReportedFinalize,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.StatusReportedNeedChanges,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.UnderAnalysisWrapUp,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.ClosedReopen,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },

  // Assessment Layer Process Actions
  {
    name: ActionEnum.InitiatedRegister,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.ApprovedAssignSupervisor,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.SupervisedAssignOwnTeamAuditors,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.SupervisedAssignAllTeamsAuditors,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.SupervisedAssignSupervisor,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.GroupReadyAssignAuditor,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.GroupReadyReferApplicant,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.PendingLayerSpecsSubmit,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.PendingLayerTestcasesSubmit,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerSpecPreEvaluationNeedModifications,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerSpecPreEvaluationAccept,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerSpecOnboardingAccept,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerAssessmentCompletedAccept,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerAssessmentCompletedFeedback,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerAssessmentReviewAccept,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerAssessmentReviewNeedModifications,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerAssessmentReviewFinish,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerReportIssuedRefer,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerReportIssuedRemark,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.RemediateLayerVulnerabilitiesDecline,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.RemediateLayerVulnerabilitiesFinalize,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.ReviewLayerRemediatesApprove,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.ReviewLayerRemediatesReject,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerReEvaluationRequestedAccept,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerReEvaluationRequestedReject,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.LayerAssessmentFulfilledReinstate,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },

  // Others
  {
    name: ActionEnum.ReadForTeam,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.ReadForTeam,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.Read,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.Read,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.ReadMine,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.ReadMine,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.ApplicantManagerTeamup,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.CreateLayerComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.CreateTestCaseComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.CreateRemediateComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.CreateRequestComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.GetRequestComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.CreateSpecComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.GetLayerComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.GetSpecComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.GetTestCaseComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.GetRemediateComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.DeleteLayerComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.DeleteRemediateComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.DeleteSpecComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.DeleteTestCaseComment,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentLayer,
  },
  {
    name: ActionEnum.ReadVulnerabilityCount,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
  {
    name: ActionEnum.ReadActionLog,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssessmentRequest,
  },
];

export const ActionSeeder = async (datasource: DataSource) => {
  const oldAction = await datasource
    .getRepository(Action)
    .find({ relations: { process: true } });
  for (let i = 0; i < oldAction.length; i++) {
    const element = oldAction[i];
    const fi = actions.findIndex(
      (action) =>
        action.name === element.name &&
        action.processName === element.process?.name &&
        action.tier === element.tier,
    );
    if (fi === -1) {
      try {
        await datasource.getRepository(Action).remove(element);
      } catch (error) {
        console.log('could not delete', error);
      }
    }
  }

  for (let i = 0; i < actions.length; i++) {
    const { processName, ...element } = actions[i];

    const process = await datasource
      .getRepository(Process)
      .findOne({ where: { name: processName } });
    if (!process) {
      console.log(processName);
      throw new NotFoundException('process');
    }

    const record = await datasource.getRepository(Action).findOne({
      where: {
        name: element.name,
        tier: element.tier,
        processId: process.id,
      },
    });

    if (record) {
      continue;
    }
    const action = new Action(element);

    await datasource
      .getRepository(Action)
      .save({ ...action, processId: process.id });
  }

  return true;
};
