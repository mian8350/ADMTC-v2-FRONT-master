import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SuspendedStudentsComponent } from './students/suspended-students.component';
import { StudentsSuspendedRoutingModule } from './students-suspended-routing.module';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [
        SuspendedStudentsComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        StudentsSuspendedRoutingModule,
        SweetAlert2Module.forRoot(),
        CKEditorModule,
        NgSelectModule,
    ]
})
export class StudentsSuspendedModule { }
