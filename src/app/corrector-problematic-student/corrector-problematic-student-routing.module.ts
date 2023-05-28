import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CorrectorProblematicSchoolDetailComponent } from './corrector-problematic-school-detail/corrector-problematic-school-detail.component';


const routes: Routes = [
  {
    path: ':schoolId',
    component: CorrectorProblematicSchoolDetailComponent,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CorrectorProblematicStudentRoutingModule { }
