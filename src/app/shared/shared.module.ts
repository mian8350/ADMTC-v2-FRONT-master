import { NgModule } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PortalModule } from '@angular/cdk/portal';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule, MatRippleModule, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipDefaultOptions, MatTooltipModule, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { ValidationMessageComponent } from './components/validation-message/validation-message.component';
import { CommonModule } from '@angular/common';
import { ChipsAutocompleteComponent } from './components/chips-autocomplete/chips-autocomplete.component';
import { AppDateAdapter, APP_DATE_FORMATS } from './date.adapter';
import { CustomMatPaginatorIntl } from './custom-mat-paginator-intl';
import { TruncatePipe } from './pipes/truncate.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { ParseStringDatePipe } from './pipes/parse-string-date.pipe';
import { LimiteToPipe } from './pipes/LimiteTo.pipe';
import { LoginAsUserDialogComponent } from './components/login-as-user-dialog/login-as-user-dialog.component';
import { ParseUtcToLocalPipe } from './pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from './pipes/parse-local-to-utc.pipe';
import { CkeditorInputDialogComponent } from './components/ckeditor-input-dialog/ckeditor-input-dialog.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SpeechToTextDialogComponent } from './components/speech-to-text-dialog/speech-to-text-dialog.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { UploadExpectedDocTaskComponent } from 'app/rncp-titles/dashboard/upload-expected-doc-task/upload-expected-doc-task.component';
import { UploadCvDocTaskComponent } from 'app/rncp-titles/dashboard/upload-cv-doc-task/upload-cv-doc-task.component';
import { SendMailDialogComponent } from 'app/mailbox/send-mail-dialog/send-mail-dialog.component';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { UrgentMessageDialogComponent } from 'app/urgent-message/urgent-message-dialog.component';
import { CertificationRulePopUpComponent } from 'app/title-rncp/conditions/certification-rule/certification-rule-pop-up/certification-rule-pop-up.component';
import { DeactivateStudentDialogComponent } from 'app/students/deactivate-student-dialog/deactivate-student-dialog.component';
import { ExportEsCsvDialogComponent } from 'app/students/export-es-csv-dialog/export-es-csv-dialog.component';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';
import { MailToGroupDialogComponent } from 'app/mailbox/mail-to-group-dialog/mail-to-group-dialog.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { BannerConnectAsSnackbarComponent } from './components/banner-connect-as-snackbar/banner-connect-as-snackbar.component';
import { ResignationReasonDialogComponent } from 'app/students/resignation-reason-dialog/resignation-reason-dialog.component';
import { RejectionManualTaskDialogComponent } from './components/rejection-manual-task-dialog/rejection-manual-task-dialog.component';
import { SchoolStudentDeactivatedDialogComponent } from 'app/school/school-student-deactivated/school-student-deactivated-dialog/school-student-deactivated-dialog.component';
import { TransferResponsibilityDialogComponent } from './components/transfer-responsibility-dialog/transfer-responsibility-dialog.component';
import { ProblematicRejectionDialogComponent } from './components/problematic-rejection-dialog/problematic-rejection-dialog.component';
import { AssignCorrectorProblematicDialogComponent } from './components/assign-corrector-problematic-dialog/assign-corrector-problematic-dialog.component';
import { ContactUsDialogComponent } from 'app/need-help/contact-us/contact-us-dialog.component';
import { ValidateProblematicTaskDialogComponent } from './components/validate-problematic-task-dialog/validate-problematic-task-dialog.component';
import { ExportGroupsDialogComponent } from './components/export-groups-dialog/export-groups-dialog.component';
import { QuickSearchListDialogComponent } from './components/quick-search-list-dialog/quick-search-list-dialog.component';
import { StatusUpdateDialogComponent } from './components/status-update-dialog/status-update-dialog.component';
import { EditExpectedDocumentDialogComponent } from './components/edit-expected-document-dialog/edit-expected-document-dialog.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SendProEvaluationDialogComponent } from './components/send-pro-evaluation-dialog/send-pro-evaluation-dialog.component';
import { PdfPersonalizedStudentComponent } from 'app/rncp-titles/dashboard/test-details/pdf-personalized-student/pdf-personalized-student.component';
import { PdfPersonalizedGroupComponent } from 'app/rncp-titles/dashboard/test-details/pdf-personalized-group/pdf-personalized-group.component';
import { SendCopiesDialogComponent } from './send-copies-dialog/send-copies-dialog.component';
import { StepMessageDialogComponent } from 'app/correction-eval-pro-step/step-message-dialog/step-message-dialog.component';
import { PdfDetailComponent } from 'app/test-correction/pdf-detail/pdf-detail.component';
import { UploadPresentationDocumentTaskComponent } from 'app/rncp-titles/dashboard/upload-presentation-document-task/upload-presentation-document-task.component';
import { AddTutorialAppDialogComponent } from 'app/tutorial-app/add-tutorial-app-dialog/add-tutorial-app-dialog.component';
import { ImagePreviewDialogComponent } from './components/image-preview-dialog/image-preview-dialog.component';
import { BoardSubmissionDialogComponent } from 'app/transcript-process/transcript-input-decision/board-submission-dialog/board-submission-dialog.component';
import { JustifyAbsenceDialogComponent } from 'app/rncp-titles/dashboard/justify-absence-dialog/justify-absence-dialog.component';
import { GeneralDocumentDialogComponent } from './components/general-document-dialog/general-document-dialog.component';
import { ImportStudentCompaniesDialogComponent } from './components/import-student-companies-dialog/import-student-companies-dialog.component';
import { SendJobDescriptionDialogComponent } from './components/send-job-description-dialog/send-job-description-dialog.component';
import { AddUserDialogComponent } from './components/add-user-dialog/add-user-dialog.component';
import { IncorrectUsersEmailDialogComponent } from './components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';
import { SafeResourceUrlPipe } from './pipes/safe-resource-url.pipe';
import { StepDynamicMessageDialogComponent } from './components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';
import { AlertFunctionalityUserDialogComponent } from './components/alert-functionality-user-dialog/alert-functionality-user-dialog.component';
import { TaskBuilderActionDialogComponent } from './components/task-builder-action-dialog/task-builder-action-dialog.component';
import { KeyTablesComponent } from './components/key-tables/key-tables.component';
import { ChangeDueDateTaskDialogComponent } from './components/change-due-date-task-dialog/change-due-date-task-dialog.component';
import { TaskDynamicMessageDialogComponent } from './components/task-dynamic-message-dialog/task-dynamic-message-dialog.component';
import { TitleRncpCardComponent } from './components/title-rncp-card/title-rncp-card.component';
import { XychartColumnSeriesComponent } from './charts/xychart-column-series/xychart-column-series.component';
import { PiechartThreeSeriesComponent } from './charts/piechart-three-series/piechart-three-series.component';
import { ChangeDueDateManagerTitleComponent } from './components/change-due-date-manager-title-dialog/change-due-date-manager-title/change-due-date-manager-title.component';
import { DatePickerFormatDirective } from 'app/directives/date-picker-format.directive';
import { TutorialBarComponent } from './tutorial-bar/tutorial-bar.component';
import { CopyNotificationDialogComponent } from './components/copy-notification-dialog/copy-notification-dialog.component';
import { ResignationActiveMarkPrevCourseDialogComponent } from './components/resignation-active-mark-prev-course-dialog/resignation-active-mark-prev-course-dialog.component';
import { ResignationActiveNonMarkPrevCourseDialogComponent } from './components/resignation-active-non-mark-prev-course-dialog/resignation-active-non-mark-prev-course-dialog.component';
import { TransferStudentResignationDialogComponent } from './components/transfer-student-resignation-dialog/transfer-student-resignation-dialog.component';
import { DeactivateStudentResignationDialogComponent } from './components/deactivate-student-resignation-dialog/deactivate-student-resignation-dialog.component';
import { SuspendStudentResignationDialogComponent } from './components/suspend-student-resignation-dialog/suspend-student-resignation-dialog.component';

