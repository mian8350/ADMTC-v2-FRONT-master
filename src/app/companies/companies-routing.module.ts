import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CanExitService } from 'app/service/exit-guard/can-exit.service';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { CompanyBranchesComponent } from './company-branches/company-branches.component';
import { CompanyEntitiesComponent } from './company-entities/company-entities.component';
import { CompanyListComponent } from './shared-company-components/company-list/company-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'branches', pathMatch: 'full' },
  {
    path: 'branches',
    component: CompanyBranchesComponent,
    canDeactivate: [CanExitService],
    canActivate: [PermissionGuard],
    data: {
      permission: 'companies.company_branch.show_perm',
    },
  },
  {
    path: 'entities',
    component: CompanyEntitiesComponent,
    canDeactivate: [CanExitService],
    canActivate: [PermissionGuard],
    data: {
      permission: 'companies.company_entity.show_perm',
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
export class CompaniesRoutingModule {}
