import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CertiDegreeComponent } from './certi-degree/certi-degree.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { ListOfCertificateTableComponent } from './list-of-certificate-table/list-of-certificate-table.component';
import { CertificateDetailsParametersComponent } from './list-of-certificate-table/certificate-details/certificate-details-parameters/certificate-details-parameters.component';
import { CertificateDetailsComponent } from './list-of-certificate-table/certificate-details/certificate-details.component';
import { CanExitService } from 'app/service/exit-guard/can-exit.service';

export const routes: Routes = [
  {
    path: '',
    component: ListOfCertificateTableComponent,
    // canActivate: [PermissionGuard],
    data: {
      permission: 'certifications.certidegree.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //   ]
      // },
    },
  },
  {
    path: ':id',
    component: CertificateDetailsComponent,
    canDeactivate: [CanExitService],
    // canActivate: [PermissionGuard],
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
export class CertiDegreeRoutingModule {}