const modules: any = [
  A11yModule,
  CdkStepperModule,
  CdkTableModule,
  CdkTreeModule,
  DragDropModule,
  MatAutocompleteModule,
  MatBadgeModule,
  MatBottomSheetModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatStepperModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDividerModule,
  MatExpansionModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatRippleModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule,
  PortalModule,
  ScrollingModule,
  TranslateModule,
  FormsModule,
  ReactiveFormsModule,
  FlexLayoutModule,
  CommonModule,
];

export const OtherOptions: MatTooltipDefaultOptions = {
  showDelay: 0,
  hideDelay: 0,
  touchGestures: 'auto',
  touchendHideDelay: 0,
  disableTooltipInteractivity: true,
};

@NgModule({
  declarations: [
    ConfirmationDialogComponent,
    ValidationMessageComponent,
    ChipsAutocompleteComponent,
    TruncatePipe,
    LimiteToPipe,
    SafeHtmlPipe,
    ParseStringDatePipe,
    LoginAsUserDialogComponent,
    ParseUtcToLocalPipe,
    ParseLocalToUtcPipe,
    CkeditorInputDialogComponent,
    SpeechToTextDialogComponent,
    UploadExpectedDocTaskComponent,
    UploadCvDocTaskComponent,
    SendMailDialogComponent,
    ReplyUrgentMessageDialogComponent,
    UrgentMessageDialogComponent,
    ContactUsDialogComponent,
    CertificationRulePopUpComponent,
    DeactivateStudentDialogComponent,
    ResignationReasonDialogComponent,
    ExportEsCsvDialogComponent,
    MailStudentDialogComponent,
    MailToGroupDialogComponent,
    BannerConnectAsSnackbarComponent,
    RejectionManualTaskDialogComponent,
    SchoolStudentDeactivatedDialogComponent,
    TransferResponsibilityDialogComponent,
    ProblematicRejectionDialogComponent,
    AssignCorrectorProblematicDialogComponent,
    ValidateProblematicTaskDialogComponent,
    ExportGroupsDialogComponent,
    QuickSearchListDialogComponent,
    StatusUpdateDialogComponent,
    EditExpectedDocumentDialogComponent,
    SendProEvaluationDialogComponent,
    PdfPersonalizedStudentComponent,
    PdfPersonalizedGroupComponent,
    SendCopiesDialogComponent,
    StepMessageDialogComponent,
    PdfDetailComponent,
    UploadPresentationDocumentTaskComponent,
    AddTutorialAppDialogComponent,
    ImagePreviewDialogComponent,
    BoardSubmissionDialogComponent,
    JustifyAbsenceDialogComponent,
    GeneralDocumentDialogComponent,
    ImportStudentCompaniesDialogComponent,
    SendJobDescriptionDialogComponent,
    AddUserDialogComponent,
    IncorrectUsersEmailDialogComponent,
    SafeResourceUrlPipe,
    StepDynamicMessageDialogComponent,
    AlertFunctionalityUserDialogComponent,
    TaskBuilderActionDialogComponent,
    KeyTablesComponent,
    ChangeDueDateTaskDialogComponent,
    TaskDynamicMessageDialogComponent,
    TitleRncpCardComponent,
    XychartColumnSeriesComponent,
    PiechartThreeSeriesComponent,
    ChangeDueDateManagerTitleComponent,
    TutorialBarComponent,
    DatePickerFormatDirective,
    CopyNotificationDialogComponent,
    ResignationActiveMarkPrevCourseDialogComponent,
    ResignationActiveNonMarkPrevCourseDialogComponent,
    TransferStudentResignationDialogComponent,
    DeactivateStudentResignationDialogComponent,
    SuspendStudentResignationDialogComponent,
  ],
  imports: [...modules, CKEditorModule, NgxPermissionsModule.forChild(), NgSelectModule, SweetAlert2Module.forRoot()],
  exports: [
    ...modules,
    ValidationMessageComponent,
    ChipsAutocompleteComponent,
    TruncatePipe,
    SafeHtmlPipe,
    ParseStringDatePipe,
    LimiteToPipe,
    LoginAsUserDialogComponent,
    CkeditorInputDialogComponent,
    NgxPermissionsModule,
    ExportEsCsvDialogComponent,
    EditExpectedDocumentDialogComponent,
    SendProEvaluationDialogComponent,
    PdfPersonalizedStudentComponent,
    PdfPersonalizedGroupComponent,
    PdfDetailComponent,
    AddUserDialogComponent,
    IncorrectUsersEmailDialogComponent,
    SafeResourceUrlPipe,
    KeyTablesComponent,
    TaskDynamicMessageDialogComponent,
    TitleRncpCardComponent,
    PiechartThreeSeriesComponent,
    XychartColumnSeriesComponent,
    TutorialBarComponent,
    DatePickerFormatDirective,
    CopyNotificationDialogComponent,
    ResignationActiveMarkPrevCourseDialogComponent,
    DeactivateStudentResignationDialogComponent
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS,
    },
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginatorIntl,
    },
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: OtherOptions,
    },
  ],
})
export class SharedModule {}
