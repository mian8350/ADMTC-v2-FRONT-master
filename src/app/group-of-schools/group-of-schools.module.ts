import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupOfSchoolsRoutingModule } from './group-of-schools-routing.module';
import { GroupOfSchoolsTableComponent } from './group-of-schools-table.component';
import { AddGroupOfSchoolDialogComponent } from './add-group-of-school-dialog/add-group-of-school-dialog.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';


@NgModule({
    declarations: [GroupOfSchoolsTableComponent, AddGroupOfSchoolDialogComponent],
    imports: [
        CommonModule,
        GroupOfSchoolsRoutingModule,
        SharedModule,
        CKEditorModule,
        NgSelectModule,
        SweetAlert2Module.forRoot(),
    ]
})
export class GroupOfSchoolsModule { }
