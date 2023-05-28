import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { DeactivatedStudentsComponent } from './students/deactivated-students.component';


export const routes: Routes = [
  {
    path: '',
    component: DeactivatedStudentsComponent,
    canActivate: [PermissionGuard],
    data: {
      permission : 'students.show_perm'
    },
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
export class StudentsDeactivatedRoutingModule {}
