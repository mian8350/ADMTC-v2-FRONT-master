import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AcademicParentComponent } from './academic-parent.component';
import { EmployabilitySurveyFullscreenComponent } from './employability-survey-fullscreen/employability-survey-fullscreen.component';
import { JobFullscreenComponent } from './jobdescription-fullscreen/jobdescription-fullscreen.component';
import { ProblematicFullscreenComponent } from './problematic-fullscreen/problematic-fullscreen.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'problematic/:schoolId/:titleId/:classId/:studentId',
        component: ProblematicFullscreenComponent,
      },
      {
        path: 'employability-survey/:schoolId/:studentId/:esId',
        component: EmployabilitySurveyFullscreenComponent,
      },
      {
        path: 'jobdescription/:schoolId/:titleId/:classId/:studentId',
        component: JobFullscreenComponent,
      },
      {
        path: 'jobdescription/:schoolId/:titleId/:classId/:studentId/:jobDescriptionId',
        component: JobFullscreenComponent,
      },
      {
        path: 'problematic/:schoolId/:titleId/:classId/:studentId/:problematicId',
        component: ProblematicFullscreenComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AcademicRoutingModule {}
