import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-certificate-details-issuance',
  templateUrl: './certificate-details-issuance.component.html',
  styleUrls: ['./certificate-details-issuance.component.scss'],
})
export class CertificateDetailsIssuanceComponent implements OnInit {
  private subs = new SubSink();
  studentSelected: any;
  isWaitingForResponse = false;
  constructor(private certiDegreeService: CertidegreeService, private router: Router) {}

  ngOnInit() {
    // set selected student to null to prevent data overlapping
    this.certiDegreeService.setStudentIssuingData(null);
    this.subs.sink = this.certiDegreeService.getStudentIssuingData$.subscribe((resp) => {
      if (resp) {
        this.studentSelected = resp;
      }
    });
  }

  downloadSpinner(loadingStatus) {
    this.isWaitingForResponse = loadingStatus;
  }

  leaveDetails() {
    this.router.navigate(['certidegree']);
  }
  goBack() {
    this.certiDegreeService.setCurrentTabDetail('third');
  }
}
