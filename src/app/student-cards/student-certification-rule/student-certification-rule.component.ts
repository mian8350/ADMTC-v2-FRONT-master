import { Component, OnInit, Input} from '@angular/core';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { SubSink } from 'subsink';
import { environment } from 'environments/environment';
import { AuthService } from 'app/service/auth-service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import swal from 'sweetalert2';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilityService } from 'app/service/utility/utility.service';
import { Router } from '@angular/router';
import { ApplicationUrls } from 'app/shared/settings';

@Component({
  selector: 'ms-student-certification-rule',
  templateUrl: './student-certification-rule.component.html',
  styleUrls: ['./student-certification-rule.component.scss'],
})
export class StudentCertificationRuleComponent implements OnInit {
  @Input() selectedRncpTitleId: string;
  @Input() selectedRncpTitleName: string;
  @Input() selectedRncpTitleLongName: string;
  @Input() selectedClassId: string;
  @Input() selectedStudentUserId: string;

  private subs = new SubSink();

  certRuleId: string;
  titleText: string;
  messageText: string;
  uploadedDoc: any[] = [];
  acceptanceDate: any;
  titleName: string;
  titleLongName: string;
  checked: boolean;
  docDownloaded = false;
  isWaitingForResponse = false;
  isAccepted: boolean = false;
  currentUser: any;
  pdfFile;
  myInnerHeight = 1920;

  constructor(
    private certificationRuleService: CertificationRuleService,
    public translate: TranslateService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private utilService: UtilityService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.titleName = this.selectedRncpTitleName;
    this.titleLongName = this.selectedRncpTitleLongName;
  }

  ngOnChanges() {
    this.getCertificationRule();
  }

  getCertificationRule() {
    const titleId = this.selectedRncpTitleId;
    const classId = this.selectedClassId;
    const userId = this.selectedStudentUserId;

    this.subs.sink = this.certificationRuleService.getCertificationRuleSentAdmissionTab(titleId, classId, userId).subscribe(resp => {
      this.certRuleId = resp ? resp._id : '';
      this.titleText = resp ? resp.title : '';
      this.messageText = resp ? resp.message : '';
      this.uploadedDoc = resp ? resp.documents : [];

      const accepted_student = resp?.students_accepted?.find(student_accepted => {
        return student_accepted?.student_id?._id === userId
      });

      this.isAccepted = !!accepted_student;
      this.acceptanceDate = resp ? this.getAcceptanceDate(accepted_student?.acceptance_date) : ''

      this.isWaitingForResponse = false;
      this.getPdfFile(this.uploadedDoc);
    });
  }

  getAutomaticHeight() {
    if (this.router.url === '/my-file' || this.router.url.includes('previous-course')) {
      this.myInnerHeight = window.innerHeight - 193;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 369;
      return this.myInnerHeight;
    }
  }

  getPdfFile(documents) {
    if (documents && documents.length) {
      const doc = documents[documents.length - 1]
      if (doc.s3_file_name && this.utilService.getFileExtension(doc?.s3_file_name) === 'pdf') {
        this.pdfFile = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '') + doc.s3_file_name;
      }
    }
  }

  getAcceptanceDate(date: any) {
    if (!date) return

    moment.locale(this.translate.currentLang);

    const duration = moment.duration({hours: environment.timezoneDiff})
    const parseParisTime = moment(date.time_utc, 'HH:mm').add(duration).format('HH:mm');

    let acceptance_date = moment(date.date_utc, 'DD/MM/YYYY').format('DD/MMM/YYYY');
    let acceptance_datetime = acceptance_date + ',' + parseParisTime;

    this.acceptanceDate = acceptance_datetime;
    return moment(acceptance_datetime, 'DD/MMM/YYYY,hh:mm').format('DD MMMM YYYY - hh:mm');
  }
  
  downloadDoc() {
    const titleId = this.selectedRncpTitleId;
    const classId = this.selectedClassId;
    
    this.certificationRuleService.downloadDocumentAsZipFile(titleId, classId).subscribe(
    (resp) => {
      const url = `${environment.apiUrl}/fileuploads/${resp.pathName}?download=true`.replace('/graphql', '');
      const element = document.createElement('a');

      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', resp.pathName);
      element.click();

      this.docDownloaded = true;
    },
    (err) => {
      swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    });
  }

  getSafeUrl(link) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(link);
  }

  downloadCertRule() {
    this.isWaitingForResponse = true;

    const titleId = this.selectedRncpTitleId;
    const classId = this.selectedClassId;
    const userId = this.selectedStudentUserId;

    this.subs.sink = this.certificationRuleService.downloadDocumentCertificationRule(titleId, classId, userId).subscribe((resp) => {
      this.isWaitingForResponse = false;

      if (resp) {
        const url = `${environment.apiUrl}/fileuploads/${resp}?download=true`.replace('/graphql', '');
        const element = document.createElement('a');

        element.href = url;
        element.target = '_blank';
        element.setAttribute('download', resp);
        element.click();

        this.docDownloaded = true;
      }
    })
  }
}
