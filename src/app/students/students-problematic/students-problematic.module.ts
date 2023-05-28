import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { RncpTitlesModule } from 'app/rncp-titles/rncp-titles.module';
import { SchoolModule } from 'app/school/school.module';
import { StudentCardsModule } from 'app/student-cards/student-cards.module';
import { StudentsProblematicComponent } from './students-problematic.component';
import { StudentsProblematicRoutingModule } from './students-problematic-routing.module';

@NgModule({
    declarations: [
        StudentsProblematicComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        StudentsProblematicRoutingModule,
        SweetAlert2Module.forRoot(),
        CKEditorModule,
        NgSelectModule,
        SchoolModule,
        StudentCardsModule,
        RncpTitlesModule,
    ]
})
export class StudentsProblematicModule { }
