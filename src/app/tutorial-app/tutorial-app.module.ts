import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialAppComponent } from './tutorial-app/tutorial-app.component';
import { SharedModule } from 'app/shared/shared.module';
import { TutorialAppRoutingModule } from './tutorial-app-routing.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { TutorialTabComponent } from './tutorial-tab.component';
import { AddTutorialTabComponent } from './add-tutorial-tab/add-tutorial-tab.component';

@NgModule({
    declarations: [
        TutorialAppComponent,
        TutorialTabComponent,
        AddTutorialTabComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        TutorialAppRoutingModule,
        CKEditorModule,
        NgSelectModule
    ]
})
export class TutorialAppModule { }
