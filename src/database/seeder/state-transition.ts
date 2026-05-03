import { NotFoundException } from '@nestjs/common';
import { Action } from 'src/action/entities/action.entity';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { StateTransition } from 'src/state-transition/entities/state-transition.entity';
import { State } from 'src/states/entities/state.entity';
import { DataSource } from 'typeorm';

const stateTransitions: {
  process: string;
  currentState: string;
  nextState: string;
  action: string;
}[] = [
  // Assessment Request Process Transitions
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'initiated',
    nextState: 'draft',
    action: ActionEnum.InitiatedSave,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'initiated',
    nextState: 'submitted',
    action: ActionEnum.InitiatedRegister,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'draft',
    nextState: 'submitted',
    action: ActionEnum.DraftRegister,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'draft',
    nextState: 'draft', // self-loop
    action: ActionEnum.DraftModify,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'submitted',
    nextState: 'approved',
    action: ActionEnum.SubmittedApprove,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'submitted',
    nextState: 'draft',
    action: ActionEnum.SubmittedDecline,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'submitted',
    nextState: 'submitted', // self-loop
    action: ActionEnum.SubmittedModify,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'approved',
    nextState: 'accepted',
    action: ActionEnum.ApprovedAccept,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'approved',
    nextState: 'submitted',
    action: ActionEnum.ApprovedDisapprove,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'approved',
    nextState: 'approved', // self-loop
    action: ActionEnum.ApprovedModify,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'accepted',
    nextState: 'awaitingSpecs',
    action: ActionEnum.AcceptedArrangeTeam,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'accepted',
    nextState: 'approved',
    action: ActionEnum.AcceptedReconsider,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'awaitingSpecs',
    nextState: 'preEvaluation',
    action: ActionEnum.AwaitingSpecsProvideSpecs,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'preEvaluation',
    nextState: 'onboarding',
    action: ActionEnum.PreEvaluationAccept,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'preEvaluation',
    nextState: 'awaitingSpecs',
    action: ActionEnum.PreEvaluationReject,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'onboarding',
    nextState: 'underAnalysis',
    action: ActionEnum.OnboardingFinalizeSpecs,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'underAnalysis',
    nextState: 'statusReported',
    action: ActionEnum.UnderAnalysisWrapUp,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'statusReported',
    nextState: 'closed',
    action: ActionEnum.StatusReportedFinalize,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'statusReported',
    nextState: 'underAnalysis',
    action: ActionEnum.StatusReportedNeedChanges,
  },
  {
    process: ProcessEnum.AssessmentRequest,
    currentState: 'closed',
    nextState: 'statusReported',
    action: ActionEnum.ClosedReopen,
  },

  // Assessment Layer Process Transitions
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'initiated',
    nextState: 'approved',
    action: ActionEnum.InitiatedRegister,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'approved',
    nextState: 'supervised',
    action: ActionEnum.ApprovedAssignSupervisor,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'supervised',
    nextState: 'supervised', // self-loop
    action: ActionEnum.SupervisedAssignSupervisor,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'supervised',
    nextState: 'groupReady',
    action: ActionEnum.SupervisedAssignOwnTeamAuditors,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'supervised',
    nextState: 'groupReady',
    action: ActionEnum.SupervisedAssignAllTeamsAuditors,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'groupReady',
    nextState: 'groupReady',
    action: ActionEnum.GroupReadyAssignAuditor,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'groupReady',
    nextState: 'pendingLayerSpecs',
    action: ActionEnum.GroupReadyReferApplicant,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'groupReady',
    nextState: 'groupReady', // self-loop
    action: ActionEnum.GroupReadyAssignAuditor,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'pendingLayerSpecs',
    nextState: 'layerSpecPreEvaluation',
    action: ActionEnum.PendingLayerSpecsSubmit,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerSpecPreEvaluation',
    nextState: 'pendingLayerSpecs',
    action: ActionEnum.LayerSpecPreEvaluationNeedModifications,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerSpecPreEvaluation',
    nextState: 'layerSpecOnboarding',
    action: ActionEnum.LayerSpecPreEvaluationAccept,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerSpecOnboarding',
    nextState: 'pendingLayerTestcases',
    action: ActionEnum.LayerSpecOnboardingAccept,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'pendingLayerTestcases',
    nextState: 'layerAssessmentCompleted',
    action: ActionEnum.PendingLayerTestcasesSubmit,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerAssessmentCompleted',
    nextState: 'layerAssessmentReview',
    action: ActionEnum.LayerAssessmentCompletedAccept,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerAssessmentCompleted',
    nextState: 'pendingLayerTestcases',
    action: ActionEnum.LayerAssessmentCompletedFeedback,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerAssessmentReview',
    nextState: 'layerReportIssued',
    action: ActionEnum.LayerAssessmentReviewAccept,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerAssessmentReview',
    nextState: 'layerAssessmentCompleted',
    action: ActionEnum.LayerAssessmentReviewNeedModifications,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerAssessmentReview',
    nextState: 'layerAssessmentFulfilled',
    action: ActionEnum.LayerAssessmentReviewFinish,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerAssessmentFulfilled',
    nextState: 'layerAssessmentReview',
    action: ActionEnum.LayerAssessmentFulfilledReinstate,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerReportIssued',
    nextState: 'remediateLayerVulnerabilities',
    action: ActionEnum.LayerReportIssuedRefer,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerReportIssued',
    nextState: 'layerAssessmentReview',
    action: ActionEnum.LayerReportIssuedRemark,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'remediateLayerVulnerabilities',
    nextState: 'reviewLayerRemediates',
    action: ActionEnum.RemediateLayerVulnerabilitiesFinalize,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'remediateLayerVulnerabilities',
    nextState: 'layerReportIssued',
    action: ActionEnum.RemediateLayerVulnerabilitiesDecline,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'reviewLayerRemediates',
    nextState: 'layerReEvaluationRequested',
    action: ActionEnum.ReviewLayerRemediatesApprove,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'reviewLayerRemediates',
    nextState: 'remediateLayerVulnerabilities',
    action: ActionEnum.ReviewLayerRemediatesReject,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerReEvaluationRequested',
    nextState: 'pendingLayerTestcases',
    action: ActionEnum.LayerReEvaluationRequestedAccept,
  },
  {
    process: ProcessEnum.AssessmentLayer,
    currentState: 'layerReEvaluationRequested',
    nextState: 'reviewLayerRemediates',
    action: ActionEnum.LayerReEvaluationRequestedReject,
  },
];

