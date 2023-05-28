import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { DatePipe } from '@angular/common';
import { VerifcationIdentityDialogComponent } from './verification-identity-dialog/verification-identity-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import { ApplicationUrls } from 'app/shared/settings';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import * as moment from 'moment';

@Component({
  selector: 'ms-details-of-certification',
  templateUrl: './details-of-certification.component.html',
  styleUrls: ['./details-of-certification.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe, DatePipe],
})
export class DetailOfCertificationComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData?: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() selectedIndex: any;
  @Input() typeDisplay: boolean;

  @Output() continue = new EventEmitter<boolean>();
  config: MatDialogConfig = {
    disableClose: true,
    width: '600px',
  };

  isStudent = false;
  isADMTC = false;
  isAcadDirAdmin = false;
  isCertifierDirAdmin = false;

  allowEditForm = false;
  studentData: any;
  certificationData: any;
  datePipe: DatePipe;
  myInnerHeight = 600;
  isWaitingForResponse = false;
  statusCard = {
    send_state: false,
    student_decision_state: false,
    certification_state: false,
    send_state_status: '',
    student_decision_state_status: '',
    certification_state_status: '',
  };
  private intVal: any;
  private timeOutVal: any;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  currentProcessId: any;
  isCertificateProcessPublished: boolean = false;

  constructor(
    public dialog: MatDialog,
    private studentService: StudentsService,
    private route: ActivatedRoute,
    public utilService: UtilityService,
    public translate: TranslateService,
    private parseStringDatePipe: ParseStringDatePipe,
    private certiDegreeService: CertidegreeService,
  ) {}

  ngOnInit() {
    // This function is called first to check if the user is coming from task.
    // If so, then we check the title and class of the task.(in case its previous course)
    this.checkIfComingFromTask();

    this.datePipe = new DatePipe(this.translate.currentLang);
    this.translate.onLangChange.subscribe(() => {
      this.datePipe = new DatePipe(this.translate.currentLang);
    });
    this.getDataStudent();
  }

  checkIfComingFromTask() {
    // Check if route has title and class from task, if yes then we display the data based on that.
    if (this.route && this.route.snapshot) {
      const queryParams = this.route.snapshot.queryParams;

      if (queryParams.taskTitle && queryParams.taskClass && queryParams.taskSchool) {
        this.titleId = queryParams.taskTitle;
        this.classId = queryParams.taskClass;
        this.schoolId = queryParams.taskSchool;

      }
    }
  }

  ngOnChanges() {
    this.subs.unsubscribe();
    this.checkIfComingFromTask();
    this.getDataStudent();
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }

  getDataStudent() {
    // ************ Get Data User for permission of button
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.isCertifierDirAdmin = this.utilService.isUserCRDirAdmin();
    this.isStudent = this.utilService.isUserStudent();

    if (this.studentPrevCourseData) {
      this.subs.sink = this.studentService
        .getStudentsPrevCourseDetailCertification(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((response) => {
          // student's previous course data
          if (response && response[0]) {
            this.formatAndSetDataFromResponse(response[0]);
          }
        });
    } else if (
      this.route &&
      this.route.snapshot &&
      this.route.snapshot.queryParams &&
      this.route.snapshot.queryParams.taskTitle &&
      this.route.snapshot.queryParams.taskClass &&
      this.route.snapshot.queryParams.taskSchool
    ) {
      // If coming from task to my file as student, then it will check the title, class, school incase its for previous course
      this.subs.sink = this.studentService
        .getStudentsPrevCourseDetailCertification(this.schoolId, this.titleId, this.classId, this.studentId)
        .subscribe((response) => {
          if (response && response[0]) {
            this.formatAndSetDataFromResponse(response[0]);
          }
        });
    } else {
      this.subs.sink = this.studentService.getStudentsDetailCertification(this.studentId).subscribe((response) => {
        this.formatAndSetDataFromResponse(response);
      });
    }
  }

  formatAndSetDataFromResponse(studentData: any) {
    // since certificate_process_pdfs is an array and can be multiple,
    // find one that has an the same title and class as the input
    let foundProcessPdf;
    if (studentData && studentData.certificate_process_pdfs && studentData.certificate_process_pdfs.length) {
      foundProcessPdf = studentData.certificate_process_pdfs.find(
        (process) =>
          process.certificate_process_id.rncp_id._id === this.titleId && process.certificate_process_id.class_id._id === this.classId,
      );
    }
    studentData = { ...studentData, certificate_process_pdfs: foundProcessPdf };
    this.studentData = _.cloneDeep(studentData);
    this.currentProcessId =
      studentData.certificate_process_pdfs && studentData.certificate_process_pdfs.certificate_process_id
        ? studentData.certificate_process_pdfs.certificate_process_id._id
        : null;
    this.isCertificateProcessPublished =
      studentData.certificate_process_pdfs &&
      studentData.certificate_process_pdfs.certification_process_status &&
      studentData.certificate_process_pdfs.certification_process_status === 'certificate_published'
        ? true
        : false;
    this.setDataStudent();
  }

  setDataStudent() {
    this.processStatusCard();
    if (this.studentData.rncp_title && this.studentData.rncp_title.journal_date) {
      // const date = this.parseStringDatePipe.transform(this.studentData.rncp_title.journal_date);
      // this.studentData.rncp_title.journal_date = this.datePipe.transform(date);
      const date = this.parseStringDatePipe.transformDDMMYYYY(this.studentData.rncp_title.journal_date);
      this.studentData.rncp_title.journal_date = this.datePipe.transform(date);
    }
    if (this.studentData.date_of_birth) {
      const date = this.parseStringDatePipe.transform(this.studentData.date_of_birth);
      this.studentData.date_of_birth = this.datePipe.transform(date);
    }

  }

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 401;
    return this.myInnerHeight;
  }

  // ************** Called on init to check the status of certification
  processStatusCard() {

    // Reset first, so if triggered by ngonchanges
    this.statusCard = {
      send_state: false,
      student_decision_state: false,
      certification_state: false,
      send_state_status: this.translate.instant('detail_of_certification.status_card.sent_to_student'),
      student_decision_state_status: this.translate.instant('detail_of_certification.status_card.detail_confirmed'),
      certification_state_status: this.translate.instant('detail_of_certification.status_card.certificate_issued'),
    };

    this.allowEditForm = false;
    if (this.studentData) {
      switch (this.studentData.identity_verification_status) {
        case 'not_sent':
          this.statusCard.send_state = false;
          this.statusCard.student_decision_state = false;
          this.statusCard.certification_state = false;
          if (this.isADMTC || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'sent_to_student':
          this.statusCard.send_state = true;
          this.statusCard.student_decision_state = false;
          if (this.isADMTC || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'details_confirmed':
          this.statusCard.send_state = true;
          this.statusCard.student_decision_state = true;
          if (this.isADMTC || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        default:
          break;
      }

      // check if the certifate status is published to change the right most card icon
      if (this.isCertificateProcessPublished) {
        this.statusCard.certification_state = true;
        if (this.isADMTC || this.isStudent) {
          this.allowEditForm = true;
        }
      }



    }
  }

  getTranslatedDate(dateObject) {
    if (dateObject && dateObject.year) {
      const date = new Date(dateObject.year, dateObject.month - 1, dateObject.date);
      return this.datePipe.transform(date);
    }
    return this.datePipe.transform(new Date());
  }

  getCetificateIssuanceDate(): string {
    if (this.studentData.certificate_issued_on) {
      const dateString = this.getTranslatedDate(this.studentData.certificate_issued_on);
      return dateString;
    }
    return '';
  }

  revisionData() {
    this.subs.sink = this.dialog
      .open(VerifcationIdentityDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          studentData: this.studentData,
          indexTab: this.selectedIndex,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        this.processStatusCard();
        this.getDataStudent();
      });
  }

  confirmVerification() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('VERIFY_SX.TITLE'),
      html: this.translate.instant('VERIFY_SX.TEXT'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('VERIFY_SX.BUTTON_1'),
      cancelButtonText: this.translate.instant('VERIFY_SX.BUTTON_2'),
      footer: `<span style="margin-left: auto">VERIFY_SX</span>`,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('VERIFY_SX.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('VERIFY_SX.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.isWaitingForResponse = true;
        // Check if using previousdata, then we send the title and class id of previous data
        // If data from using title and class, then we send the tasktitle, and taskclass
        // If user directly using my file without task, then we do not send the title and class
        let titleId = null;
        let classId = null;
        if (this.studentPrevCourseData) {
          (titleId = this.studentPrevCourseData.rncp_title._id), (classId = this.studentPrevCourseData.current_class._id);
        } else if (
          this.route &&
          this.route.snapshot &&
          this.route.snapshot.queryParams &&
          this.route.snapshot.queryParams.taskTitle &&
          this.route.snapshot.queryParams.taskClass
        ) {
          titleId = this.route.snapshot.queryParams.taskTitle;
          classId = this.route.snapshot.queryParams.taskClass;
        }

        this.subs.sink = this.studentService
          .UpdateStudentIdentityVerificationStatus(this.studentId, 'details_confirmed', titleId, classId)
          .subscribe((resp) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
            });
            this.processStatusCard();
            this.getDataStudent();

          });
      }
    });
  }

  revisionAllowed() {

    if (
      (this.studentData.identity_verification_status === 'sent_to_student' ||
        this.studentData.identity_verification_status === 'due_date_passed') &&
      (this.isADMTC || this.isStudent)
    ) {
      return true;
    }
    return false;
  }

  downloadStudentPDFCertificate() {
    const is_download_multiple = false;
    let conditions = [this.studentId, this.studentData, this.isCertificateProcessPublished, this.currentProcessId];
    //if any of the conditions above is false, return;
    if (!conditions.every((condition) => condition)) {
      return;
    }
    this.isWaitingForResponse = true;
    this.subs.sink = this.certiDegreeService
      .downloadCertificatePdfSingle(this.currentProcessId, this.studentData.rncp_title._id, this.studentData._id)
      .subscribe(
        (list) => {
          this.isWaitingForResponse = false;
          if (list) {
            const result = this.serverimgPath + list;

            const a = document.createElement('a');
            a.target = 'blank';
            a.href = `${result}?download=true`.replace('/graphql', '');
            a.click();
            a.remove();
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo !'),
            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
        },
      );
  }
}
