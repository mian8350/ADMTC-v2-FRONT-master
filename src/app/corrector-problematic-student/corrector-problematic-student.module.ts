import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CorrectorProblematicStudentRoutingModule } from './corrector-problematic-student-routing.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { RncpTitlesModule } from 'app/rncp-titles/rncp-titles.module';
import { SchoolModule } from 'app/school/school.module';
import { SharedModule } from 'app/shared/shared.module';
import { CorrectorProblematicSchoolDetailComponent } from './corrector-problematic-school-detail/corrector-problematic-school-detail.component';
import { SelectTitleClassComponent } from 'app/school/select-title-class/select-title-class.component';
import { StudentCardsModule } from 'app/student-cards/student-cards.module';


@NgModule({
    declarations: [
        CorrectorProblematicSchoolDetailComponent,
    ],
    imports: [
        CommonModule,
        CorrectorProblematicStudentRoutingModule,
        SharedModule,
        SweetAlert2Module.forRoot(),
        CKEditorModule,
        NgSelectModule,
        SchoolModule,
        StudentCardsModule,
        RncpTitlesModule,
    ]
})
export class CorrectorProblematicStudentModule { }
