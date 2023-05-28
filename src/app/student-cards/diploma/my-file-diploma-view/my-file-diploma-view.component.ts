import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, OnChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UserProfileData } from 'app/users/user.model';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { ApplicationUrls } from 'app/shared/settings';
import { environment } from 'environments/environment';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ms-my-file-diploma-view',
  templateUrl: './my-file-diploma-view.component.html',
  styleUrls: ['./my-file-diploma-view.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class MyFileDiplomaViewComponent implements OnInit, OnDestroy, OnChanges {
  @Input() studentId = '';
  @Input() schoolId: string;
  @Output() updateStatusViewEdit = new EventEmitter<{type: string, index: number}>();

  private subs = new SubSink();

  userData: UserProfileData;
  acadJourneyId = '';
  private timeOutVal: any;

  diplomaData;
  isUserStudent = false;
  isUserADMTC = false;
  isUserAcadDirMin = false;
  isUserPCDirector = false;
  allowEdit = false;
  datePipe: DatePipe;

  pdfIcon = '../../../../../../assets/img/pdf.png';
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  obtainedDiploma;

  constructor(
    private acadJourneyService: AcademicJourneyService,
    private authService: AuthService,
    private router: Router,
    public translate: TranslateService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private sanitizer: DomSanitizer,
    private utilService: UtilityService
  ) { }

  ngOnInit() {

    this.getDataDiploma();
    this.datePipe = new DatePipe(this.translate.currentLang);
    this.translate.onLangChange.subscribe(
      () => {
        this.datePipe = new DatePipe(this.translate.currentLang);
    });
  }

  ngOnChanges() {
    this.getDataDiploma();
  }

  getDataDiploma() {
    this.isUserStudent = this.utilService.isUserStudent();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.isUserAcadDirMin = this.utilService.isUserAcadDirAdmin();
    this.isUserPCDirector = this.utilService.isUserPCDirector();

    if (this.isUserStudent || this.isUserADMTC || this.isUserAcadDirMin || this.isUserPCDirector) {
      this.allowEdit = true;
    } else {
      this.allowEdit = false;
    }

    this.subs.sink = this.acadJourneyService.getMyDiplomas(this.studentId).subscribe((response) => {

      const temp = _.cloneDeep(response);
      if (temp) {
        if (temp && temp._id) {
          this.acadJourneyId = temp._id;
        }

        if (temp && temp.student_id && temp.student_id.certificate_diploma_details && temp.student_id.certification_process_status === 'certificate_published') {
          this.obtainedDiploma = temp.student_id;
        }

        this.diplomaData = temp;


      } else {
        this.acadJourneyId = null;
        this.diplomaData = null;
      }
    });
  }

  addMyDiploma() {
    this.updateStatusViewEdit.emit({type: 'add', index: null});
  }

  editMyDiploma(diplomaIndex) {
    this.updateStatusViewEdit.emit({type: 'edit', index: diplomaIndex});
  }

  removeMyDiploma(diplomaIndex) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('MY_DIPLOMA.SWAL.DELETE_DIPLOMA.TITLE'),
      text: this.translate.instant('MY_DIPLOMA.SWAL.DELETE_DIPLOMA.TEXT'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      footer: `<span style="margin-left: auto">DELETE_DIPLOMA</span>`,
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.diplomaData.diplomas.splice(diplomaIndex, 1);
        const payload = this.diplomaData;
        payload.student_id = this.studentId;
        delete payload._id
        this.subs.sink = this.acadJourneyService.updateAcademicJourney(this.acadJourneyId, payload).subscribe((resp) => {

          if (resp && resp._id) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('EVENT_S1.TITLE'),
              html: this.translate.instant('diploma deleted'),
              confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
              footer: `<span style="margin-left: auto">EVENT_S1</span>`,
              allowOutsideClick: false,
            });
            this.acadJourneyId = resp._id;
            this.updateStatusViewEdit.emit({type: 'view', index: null});
            // this.router.navigate(['/academic-journeys/my-diploma']);
          }
        });
      }
    });
  }

  translateGraduationDate(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      const date = this.parseUTCtoLocal.transformDate(dateRaw.date, dateRaw.time);
      const datee = date !== 'Invalid date' ? moment(date, 'DD/MM/YYYY').format('MM/DD/YYYY') : '';
      return date !== '' ? this.datePipe.transform(datee, 'dd MMM y') : '';
    } else {
      return '';
    }
  }

  downloadFile(fileUrl: string) {
    // window.open(fileUrl, '_blank');downloadDoc() {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    // a.download = fileUrl;
    a.click();
    a.remove();
  }

  imgURL(src: string) {
    const isPDF = this.utilService.getFileExtension(src).toLocaleLowerCase() === 'pdf' || this.utilService.getFileExtension(src).toLocaleLowerCase() === 'PDF';
    if (isPDF) {
      return this.pdfIcon;
    } else {
      return this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

}
