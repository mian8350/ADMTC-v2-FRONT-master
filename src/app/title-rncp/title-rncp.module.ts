import { TitleTaskBuilderTaskDocumentExpectedDialogComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-dialogs/title-task-builder-task-document-expected-dialog/title-task-builder-task-document-expected-dialog.component';
import { TitleTaskBuilderTaskAttachmentDialogComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-dialogs/title-task-builder-task-attachment-dialog/title-task-builder-task-attachment-dialog.component';
import { TitleTaskBuilderTaskPreviewComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-preview/title-task-builder-task-preview.component';
import { TitleTaskBuilderTaskNotificationMessageComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-notification-message/title-task-builder-task-notification-message.component';
import { TitleTaskBuilderTaskParameterComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-parameter/title-task-builder-task-parameter.component';
import { TitleTaskBuilderTaskDetailComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-detail/title-task-builder-task-detail.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { TitleRNCPRoutingModule } from './title-rncp-routing.module';
import { TitleRNCPComponent } from './title-rncp/title-rncp.component';
import { ClassComponent } from './class/class.component';
import { DocumentsComponent } from './documents/documents.component';
import { ConditionsComponent } from './conditions/conditions.component';
import { ConditionForAwardComponent } from './conditions/condition-for-award/condition-for-award.component';
import { JuryDecisionParameterComponent } from './conditions/jury-decision-parameter/jury-decision-parameter.component';
import { AddPassFailDialogComponent } from './conditions/jury-decision-parameter/add-pass-fail-dialog/add-pass-fail-dialog.component';
import { PdfViewComponent } from './conditions/jury-decision-parameter/pdf-view/pdf-view.component';
import { AddExpertiseDialogComponent } from './conditions/condition-for-award/add-expertise-dialog/add-expertise-dialog.component';
import { ConditionPreviewComponent } from './conditions/condition-for-award/condition-preview/condition-preview.component';
import { TitleRncpDetailsComponent } from './title-rncp-details/title-rncp-details.component';
import { CreateClassDialogComponent } from './class/create-class-dialog/create-class-dialog.component';
import { DuplicateConditionDialogComponent } from './conditions/condition-for-award/duplicate-condition-dialog/duplicate-condition-dialog.component';
import { DocumentDialogComponent } from './document-dialog/document-dialog.component';
import { ClassParameterComponent } from './conditions/class-parameter/class-parameter.component';
import { JuryOrganizationParameterComponent } from './conditions/jury-organization-parameter/jury-organization-parameter.component';
import { CertificationRuleComponent } from './conditions/certification-rule/certification-rule.component';
import { TitleIdentityComponent } from './title-identity/title-identity.component';
import { TextDialogModule } from 'app/text-dialog/text-dialog.module';
import { TextDialogComponent } from 'app/text-dialog/text-dialog.component';
import { UploadDocumentModule } from 'app/upload-document/upload-document.module';
import { UploadDocumentComponent } from 'app/upload-document/upload-document.component';
import { FinalTranscriptParameterComponent } from './conditions/final-transcript-parameter/final-transcript-parameter.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { TitleRncpCreateComponent } from './title-rncp-create/title-rncp-create.component';
import { CreateTitleIdentityComponent } from './title-rncp-create/create-title-identity/create-title-identity.component';
import { TitleCardComponent } from './title-rncp/title-card/title-card.component';
import { ClassConditionComponent } from './conditions/class-condition/class-condition.component';
import { FirstStepEvaTypeComponent } from './conditions/class-condition/first-step-eva-type/first-step-eva-type.component';
import { SecondStepScoreComponent } from './conditions/class-condition/score/second-step-score/second-step-score.component';
import { SecondStepExpertiseComponent } from './conditions/class-condition/expertise/second-step-expertise/second-step-expertise.component';
import { ConditionScorePreviewComponent } from './conditions/class-condition/score/second-step-score/condition-score-preview/condition-score-preview.component';
import { BlockCompetencyDialogComponent } from './conditions/class-condition/expertise/second-step-expertise/popup/block-competency-dialog/block-competency-dialog.component';
import { CompetencyDialogComponent } from './conditions/class-condition/expertise/second-step-expertise/popup/competency-dialog/competency-dialog.component';
import { CriteriaEvaluationDialogComponent } from './conditions/class-condition/expertise/second-step-expertise/popup/criteria-evaluation-dialog/criteria-evaluation-dialog.component';
import { ThirdStepExpertiseComponent } from './conditions/class-condition/expertise/third-step-expertise/third-step-expertise.component';
import { FourthStepExpertiseComponent } from './conditions/class-condition/expertise/fourth-step-expertise/fourth-step-expertise.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddEditPhraseDialogComponent } from './conditions/class-condition/expertise/add-edit-phrase-dialog.component';
import { AddBlockConditionDialogComponent } from './conditions/class-condition/expertise/add-block-condition-dialog/add-block-condition-dialog.component';
import { ImportTemplateEvalCompetenceDialogComponent } from './conditions/class-condition/expertise/import-template-eval-competence-dialog/import-template-eval-competence-dialog.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ClassEmployabilitySurveyTabComponent } from './conditions/class-parameter/class-employability-survey-tab/class-employability-survey-tab.component';
import { ClassJobDescTabComponent } from './conditions/class-parameter/class-job-desc-tab/class-job-desc-tab.component';
import { ClassProblematicTabComponent } from './conditions/class-parameter/class-problematic-tab/class-problematic-tab.component';
import { ThirdStepScoreComponent } from './conditions/class-condition/score/third-step-score/third-step-score.component';
import { FifthSugestedQuestionComponent } from './conditions/class-condition/expertise/fifth-sugested-question/fifth-sugested-question.component';
import { QuestionDialogComponent } from './conditions/class-condition/expertise/fifth-sugested-question/popup/question-dialog/question-dialog.component';
import { PreviewCertificationRuleDialogComponent } from './conditions/certification-rule/preview-certification-rule-dialog/preview-certification-rule-dialog.component';
import { UploadQuestionDialogComponent } from './conditions/class-condition/expertise/fifth-sugested-question/popup/upload-question-dialog/upload-question-dialog.component';
import { SixthStepExpertiseComponent } from './conditions/class-condition/expertise/sixth-step-expertise/sixth-step-expertise.component';
import { ClassAdmissionTabComponent } from './conditions/class-parameter/class-admission-tab/class-admission-tab.component';
import { UsertypeClassDuplicationComponent } from './conditions/usertype-class-duplication/usertype-class-duplication.component';
import { OriginClassSelectionComponent } from './conditions/usertype-class-duplication/origin-class-selection/origin-class-selection.component';
import { SchoolConnectionTableComponent } from './conditions/usertype-class-duplication/school-connection-table/school-connection-table.component';
import { UsertypeConnectionTableComponent } from './conditions/usertype-class-duplication/usertype-connection-table/usertype-connection-table.component';
import { ClassQualityFormTabComponent } from './conditions/class-parameter/class-quality-form-tab/class-quality-form-tab.component';
import { MessagesDetailsComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-notification-message/messages-details/messages-details.component';
import { NotificationDetailsComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-notification-message/notification-details/notification-details.component';
import { NotificationMessageTableComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-notification-message/notification-message-table/notification-message-table.component';
import { NotificationMessagesKeysTableComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-task-notification-message/notification-messages-keys-table/notification-messages-keys-table.component';
import { TitleManagerTasksComponent } from './conditions/title-manager-tasks/title-manager-tasks.component';
import { TitleAutoGeneratedTaskComponent } from './conditions/title-manager-tasks/title-auto-generated-task/title-auto-generated-task.component';
import { TitleTaskBuilderParentComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-parent.component';
import { TitlePreviewGeneratedTasksComponent } from './conditions/title-manager-tasks/title-preview-generated-tasks/title-preview-generated-tasks.component';
import { TaskManagerSetupDialogComponent } from './conditions/title-manager-tasks/title-auto-generated-task/task-manager-setup-dialog/task-manager-setup-dialog.component';
import { ChangeDueDateTaskDialogComponent } from 'app/shared/components/change-due-date-task-dialog/change-due-date-task-dialog.component';
import { ClassTitleGovRegistrationTabComponent } from './conditions/class-parameter/class-title-gov-registration-tab/class-title-gov-registration-tab.component';
import { PcCertificationTabsComponent } from './conditions/class-parameter/pc-certification-tabs/pc-certification-tabs.component';
import { SendCertificationRuleToSchoolDialogComponent } from './conditions/class-parameter/pc-certification-tabs/send-certification-rule-to-school-dialog/send-certification-rule-to-school-dialog.component';
import { PcCertificationParameterComponent } from './conditions/class-parameter/pc-certification-tabs/pc-certification-parameter/pc-certification-parameter.component';
import { PcCertificationResultComponent } from './conditions/class-parameter/pc-certification-tabs/pc-certification-result/pc-certification-result.component';
import { ClassTitleGovRegistrationGeneratedTabComponent } from './conditions/class-parameter/class-title-gov-registration-tab/class-title-gov-registration-generated-tab/class-title-gov-registration-generated-tab.component';
import { ClassTitleGovRegistrationGenerationTabComponent } from './conditions/class-parameter/class-title-gov-registration-tab/class-title-gov-registration-generation-tab/class-title-gov-registration-generation-tab.component';

@NgModule({
    declarations: [
        TitleRNCPComponent,
        ClassComponent,
        DocumentsComponent,
        ConditionsComponent,
        ConditionForAwardComponent,
        JuryDecisionParameterComponent,
        AddPassFailDialogComponent,
        PdfViewComponent,
        AddExpertiseDialogComponent,
        ConditionPreviewComponent,
        TitleRncpDetailsComponent,
        CreateClassDialogComponent,
        DocumentDialogComponent,
        ClassParameterComponent,
        JuryOrganizationParameterComponent,
        CertificationRuleComponent,
        DuplicateConditionDialogComponent,
        TitleIdentityComponent,
        TitleIdentityComponent,
        FinalTranscriptParameterComponent,
        TitleRncpCreateComponent,
        CreateTitleIdentityComponent,
        TitleCardComponent,
        ClassConditionComponent,
        FirstStepEvaTypeComponent,
        SecondStepScoreComponent,
        SecondStepExpertiseComponent,
        ConditionScorePreviewComponent,
        BlockCompetencyDialogComponent,
        CompetencyDialogComponent,
        CriteriaEvaluationDialogComponent,
        ThirdStepExpertiseComponent,
        FourthStepExpertiseComponent,
        AddEditPhraseDialogComponent,
        AddBlockConditionDialogComponent,
        ImportTemplateEvalCompetenceDialogComponent,
        ClassEmployabilitySurveyTabComponent,
        ClassJobDescTabComponent,
        ClassProblematicTabComponent,
        ThirdStepScoreComponent,
        PreviewCertificationRuleDialogComponent,
        FifthSugestedQuestionComponent,
        QuestionDialogComponent,
        UploadQuestionDialogComponent,
        SixthStepExpertiseComponent,
        ClassAdmissionTabComponent,
        UsertypeClassDuplicationComponent,
        OriginClassSelectionComponent,
        SchoolConnectionTableComponent,
        UsertypeConnectionTableComponent,
        ClassQualityFormTabComponent,
        TitleManagerTasksComponent,
        TitleAutoGeneratedTaskComponent,
        TitleTaskBuilderParentComponent,
        TitleTaskBuilderTaskDetailComponent,
        TitleTaskBuilderTaskParameterComponent,
        TitleTaskBuilderTaskNotificationMessageComponent,
        TitleTaskBuilderTaskPreviewComponent,
        TitleTaskBuilderTaskAttachmentDialogComponent,
        TitleTaskBuilderTaskDocumentExpectedDialogComponent,
        TitlePreviewGeneratedTasksComponent,
        MessagesDetailsComponent,
        NotificationDetailsComponent,
        NotificationMessageTableComponent,
        NotificationMessagesKeysTableComponent,
        TaskManagerSetupDialogComponent,
        ClassTitleGovRegistrationTabComponent,
        PcCertificationTabsComponent,
        SendCertificationRuleToSchoolDialogComponent,
        PcCertificationParameterComponent,
        PcCertificationResultComponent,
        ClassTitleGovRegistrationGeneratedTabComponent,
        ClassTitleGovRegistrationGenerationTabComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        TitleRNCPRoutingModule,
        TextDialogModule,
        UploadDocumentModule,
        CKEditorModule,
        NgSelectModule,
        SweetAlert2Module.forRoot(),
        NgxMaterialTimepickerModule,
    ]
})
export class TitleRNCPModule {}
