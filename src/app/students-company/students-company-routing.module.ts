import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { CompanyStudentsComponent } from './students/company-students.component';


export const routes: Routes = [
  {
    path: '',
    component: CompanyStudentsComponent,
    canActivate: [PermissionGuard],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentsCompanyRoutingModule {}
