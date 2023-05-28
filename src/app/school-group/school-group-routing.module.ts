import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { SchoolGroupComponent } from './school-group/school-group.component';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: SchoolGroupComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'chief_group_school.show_perm'
      // permission: {
      //   only: [
      //     'Chief Group Academic',
      //   ],
      // },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SchoolGroupRoutingModule { }
