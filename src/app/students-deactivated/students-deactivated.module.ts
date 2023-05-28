import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { DeactivatedStudentsComponent } from './students/deactivated-students.component';
import { StudentsDeactivatedRoutingModule } from './students-deactivated-routing.module';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [
        DeactivatedStudentsComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        StudentsDeactivatedRoutingModule,
        SweetAlert2Module.forRoot(),
        CKEditorModule,
        NgSelectModule
    ]
})
export class StudentsDeactivatedModule { }
