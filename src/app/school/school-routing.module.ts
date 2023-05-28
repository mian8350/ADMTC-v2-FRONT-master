import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SchoolComponent } from './school/school.component';
import { SchoolTabComponent } from './school-tab/school-tab.component';
import { CanExitService } from 'app/service/exit-guard/can-exit.service';
import { PermissionGuard } from 'app/service/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: SchoolComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'schools.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'Academic Director',
      //     'Academic Admin',
      //     'Certifier Admin',
      //     'CR School Director',
      //     'PC School Director',
      //   ],
      //   except: [
      //     'ADMTC Visitor',
      //     'Corrector',
      //     'Animator Business game',
      //     'Cross Corrector',
      //     'Teacher',
      //     'Professional Jury Member',
      //     'Academic Final Jury Member',
      //     'Corrector Certifier',
      //     'Corrector of Problematic',
      //     'Corrector Quality',
      //     'President of Jury',
      //     'Mentor',
      //     'Chief Group Academic',
      //   ],
      // },
    },
  },
  {
    path: 'create',
    component: SchoolTabComponent,
    canDeactivate: [CanExitService],
    canActivate: [PermissionGuard],
    data: {
      permission: 'schools.list_of_schools.school_details.add_perm'
    },
  },
  {
    path: ':schoolId',
    component: SchoolTabComponent,
    canDeactivate: [CanExitService],
    canActivate: [PermissionGuard],
    data: {
      permission: 'schools.list_of_schools.school_details.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'Academic Director',
      //     'PC School Director',
      //     'Academic Admin',
      //     'Certifier Admin',
      //     'CR School Director',
      //   ],
      //   except: [
      //     'ADMTC Visitor',
      //     'Corrector',
      //     'Animator Business game',
      //     'Cross Corrector',
      //     'Teacher',
      //     'Professional Jury Member',
      //     'Academic Final Jury Member',
      //     'Corrector Certifier',
      //     'Corrector of Problematic',
      //     'Corrector Quality',
      //     'President of Jury',
      //     'Mentor',
      //     'Chief Group Academic',
      //   ],
      // },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SchoolRoutingModule {}
