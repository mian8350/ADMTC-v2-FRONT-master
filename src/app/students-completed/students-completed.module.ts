import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { CompletedStudentsComponent } from './students/completed-students.component';
import { StudentsCompletedRoutingModule } from './students-completed-routing.module';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [
        CompletedStudentsComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        StudentsCompletedRoutingModule,
        SweetAlert2Module.forRoot(),
        CKEditorModule,
        NgSelectModule
    ]
})
export class StudentsCompletedModule { }
