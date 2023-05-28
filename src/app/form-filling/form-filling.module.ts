import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormFillingRoutingModule } from './form-filling-routing.module';
import { FormFillingComponent } from './form-filling.component';
import { FormFillDocumentExpectedComponent } from './form-fill-document-expected/form-fill-document-expected.component';
import { FormFillNormalQuestionComponent } from './form-fill-normal-question/form-fill-normal-question.component';
import { FormFillingRevisionBoxComponent } from './form-filling-revision-box/form-filling-revision-box.component';
import { FormFillingRevisionDialogComponent } from './form-filling-revision-dialog/form-filling-revision-dialog.component';
import { SharedModule } from 'app/shared/shared.module';
import { FormFillConditionAcceptanceComponent } from './form-fill-condition-acceptance/form-fill-condition-acceptance.component';
import { FormFillSummaryComponent } from './form-fill-summary/form-fill-summary.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { WidgetComponentModule } from 'app/widget-component/widget-component.module';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { FormFillContractSingingProcessComponent } from './form-fill-contract-singing-process/form-fill-contract-singing-process.component';
import { FormFillDynamicSummaryComponent } from './form-fill-dynamic-summary/form-fill-dynamic-summary.component';
import { FormFillFinalMessageComponent } from './form-fill-final-message/form-fill-final-message.component';
import { FormFillRecursiveParentChildComponent } from './form-fill-recursive-parent-child/form-fill-recursive-parent-child.component';
import { FormFillRecursiveSingleOptionComponent } from './form-fill-recursive-parent-child/form-fill-recursive-single-option/form-fill-recursive-single-option.component';
import { FormFillRecursiveNumericComponent } from './form-fill-recursive-parent-child/form-fill-recursive-numeric/form-fill-recursive-numeric.component';
import { FormFillRecursiveFreeTextComponent } from './form-fill-recursive-parent-child/form-fill-recursive-free-text/form-fill-recursive-free-text.component';
import { FormFillRecursiveDateComponent } from './form-fill-recursive-parent-child/form-fill-recursive-date/form-fill-recursive-date.component';
import { FormFillRecursiveEmailComponent } from './form-fill-recursive-parent-child/form-fill-recursive-email/form-fill-recursive-email.component';
import { FormFillRecursiveDurationComponent } from './form-fill-recursive-parent-child/form-fill-recursive-duration/form-fill-recursive-duration.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [
        FormFillingComponent,
        FormFillDocumentExpectedComponent,
        FormFillNormalQuestionComponent,
        FormFillingRevisionBoxComponent,
        FormFillingRevisionDialogComponent,
        FormFillConditionAcceptanceComponent,
        FormFillSummaryComponent,
        FormFillContractSingingProcessComponent,
        FormFillDynamicSummaryComponent,
        FormFillFinalMessageComponent,
        FormFillRecursiveParentChildComponent,
        FormFillRecursiveSingleOptionComponent,
        FormFillRecursiveNumericComponent,
        FormFillRecursiveFreeTextComponent,
        FormFillRecursiveDateComponent,
        FormFillRecursiveEmailComponent,
        FormFillRecursiveDurationComponent,
    ],
    imports: [CommonModule, FormFillingRoutingModule, SharedModule, CKEditorModule, WidgetComponentModule, NgxMaterialTimepickerModule, NgSelectModule]
})
export class FormFillingModule {}
