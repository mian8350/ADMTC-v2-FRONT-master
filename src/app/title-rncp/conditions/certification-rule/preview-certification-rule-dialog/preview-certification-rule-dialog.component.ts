import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { CertificationRuleDocuments } from '../certification-rule.model';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { AuthService } from 'app/service/auth-service/auth.service';
import { environment } from 'environments/environment';
import { UtilityService } from 'app/service/utility/utility.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'ms-preview-certification-rule-dialog',
  templateUrl: './preview-certification-rule-dialog.component.html',
  styleUrls: ['./preview-certification-rule-dialog.component.scss'],
})
export class PreviewCertificationRuleDialogComponent implements OnInit {
  private subs = new SubSink();
  certRuleId: string;
  titleText: string;
  messageText: string;
  headerText: string;
  uploadedDoc: any[] = [];
  titleName: string;
  titleLongName: string;
  checked: boolean;
  docDownloaded = false;
  isWaitingForResponse = false;
  currentUser: any;
  scrollDone = false;
  downloadCondition = true;
  pdfFile;

  constructor(
    public dialogRef: MatDialogRef<PreviewCertificationRuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { callFrom: string; titleId: string; classId: string; titleName: string; titleLongName: string },
    private certificationRuleService: CertificationRuleService,
    public translate: TranslateService,
    private authService: AuthService,
    private utilService: UtilityService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    const studentData = this.authService.getLocalStorageUser();
    this.titleName = this.data.titleName;
    this.titleLongName = this.data.titleLongName;
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
          this.headerText = resp ? resp.header : '';
          this.uploadedDoc = resp ? resp.documents : [];
          this.getPdfFile(resp.documents);
        });
    } else {
      this.subs.sink = this.certificationRuleService.getCertificationRule(this.data.titleId, this.data.classId, false, true).subscribe((resp) => {
        this.isWaitingForResponse = false;
        this.certRuleId = resp ? resp._id : '';
        this.titleText = resp ? resp.title : '';
        this.messageText = resp ? resp.message : '';
        this.headerText = resp ? resp.header : '';
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

  downloadDocument(documentData) {
    window.open(documentData.file_path, '_blank');
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
    this.certificationRuleService.downloadDocumentAsZipFile(this.data.titleId, this.data.classId, false).subscribe((resp) => {
      const url = `${environment.apiUrl}/fileuploads/${resp.pathName}?download=true`.replace('/graphql', '');
      const element = document.createElement('a');
      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', resp.pathName);
      element.click();
      this.docDownloaded = true;
    });
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

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
