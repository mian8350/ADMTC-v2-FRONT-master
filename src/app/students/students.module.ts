import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentsComponent } from './students/students.component';
import { SharedModule } from 'app/shared/shared.module';
import { StudentsRoutingModule } from './students-routing.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { TransferStudentDialogComponent } from './transfer-student-dialog/transfer-student-dialog.component';
import { CreateSendEmployabilitySurveyForStudentDialogComponent } from './create-send-employability-survey-for-student-dialog/create-send-employability-survey-for-student-dialog.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [
        StudentsComponent,
        TransferStudentDialogComponent,
        CreateSendEmployabilitySurveyForStudentDialogComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        StudentsRoutingModule,
        SweetAlert2Module.forRoot(),
        CKEditorModule,
        NgSelectModule
    ]
})
export class StudentsModule { }
