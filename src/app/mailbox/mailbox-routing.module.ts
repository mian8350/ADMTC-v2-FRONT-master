import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MailboxComponent } from './mailbox/mailbox.component';
import { SentboxComponent } from './sent-box/sent-box.component';
import { ImportantboxComponent } from './important/important.component';
import { TrashComponent } from './trash/trash.component';
import { DraftComponent } from './draft/draft.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { CcComponent } from './cc/cc.component';

export const routes: Routes = [
  {
    path: '',
    // redirectTo: 'login',
    redirectTo: 'inbox',
    pathMatch: 'full',
  },
  {
    path: '',
    children: [
      {
        path: 'inbox',
        component: MailboxComponent,
      },
      {
        path: 'sentBox',
        component: SentboxComponent,
      },
      {
        path: 'important',
        component: ImportantboxComponent,
      },
      {
        path: 'draft',
        component: DraftComponent,
      },
      {
        path: 'trash',
        component: TrashComponent,
      },
      {
        path: 'cc',
        component: CcComponent,
      },
    ],
    canActivate: [PermissionGuard],
    data: {
      permission: 'mailbox.show_perm',
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
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
      //     'Mentor',
      //     'Chief Group Academic',
      //     'Student'
      //   ],
      //   except: [
      //     'ADMTC Visitor',
      //   ],
      // },
    },
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MailboxRoutingModule {}