export const stateTransitionSeeder = async (datasource: DataSource) => {
  const oldStateTransitions = await datasource
    .getRepository(StateTransition)
    .find({
      relations: {
        action: true,
        currentState: true,
        nextState: true,
        process: true,
      },
    });
  for (let i = 0; i < oldStateTransitions.length; i++) {
    const element = oldStateTransitions[i];
    const fi = stateTransitions.findIndex(
      (stateTransition) =>
        stateTransition.action === element.action?.name &&
        stateTransition.currentState === element.currentState?.name &&
        stateTransition.nextState === element.nextState?.name &&
        stateTransition.process === element.process?.name,
    );
    if (fi === -1) {
      try {
        await datasource.getRepository(StateTransition).remove(element);
      } catch (error) {
        console.log("couldn't delete", error);
      }
    }
  }
  for (let i = 0; i < stateTransitions.length; i++) {
    const element = stateTransitions[i];
    const currentState = await datasource.getRepository(State).findOne({
      where: {
        name: element.currentState,
        process: { name: element.process },
      },
    });
    if (!currentState) {
      console.log(element.currentState, element.process);
      throw new NotFoundException('currentState');
    }

    const nextState = await datasource.getRepository(State).findOne({
      where: { name: element.nextState, process: { name: element.process } },
    });
    if (!nextState) {
      console.log(element.nextState, element.process);
      throw new NotFoundException('nextState');
    }

    const process = await datasource
      .getRepository(Process)
      .findOne({ where: { name: element.process } });
    if (!process) {
      console.log(element.process);
      throw new NotFoundException('process');
    }

    const action = await datasource
      .getRepository(Action)
      .findOne({ where: { name: element.action, processId: process.id } });
    if (!action) {
      console.log(element.action);
      throw new NotFoundException('action');
    }

    const record = await datasource.getRepository(StateTransition).findOne({
      where: {
        currentStateId: currentState.id,
        nextStateId: nextState.id,
        processId: process.id,
        actionId: action.id,
      },
    });

    if (record) {
      continue;
    }

    const stateTransition = new StateTransition({});
    stateTransition.currentStateId = currentState.id;
    stateTransition.nextStateId = nextState.id;
    stateTransition.processId = process.id;
    stateTransition.actionId = action.id;
    datasource.getRepository(StateTransition).save(stateTransition);
  }

  return true;
};
