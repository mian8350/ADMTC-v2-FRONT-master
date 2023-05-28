import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IdeasComponent } from './ideas/ideas.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';


export const routes: Routes = [

  {
    path: '',
    component: IdeasComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'ideas.show_perm'
      // permission: {
      //   except: [
      //     'Mentor',
      //     'ADMTC Visitor',
      //   ]
      // },
    },
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IdeasRoutingModule { }
