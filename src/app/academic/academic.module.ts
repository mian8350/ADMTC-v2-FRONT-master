import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AcademicRoutingModule } from './academic-routing.module';
import { AcademicParentComponent } from './academic-parent.component';
import { ProblematicFullscreenComponent } from './problematic-fullscreen/problematic-fullscreen.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SchoolModule } from 'app/school/school.module';
import { EmployabilitySurveyFullscreenComponent } from './employability-survey-fullscreen/employability-survey-fullscreen.component';
import { JobFullscreenComponent } from './jobdescription-fullscreen/jobdescription-fullscreen.component';
import { StudentCardsModule } from 'app/student-cards/student-cards.module';

@NgModule({
  declarations: [
    AcademicParentComponent,
    ProblematicFullscreenComponent,
    EmployabilitySurveyFullscreenComponent,
    JobFullscreenComponent
  ],
  imports: [
    CommonModule,
    AcademicRoutingModule,
    CommonModule,
    SharedModule,
    CKEditorModule,
    NgSelectModule,
    SchoolModule,
    StudentCardsModule,
    SweetAlert2Module.forRoot(),
  ],
})
export class AcademicModule {}
