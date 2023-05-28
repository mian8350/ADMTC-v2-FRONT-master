import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RncpTitlesComponent } from './rncp-titles/rncp-titles.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { AcadKitQuickSearchListComponent } from './acad-kit-quick-search-list/acad-kit-quick-search-list.component';

export const routes: Routes = [
  {
    path: '',
    component: RncpTitlesComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'rncp_title.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'ADMTC Visitor',
      //     'Academic Director',
      //     'Academic Admin',
      //     'Corrector',
      //     'Animator Business game',
      //     'Cross Corrector',
      //     'PC School Director',
      //     'Teacher',
      //     'Professional Jury Member',
      //     'Academic Final Jury Member',
      //     'Certifier Admin',
      //     'CR School Director',
      //     'Corrector Certifier',
      //     'Corrector of Problematic',
      //     'Corrector Quality',
      //     'President of Jury',
      //     'Chief Group Academic'
      //   ],
      //   except: ['Mentor'],
      // },
    },
  },
  {
    path: ':titleId/dashboard',
    component: DashboardComponent,
    data: {
      permission: 'rncp_title.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'ADMTC Visitor',
      //     'Academic Director',
      //     'Academic Admin',
      //     'Corrector',
      //     'Animator Business game',
      //     'Cross Corrector',
      //     'PC School Director',
      //     'Teacher',
      //     'Professional Jury Member',
      //     'Academic Final Jury Member',
      //     'Certifier Admin',
      //     'CR School Director',
      //     'Corrector Certifier',
      //     'Corrector of Problematic',
      //     'Corrector Quality',
      //     'President of Jury',
      //     'Chief Group Academic'
      //   ],
      //   except: ['Mentor'],
      // },
    },
  },
  {
    path: "academic-kit-search-list",
    component: AcadKitQuickSearchListComponent,
    data: {
      permission: 'rncp_title.show_perm' 
    }
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
export class RncpTitleRoutingModule {}
