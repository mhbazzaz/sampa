import { NotFoundException } from '@nestjs/common';
import { Action } from 'src/action/entities/action.entity';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { Role } from 'src/role/entities/role.entity';
import { DataSource } from 'typeorm';

const actionsArray: {
  actionNames: { name: string; process: string }[];
  roleName: string;
}[] = [
  {
    roleName: 'applicant',
    actionNames: [
      {
        name: ActionEnum.InitiatedSave,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.InitiatedRegister,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.DraftModify,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.DraftRegister,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.AwaitingSpecsProvideSpecs,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.OnboardingFinalizeSpecs,
        process: ProcessEnum.AssessmentRequest,
      },
      // Assessment Layer actions for applicant
      {
        name: ActionEnum.GroupReadyReferApplicant,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.RemediateLayerVulnerabilitiesDecline,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.RemediateLayerVulnerabilitiesFinalize,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      { name: ActionEnum.ReadForTeam, process: ProcessEnum.AssessmentRequest },
      { name: ActionEnum.ReadForTeam, process: ProcessEnum.AssessmentLayer },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadTestCaseAfterFirstIteration,
        process: ProcessEnum.AssessmentRequest,
      },
    ],
  },
  {
    roleName: 'applicant manager',
    actionNames: [
      {
        name: ActionEnum.SubmittedApprove,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.SubmittedDecline,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.SubmittedModify,
        process: ProcessEnum.AssessmentRequest,
      },
      // Assessment Layer actions for applicant manager
      {
        name: ActionEnum.ReviewLayerRemediatesApprove,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReviewLayerRemediatesReject,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReportIssuedRefer,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReportIssuedRemark,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ApplicantManagerTeamup,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadForTeam,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadTestCaseAfterFirstIteration,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadWhereIAmManager,
        process: ProcessEnum.AssessmentRequest,
      },
    ],
  },
  {
    roleName: 'ciso',
    actionNames: [
      {
        name: ActionEnum.ApprovedAccept,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ApprovedDisapprove,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ApprovedModify,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.StatusReportedNeedChanges,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.AcceptedArrangeTeam,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.StatusReportedFinalize,
        process: ProcessEnum.AssessmentRequest,
      },
      // Assessment Layer actions for CISO
      {
        name: ActionEnum.ApprovedAssignSupervisor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.SupervisedAssignAllTeamsAuditors,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.SupervisedAssignSupervisor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GroupReadyAssignAuditor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentReviewAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentReviewNeedModifications,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentReviewFinish,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentFulfilledReinstate,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      { name: ActionEnum.Read, process: ProcessEnum.AssessmentRequest },
      { name: ActionEnum.Read, process: ProcessEnum.AssessmentLayer },
      {
        name: ActionEnum.ReadForTeam,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadMine,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadRemediate,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'ava supervisor',
    actionNames: [
      {
        name: ActionEnum.SupervisedAssignOwnTeamAuditors,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GroupReadyAssignAuditor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedReject,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedFeedback,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      { name: ActionEnum.ReadForTeam, process: ProcessEnum.AssessmentLayer },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'ava auditor',
    actionNames: [
      {
        name: ActionEnum.LayerSpecPreEvaluationNeedModifications,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecPreEvaluationAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecOnboardingAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.PendingLayerTestcasesSubmit,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadMine,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'sca supervisor',
    actionNames: [
      {
        name: ActionEnum.SupervisedAssignOwnTeamAuditors,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GroupReadyAssignAuditor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedReject,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedFeedback,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      { name: ActionEnum.ReadForTeam, process: ProcessEnum.AssessmentLayer },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'sca auditor',
    actionNames: [
      {
        name: ActionEnum.LayerSpecPreEvaluationNeedModifications,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecPreEvaluationAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecOnboardingAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.PendingLayerTestcasesSubmit,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadMine,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'csa supervisor',
    actionNames: [
      {
        name: ActionEnum.SupervisedAssignOwnTeamAuditors,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GroupReadyAssignAuditor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedReject,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedFeedback,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      { name: ActionEnum.ReadForTeam, process: ProcessEnum.AssessmentLayer },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'csa auditor',
    actionNames: [
      {
        name: ActionEnum.LayerSpecPreEvaluationNeedModifications,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecPreEvaluationAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecOnboardingAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.PendingLayerTestcasesSubmit,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadMine,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'soc supervisor',
    actionNames: [
      {
        name: ActionEnum.SupervisedAssignOwnTeamAuditors,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GroupReadyAssignAuditor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedReject,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedFeedback,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      { name: ActionEnum.ReadForTeam, process: ProcessEnum.AssessmentLayer },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'soc auditor',
    actionNames: [
      {
        name: ActionEnum.LayerSpecPreEvaluationNeedModifications,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecPreEvaluationAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecOnboardingAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.PendingLayerTestcasesSubmit,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadMine,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'pke supervisor',
    actionNames: [
      {
        name: ActionEnum.SupervisedAssignOwnTeamAuditors,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GroupReadyAssignAuditor,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerReEvaluationRequestedReject,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerAssessmentCompletedFeedback,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.CreateRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadVulnerabilityCount,
        process: ProcessEnum.AssessmentRequest,
      },
      { name: ActionEnum.ReadForTeam, process: ProcessEnum.AssessmentLayer },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'pke auditor',
    actionNames: [
      {
        name: ActionEnum.LayerSpecPreEvaluationNeedModifications,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecPreEvaluationAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.LayerSpecOnboardingAccept,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.PendingLayerTestcasesSubmit,
        process: ProcessEnum.AssessmentLayer,
      },
      // Others
      {
        name: ActionEnum.CreateTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.CreateSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetSpecComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.DeleteLayerComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRequestComment,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.GetTestCaseComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.GetRemediateComment,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadMine,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadActionLog,
        process: ProcessEnum.AssessmentRequest,
      },
      {
        name: ActionEnum.ReadSpecs,
        process: ProcessEnum.AssessmentLayer,
      },
      {
        name: ActionEnum.ReadLayersForTeam,
        process: ProcessEnum.AssessmentLayer,
      },
    ],
  },
  {
    roleName: 'pke operator',
    actionNames: [],
  },
];

export const ActionRoleSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < actionsArray.length; i++) {
    const element = actionsArray[i];
    const actions: Action[] = [];
    for (let j = 0; j < element.actionNames.length; j++) {
      const action = element.actionNames[j];

      const processRecord = await datasource
        .getRepository(Process)
        .findOne({ where: { name: action.process } });
      if (!processRecord) {
        console.log(action.process);
        throw new NotFoundException('process');
      }

      const actionRecord = await datasource
        .getRepository(Action)
        .findOne({ where: { name: action.name, processId: processRecord.id } });
      if (!actionRecord) {
        console.log(action.name, processRecord.name);
        throw new NotFoundException('actionRecord');
      }

      actions.push(actionRecord);
    }

    const roleRecord = await datasource
      .getRepository(Role)
      .findOne({ where: { name: element.roleName } });
    if (!roleRecord) {
      console.log(element.roleName);
      throw new NotFoundException('roleRecord');
    }
    roleRecord.actions = actions;

    await datasource.getRepository(Role).save(roleRecord);
  }

  return true;
};
