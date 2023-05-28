import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupOfSchoolsTableComponent } from './group-of-schools-table.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: GroupOfSchoolsTableComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'schools.group_of_schools.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupOfSchoolsRoutingModule { }
