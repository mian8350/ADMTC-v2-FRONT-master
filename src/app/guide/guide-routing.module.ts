import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AutoPromoComponent } from './auto-promo/auto-promo.component';
import { UserComponent } from './user/user.component';


export const routes: Routes = [
  {
    path: '', redirectTo: 'table_1', pathMatch: 'full'
  },
  {
    path: '',
    children: [
      {
        path: 'table_1',
        component: AutoPromoComponent
      },
      {
        path: 'table_2',
        component: UserComponent
      }
    ]
  },
  {
    path: '**', redirectTo: 'table_1', pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GuideRoutingModule { }
