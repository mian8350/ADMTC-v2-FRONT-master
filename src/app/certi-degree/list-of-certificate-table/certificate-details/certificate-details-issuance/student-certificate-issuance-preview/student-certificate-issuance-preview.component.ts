import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { SubSink } from 'subsink';
import { ApplicationUrls } from 'app/shared/settings';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ms-student-certificate-issuance-preview',
  templateUrl: './student-certificate-issuance-preview.component.html',
  styleUrls: ['./student-certificate-issuance-preview.component.scss']
})
export class StudentCertificateIssuancePreviewComponent implements OnInit {
  private subs = new SubSink();
  studentSelected: any;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  previewUrls = {
    parchemins_certificate: null,
    block_certificate: null,
    supplement_certificate: null,
  }
  shouldDisplayTab = {
    parchemin: true,
    supplement_certificate: true,
    block_certificate: true,
  }
  processData: any;
  currentProcessId: any;
  certificateProcessPdfs: any;

  constructor(
    private certiDegreeService: CertidegreeService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute,
    ) { }

  ngOnInit() {
    this.route.paramMap.subscribe((param) => {
      this.currentProcessId = param.get('id');
    });
    this.getProcessData();
    this.subs.sink = this.certiDegreeService.getStudentIssuingData$.subscribe((resp) => {
      if (resp) {

        this.studentSelected = resp;
        this.modifyTabDisplayStatus(resp.final_transcript_id.jury_decision_for_final_transcript)
        if(resp.certificate_process_pdfs) {
            this.certificateProcessPdfs = resp.certificate_process_pdfs;
          this.setPreviewUrls(this.certificateProcessPdfs);
        } else {
          this.resetPreviewUrls();
        }
      }
    });


  }

  getProcessData() {
    this.processData = this.certiDegreeService.processData;

  }

  //jury decision is either 'pass', 'failed', 'eliminated' or 'retaking'
  //this basically loops through the keys of displaytab above and change status based on the jury decision
  // if student is pass, only check the pass_for_student field of the 3 certificate_type
  modifyTabDisplayStatus(juryDecisionStatus: string) {
    switch (juryDecisionStatus) {
      case 'pass':
        for (const [key, value] of Object.entries(this.shouldDisplayTab)) {
          //eg.. this.shouldDisplayTab['block_certificate'] = this.processData.certificate_type['block_certificate'].for_pass_student
          this.shouldDisplayTab[key] = this.processData.certificate_type[key].for_pass_student;
        }
        break;
      case 'eliminated':
      case 'failed':
        for (const [key, value] of Object.entries(this.shouldDisplayTab)) {
          this.shouldDisplayTab[key] = this.processData.certificate_type[key].for_fail_student;
        }
        break;
      case 'retaking':
        for (const [key, value] of Object.entries(this.shouldDisplayTab)) {
          this.shouldDisplayTab[key] = this.processData.certificate_type[key].for_retake_student;
        }
    }
  }


  setPreviewUrls(pdfs: any) {
    // go through each value of the object certificate_process_pdfs and change the value to the right URLs
    for (const [key, value] of Object.entries(this.previewUrls)) {
      this.previewUrls[key] = this.imgURLBG(pdfs[key]);
    }

  }

  resetPreviewUrls() {
    this.previewUrls = {
      parchemins_certificate: null,
      block_certificate: null,
      supplement_certificate: null,
    }
    this.certificateProcessPdfs = null
  }

  imgURLBG(src: string) {
    if(src === null) {
      return null;
    }
    const logo = src;
    const result = this.serverimgPath + logo + '#view=fitH';
    return this.sanitizer.bypassSecurityTrustResourceUrl(result);
  }

}
