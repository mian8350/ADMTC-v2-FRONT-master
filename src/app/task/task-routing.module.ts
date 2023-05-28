import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskComponent } from './task/task.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: TaskComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'tasks.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'Academic Director',
      //     'Academic Admin',
      //     'Corrector',
      //     'Animator Business game',
      //     'Cross Corrector',
      //     'Teacher',
      //     'Professional Jury Member',
      //     'Academic Final Jury Member',
      //     'Certifier Admin',
      //     'CR School Director',
      //     'Corrector Certifier',
      //     'Corrector of Problematic',
      //     'Corrector Quality',
      //     'President of Jury',
      //     'Mentor',
      //     'Chief Group Academic',
      //     'Student'
      //   ],
      //   except: ['ADMTC Visitor', 'PC School Director'],
      // },
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
export class TaskRoutingModule {}
