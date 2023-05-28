import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { AuthService } from 'app/service/auth-service/auth.service';
import { environment } from 'environments/environment';
import { UtilityService } from 'app/service/utility/utility.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'ms-certification-rule-pop-up',
  templateUrl: './certification-rule-pop-up.component.html',
  styleUrls: ['./certification-rule-pop-up.component.scss'],
})
export class CertificationRulePopUpComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  certRuleId: string;
  titleText: string;
  messageText: string;
  uploadedDoc: any[] = [];
  titleName: string;
  titleLongName: string;
  header: string;
  checked: boolean;
  docDownloaded = false;
  isWaitingForResponse = false;
  currentUser: any;
  scrollDone = false;
  downloadCondition = true;
  pdfFile;
  pdfS3Name;

  constructor(
    public dialogRef: MatDialogRef<CertificationRulePopUpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      callFrom: string; 
      titleId: string; 
      classId: string; 
      titleName: string; 
      titleLongName: string; 
      userId: string; 
      schoolId: string; 
      isForPC: boolean;
      certificationRuleSentId: string; 
    },
    private certificationRuleService: CertificationRuleService,
    public translate: TranslateService,
    private authService: AuthService,
    private utilService: UtilityService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const studentData = this.authService.getLocalStorageUser();
    this.titleName = this.data.isForPC ? '' : this.data.titleName; // we dont want to show the wrong title passed for PC initially until fetched
    this.titleLongName = this.data.isForPC ? '' : this.data.titleLongName;
    this.currentUser = this.authService.getLocalStorageUser();
    this.isWaitingForResponse = true;
    if (this.data.callFrom === 'global') {
      this.subs.sink = this.certificationRuleService
        .getCertificationRuleSentWithStudent(this.data.titleId, this.data.classId, studentData._id)
        .subscribe((resp) => {
          this.isWaitingForResponse = false;
          this.certRuleId = resp ? resp._id : '';
          this.titleText = resp ? resp.title : '';
          this.messageText = resp ? resp.message : '';
          this.uploadedDoc = resp ? resp.documents : [];
          this.getPdfFile(resp.documents);
        });
    } else if(this.data.isForPC) {
      this.subs.sink = this.certificationRuleService.getOneCertificationRuleSentForPC(null, null, this.data.userId, this.data.schoolId).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          this.titleText = resp ? resp.name : '';
          this.certRuleId = resp ? resp._id : '';
          this.uploadedDoc = resp ? resp.documents : [];
          this.header = this.utilService.cleanHTML(resp.header);
          this.getPdfFile(resp.documents);
          this.titleName = resp?.rncp_id?.short_name || '';
          this.titleLongName = resp?.rncp_id?.long_name || '';
        }
      )
    } else {
      this.subs.sink = this.certificationRuleService
        .getCertificationRule(this.data.titleId, this.data.classId)
        .subscribe((resp) => {
          this.isWaitingForResponse = false;
          this.certRuleId = resp ? resp._id : '';
          this.titleText = resp ? resp.title : '';
          this.messageText = resp ? resp.message : '';
          this.uploadedDoc = resp ? resp.documents : [];
          this.getPdfFile(resp.documents);
        });
    }
  }

  getPdfFile(documents) {
    if (documents && documents.length) {
      for (const doc of documents) {
        if (doc && doc.file_path && this.utilService.getFileExtension(doc.file_path) === 'pdf') {
          this.pdfFile = doc.file_path;
          this.pdfS3Name = doc.s3_file_name;
          break;
        }
      }
    }

    if (!this.pdfFile) {
      this.docDownloaded = true;
    }
  }

  getSafeUrl(link) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(link);
  }

  // scrollComponentAgrement(event) {
  //   if (event) {
  //     const element = event.target;
  //     if (element.scrollHeight - element.scrollTop <= element.clientHeight) {
  //       if (!this.scrollDone) {
  //         this.scrollDone = true;
  //         this.downloadCondition = false;
  //       }
  //     }
  //   }
  // }

  downloadDoc() {
    this.certificationRuleService.downloadDocumentAsZipFile(this.data.titleId, this.data.classId).subscribe(resp => {
      const url = `${environment.apiUrl}/fileuploads/${resp.pathName}?download=true`.replace('/graphql', '');
      const element = document.createElement('a');
      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', resp.pathName);
      element.click();
      this.docDownloaded = true;
    })
  }
  // downloadDoc() {
  //   if (this.uploadedDoc.length > 0) {
  //     this.uploadedDoc.forEach((doc) => {
  //       const element = document.createElement('a');
  //       element.href = doc.file_path;
  //       element.target = '_blank';
  //       element.setAttribute('download', doc.s3_file_name);
  //       element.click();
  //     });
  //     this.docDownloaded = true;
  //   }
  // }

  downloadPDFCertRule() {
    if (this.pdfFile) {
      const url = `${this.pdfFile}?download=true`;
      const element = document.createElement('a');
      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', this.pdfS3Name);
      element.click();
      this.docDownloaded = true;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  submit() {
    if (!this.docDownloaded && this.uploadedDoc.length > 0 && this.checked) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('CERTIFICATION_RULE.SUBMITWITHOUTDOWNLOAD.TITLE'),
        text: this.translate.instant('CERTIFICATION_RULE.SUBMITWITHOUTDOWNLOAD.TEXT'),
        footer: `<span style="margin-left: auto">CERTIFICATION_RULE.SUBMITWITHOUTDOWNLOAD</span>`,
        confirmButtonText: this.translate.instant('CERTIFICATION_RULE.SUBMITWITHOUTDOWNLOAD.CONFIRMBTN'),
      });
    } else if(this.data.isForPC){
      Swal.fire({
        type: 'warning',
        showCancelButton: true,
        allowOutsideClick: false,
        title: this.translate.instant('ACCEPT_CERTIF_RULE.TITLE'),
        html: this.translate.instant('ACCEPT_CERTIF_RULE.TEXT'),
        confirmButtonText: this.translate.instant('ACCEPT_CERTIF_RULE.BUTTON_1'),
        cancelButtonText: this.translate.instant('ACCEPT_CERTIF_RULE.BUTTON_2'),
      }).then(result => {
        if(result.value) {
          const rncp_id = this.data.titleId;
          const class_id = this.data.classId;
          const user_id = this.data.userId;
          const school_id = this.data.schoolId;
          const certification_rule_sent_id = this.certRuleId;
          this.isWaitingForResponse = true;
          this.subs.sink = this.certificationRuleService.userAcceptanceCertificationRule(
            rncp_id, class_id, user_id, school_id, certification_rule_sent_id
          ).subscribe((resp) => {
            if(resp) {
              this.isWaitingForResponse = false;
              Swal.fire({
                type: 'success',
                title: 'Bravo',
                confirmButtonText: this.translate.instant('OK'),
              }).then(() => {
                this.dialogRef.close('cert_rule_check');
              });
            }
          }, (err) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          });
        } else {
          return;
        }
        })
      } else {
      Swal.fire({
        type: 'warning',
        showCancelButton: true,
        allowOutsideClick: false,
        title: this.translate.instant('CERTIFICATION_RULE.RULES_S3.TITLE'),
        html: this.translate.instant('CERTIFICATION_RULE.RULES_S3.TEXT'),
        footer: `<span style="margin-left: auto">CERTIFICATION_RULE.RULES_S3</span>`,
        confirmButtonText: this.translate.instant('CERTIFICATION_RULE.RULES_S3.BUTTON_1'),
        cancelButtonText: this.translate.instant('CERTIFICATION_RULE.RULES_S3.BUTTON_2'),
      }).then(result => {
        if(result.value) {
          this.subs.sink = this.certificationRuleService
          .studentAcceptCertificationRule(this.data.titleId, this.data.classId, this.currentUser._id)
          .subscribe((resp) => {
            Swal.fire({
              allowOutsideClick: false,
              type: 'success',
              title: this.translate.instant('CERTIFICATION_RULE.RULES_S3b.TITLE'),
              text: this.translate.instant('CERTIFICATION_RULE.RULES_S3b.TEXT'),
              footer: `<span style="margin-left: auto">CERTIFICATION_RULE.RULES_S3b</span>`,
              confirmButtonText: this.translate.instant('CERTIFICATION_RULE.RULES_S3b.BUTTON_1'),
            });
            this.dialogRef.close('cert_rule_check');
          });
        } else {
          return;
        }
      })
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
