import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialComponent } from './tutorial/tutorial.component';
import { SharedModule } from 'app/shared/shared.module';
import { TutorialRoutingModule } from './tutorial-routing.module';
import { AddTutorialDialogComponent } from './add-tutorial-dialog/add-tutorial-dialog.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ForwardTutorialDialogComponent } from './forward-tutorial-dialog/forward-tutorial-dialog.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [
        TutorialComponent,
        AddTutorialDialogComponent,
        ForwardTutorialDialogComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        TutorialRoutingModule,
        CKEditorModule,
        NgSelectModule
    ]
})
export class TutorialModule { }
