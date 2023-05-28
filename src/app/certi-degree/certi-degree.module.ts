import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CertiDegreeComponent } from './certi-degree/certi-degree.component';
import { CertiDegreeRoutingModule } from './certi-degree-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { ListOfCertificateTableComponent } from './list-of-certificate-table/list-of-certificate-table.component';
import { CertificateDetailsComponent } from './list-of-certificate-table/certificate-details/certificate-details.component';
import { CertificateDetailsParametersComponent } from './list-of-certificate-table/certificate-details/certificate-details-parameters/certificate-details-parameters.component';
import { CertificateDetailsIssuanceComponent } from './list-of-certificate-table/certificate-details/certificate-details-issuance/certificate-details-issuance.component';
import { StudentCertificateIssuanceTableComponent } from './list-of-certificate-table/certificate-details/certificate-details-issuance/student-certificate-issuance-table/student-certificate-issuance-table.component';
import { StudentCertificateIssuancePreviewComponent } from './list-of-certificate-table/certificate-details/certificate-details-issuance/student-certificate-issuance-preview/student-certificate-issuance-preview.component';
import { CertificateDetailsDesignComponent } from './list-of-certificate-table/certificate-details/certificate-details-design/certificate-details-design.component';
import { CertificateDetailsPreviewComponent } from './list-of-certificate-table/certificate-details/certificate-details-preview/certificate-details-preview.component';
import { CertificateIssuanceProcessDialogComponent } from './list-of-certificate-table/certificate-issuance-process-dialog/certificate-issuance-process-dialog.component';
import { StudentCertificationDateDialogComponent } from './list-of-certificate-table/certificate-details/certificate-details-issuance/student-certification-date-dialog/student-certification-date-dialog.component';

@NgModule({
    declarations: [
        CertiDegreeComponent,
        ListOfCertificateTableComponent,
        CertificateDetailsComponent,
        CertificateDetailsParametersComponent,
        CertificateDetailsIssuanceComponent,
        StudentCertificateIssuanceTableComponent,
        StudentCertificateIssuancePreviewComponent,
        CertificateDetailsDesignComponent,
        CertificateDetailsPreviewComponent,
        CertificateIssuanceProcessDialogComponent,
        StudentCertificationDateDialogComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        CertiDegreeRoutingModule
    ]
})
export class CertiDegreeModule {}
