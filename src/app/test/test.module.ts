import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestCreationComponent } from './test-creation/test-creation.component';
import { FirstStepComponent } from './steps/first-step/first-step.component';
import { TestRoutingModule } from './test-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ButtonTestControlComponent } from './steps/button-test-control/button-test-control.component';
import { TestDocumentComponent } from './test-document/test-document.component';
import { ThirdStepComponent } from './steps/third-step/third-step.component';
import { FifthStepComponent } from './steps/fifth-step/fifth-step.component';
import { SecondStepComponent } from './steps/second-step/second-step.component';
import { DuplicateTestDialogComponent } from './steps/first-step/duplicate-test-dialog/duplicate-test-dialog.component';
import { FileUploadModule } from 'ng2-file-upload';
import { FourthStepComponent } from './steps/fourth-step/fourth-step.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { UploadedDocumentDialogComponent } from './steps/third-step/uploaded-document-dialog/uploaded-document-dialog.component';
import { ExpectedDocumentDialogComponent } from './steps/third-step/expected-document-dialog/expected-document-dialog.component';
import { AddTaskDialogComponent } from './steps/fourth-step/add-task-dialog/add-task-dialog.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

@NgModule({
    declarations: [
        TestCreationComponent,
        FirstStepComponent,
        ButtonTestControlComponent,
        TestDocumentComponent,
        ThirdStepComponent,
        FifthStepComponent,
        SecondStepComponent,
        DuplicateTestDialogComponent,
        FourthStepComponent,
        UploadedDocumentDialogComponent,
        ExpectedDocumentDialogComponent,
        AddTaskDialogComponent,
    ],
    imports: [
        CommonModule,
        TestRoutingModule,
        SharedModule,
        FileUploadModule,
        CKEditorModule,
        NgxMaterialTimepickerModule,
    ],
    exports: [FirstStepComponent]
})
export class TestModule {}
