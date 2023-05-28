import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { FormBuilderDetailTabsComponent } from './form-builder-detail-tabs/form-builder-detail-tabs.component';
import { KeyTableWindowComponent } from './form-builder-detail-tabs/key-table-window/key-table-window.component';
import { FormBuilderTableComponent } from './form-builder-table.component';


const routes: Routes = [
  {
    path: '',
    component: FormBuilderTableComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.form_builder.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'template-detail',
    component: FormBuilderDetailTabsComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.form_builder.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'key-table',
    component: KeyTableWindowComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FormBuilderRoutingModule { }
