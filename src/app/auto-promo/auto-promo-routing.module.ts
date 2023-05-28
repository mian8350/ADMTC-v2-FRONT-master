import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AutoPromoComponent } from './auto-promo/auto-promo.component';

const routes: Routes = [
  {
    path: '', redirectTo: 'auto-promo', pathMatch: 'full'
  },
  { path: 'auto-promo', component: AutoPromoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AutoPromoRoutingModule { }
