import { TitleTaskBuilderParentComponent } from './conditions/title-manager-tasks/title-task-builder-parent/title-task-builder-parent.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TitleRNCPComponent } from './title-rncp/title-rncp.component';
import { TitleRncpDetailsComponent } from './title-rncp-details/title-rncp-details.component';
import { CanDeactiveGuard } from 'app/service/rncpTitles/can-deactive.service';

import { TitleRncpCreateComponent } from './title-rncp-create/title-rncp-create.component';
import { CanExitService } from 'app/service/exit-guard/can-exit.service';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { KeyTablesComponent } from 'app/shared/components/key-tables/key-tables.component';


export const routes: Routes = [

  {
    path: '',
    component: TitleRNCPComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'parameters.rncp_title_management.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'details/:rncpId',
    component: TitleRncpDetailsComponent,
    canDeactivate: [CanExitService],
    canActivate: [PermissionGuard],
    data: {
      permission: 'parameters.rncp_title_management.edit_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'create',
    component: TitleRncpCreateComponent,
    canDeactivate: [CanExitService],
    canActivate: [PermissionGuard],
    data: {
      permission: 'parameters.rncp_title_management.add_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'create/:rncpId',
    redirectTo: 'details/:rncpId',
    pathMatch: 'full',
  },
  {
    path: 'task-builder/:rncpId',
    component: TitleTaskBuilderParentComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'parameters.rncp_title_management.edit_perm'
    },
  },
  {
    path: 'task-builder/key-tables/:type',
    component: KeyTablesComponent,
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class TitleRNCPRoutingModule { }
