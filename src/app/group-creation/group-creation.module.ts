import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupCreationRoutingModule } from './group-creation-routing.module';
import { GroupCreationComponent } from './group-creation.component';
import { SharedModule } from 'app/shared/shared.module';
import { FileUploadModule } from 'ng2-file-upload';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { StudentGroupTableComponent } from './student-group-table/student-group-table.component';
import { GroupCardsComponent } from './group-cards/group-cards.component';
import { AddGroupDialogComponent } from './group-cards/add-group-dialog/add-group-dialog.component';
import { DuplicateGroupDialogComponent } from './group-cards/duplicate-group-dialog/duplicate-group-dialog.component';

@NgModule({
    declarations: [
        GroupCreationComponent,
        StudentGroupTableComponent,
        GroupCardsComponent,
        AddGroupDialogComponent,
        DuplicateGroupDialogComponent,
    ],
    imports: [
        CommonModule,
        GroupCreationRoutingModule,
        SharedModule,
        FileUploadModule,
        CKEditorModule,
        NgxMaterialTimepickerModule,
    ]
})
export class GroupCreationModule {}
