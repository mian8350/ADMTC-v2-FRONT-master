import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StudentsComponent } from './students/students.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';


export const routes: Routes = [
  {
    path: '',
    component: StudentsComponent,
    canActivate: [PermissionGuard],
    data: {
      permission : 'students.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'Certifier Admin',
      //     'CR School Director',
      //     'Mentor',
      //     'Chief Group Academic',
      //   ],
      //   except: [
      //     'ADMTC Visitor',
      //     'Academic Director',
      //     'Academic Admin',
      //     'Corrector',
      //     'Animator Business game',
      //     'Cross Corrector',
      //     'Teacher',
      //     'PC School Director',
      //     'Professional Jury Member',
      //     'Academic Final Jury Member',
      //     'Corrector Certifier',
      //     'Corrector of Problematic',
      //     'Corrector of Quality',
      //     'President of Jury',
      //   ],
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
export class StudentsRoutingModule {}
