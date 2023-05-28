import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormBuilderRoutingModule } from './form-builder-routing.module';
import { FormBuilderTableComponent } from './form-builder-table.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { DuplicateFormBuilderDialogComponent } from './duplicate-form-builder-dialog/duplicate-form-builder-dialog.component';
import { FormBuilderDetailTabsComponent } from './form-builder-detail-tabs/form-builder-detail-tabs.component';
import { CommonTemplateStepDetailComponent } from './form-builder-detail-tabs/common-template-step-detail/common-template-step-detail.component';
import { FormTemplateStepDetailComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-step-detail/form-template-step-detail.component';
import { AddFormStepDialogComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-step-detail/add-form-step-dialog/add-form-step-dialog.component';
import { AddFormValidatorDialogComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-step-detail/add-form-validator-dialog/add-form-validator-dialog.component';
import { QuestionFormPreviewComponent } from './form-builder-detail-tabs/question-form-preview/question-form-preview.component';
import { DocumentFormPreviewComponent } from './form-builder-detail-tabs/document-form-preview/document-form-preview.component';
import { AddSegmentFormBuilderDialogComponent } from './form-builder-detail-tabs/common-template-step-detail/add-segment-form-builder-dialog/add-segment-form-builder-dialog.component';
import { ConditionAcceptanceFormPreviewComponent } from './form-builder-detail-tabs/condition-acceptance-form-preview/condition-acceptance-form-preview.component';
import { StepDetailsTabsComponent } from './form-builder-detail-tabs/step-details-tabs/step-details-tabs.component';
import { CommonTemplateStepDetailTabComponent } from './form-builder-detail-tabs/step-details-tabs/common-template-step-detail-tab/common-template-step-detail-tab.component';
import { StepParameterTabComponent } from './form-builder-detail-tabs/step-details-tabs/step-parameter-tab/step-parameter-tab.component';
import { StepNotificationMessagesTabComponent } from './form-builder-detail-tabs/step-details-tabs/step-notification-messages-tab/step-notification-messages-tab.component';
import { MessagesDetailsComponent } from './form-builder-detail-tabs/step-details-tabs/step-notification-messages-tab/messages-details/messages-details.component';
import { NotificationDetailsComponent } from './form-builder-detail-tabs/step-details-tabs/step-notification-messages-tab/notification-details/notification-details.component';
import { NotificationMessageTableComponent } from './form-builder-detail-tabs/step-details-tabs/step-notification-messages-tab/notification-message-table/notification-message-table.component';
import { NotificationMessagesKeysTableComponent } from './form-builder-detail-tabs/step-details-tabs/step-notification-messages-tab/notification-messages-keys-table/notification-messages-keys-table.component';
import { KeyTableWindowComponent } from './form-builder-detail-tabs/key-table-window/key-table-window.component';
import { AddFormSignatoryDialogComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-step-detail/add-form-signatory-dialog/add-form-signatory-dialog.component';
import { FinalMessagesPreviewComponent } from './form-builder-detail-tabs/final-messages-preview/final-messages-preview.component';
import { ContractTemplateStepDetailComponent } from './form-builder-detail-tabs/step-details-tabs/contract-template-step-detail/contract-template-step-detail.component';
import { StepParentChildNestingComponent } from './form-builder-detail-tabs/step-details-tabs/common-template-step-detail-tab/step-parent-child-nesting/step-parent-child-nesting.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { FormTemplateStepDetailParentTabsComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-step-detail-parent-tabs.component';
import { FormTemplateGeneralNotificationComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-general-notification/form-template-general-notification.component';
import { GeneralNotificationTableComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-general-notification/general-notification-table/general-notification-table.component';
import { GeneralNotificationDetailsComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-general-notification/general-notification-details/general-notification-details.component';
import { GeneralNotificationKeysTableComponent } from './form-builder-detail-tabs/form-template-step-detail-parent-tabs/form-template-general-notification/general-notification-keys-table/general-notification-keys-table.component';
import { OptionItemComponent } from './form-builder-detail-tabs/step-details-tabs/common-template-step-detail-tab/option-item/option-item.component';

@NgModule({
    declarations: [
        FormBuilderTableComponent,
        DuplicateFormBuilderDialogComponent,
        FormBuilderDetailTabsComponent,
        CommonTemplateStepDetailComponent,
        FormTemplateStepDetailComponent,
        AddFormStepDialogComponent,
        AddFormValidatorDialogComponent,
        QuestionFormPreviewComponent,
        DocumentFormPreviewComponent,
        AddSegmentFormBuilderDialogComponent,
        ConditionAcceptanceFormPreviewComponent,
        StepDetailsTabsComponent,
        CommonTemplateStepDetailTabComponent,
        StepParameterTabComponent,
        StepNotificationMessagesTabComponent,
        MessagesDetailsComponent,
        NotificationDetailsComponent,
        NotificationMessageTableComponent,
        NotificationMessagesKeysTableComponent,
        KeyTableWindowComponent,
        AddFormSignatoryDialogComponent,
        FinalMessagesPreviewComponent,
        ContractTemplateStepDetailComponent,
        StepParentChildNestingComponent,
        FormTemplateStepDetailParentTabsComponent,
        FormTemplateGeneralNotificationComponent,
        GeneralNotificationTableComponent,
        GeneralNotificationDetailsComponent,
        GeneralNotificationKeysTableComponent,
        OptionItemComponent,
    ],
    imports: [CommonModule, FormBuilderRoutingModule, SharedModule, CKEditorModule, NgSelectModule, SweetAlert2Module.forRoot(), NgxMaterialTimepickerModule]
})
export class FormBuilderModule {}
