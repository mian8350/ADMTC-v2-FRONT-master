import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ApplicationUrls } from 'app/shared/settings';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { DerogationDiplomaDialogComponent } from './derogation-diploma-dialog/derogation-diploma-dialog.component';

@Component({
  selector: 'ms-derogation-diploma-view',
  templateUrl: './derogation-diploma-view.component.html',
  styleUrls: ['./derogation-diploma-view.component.scss'],
})
export class DerogationDiplomaViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() studentId = '';
  @Input() schoolId: string;

  private subs = new SubSink();
  private timeOutVal: any;

  pdfIcon = '../../../../../../assets/img/pdf.png';
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  isUserStudent = false;
  isUserADMTC = false;
  isUserAcadDirMin = false;
  isUserPCDirector = false;
  allowEdit = false;

  acadJourneyId;
  acadJourneyData;
  derogationsData = [];
  isWaitingForResponse = false;

  constructor(
    private acadJourneyService: AcademicJourneyService,
    public translate: TranslateService,
    private sanitizer: DomSanitizer,
    private utilService: UtilityService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {

    this.getDataDerogation();
  }

  ngOnChanges() {
    this.getDataDerogation();
  }

  getDataDerogation() {
    this.isUserStudent = this.utilService.isUserStudent();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.isUserAcadDirMin = this.utilService.isUserAcadDirAdmin();
    this.isUserPCDirector = this.utilService.isUserPCDirector();

    if (this.isUserStudent || this.isUserADMTC || this.isUserAcadDirMin || this.isUserPCDirector) {
      this.allowEdit = true;
    } else {
      this.allowEdit = false;
    }

    this.subs.sink = this.acadJourneyService.getMyDerogation(this.studentId).subscribe((response) => {

      const temp = _.cloneDeep(response);
      if (temp) {
        if (temp && temp._id) {
          this.acadJourneyId = temp._id;
        }
        this.acadJourneyData = temp;
        this.derogationsData = this.acadJourneyData.derogations ? this.acadJourneyData.derogations : [];
      } else {
        this.acadJourneyId = null;
        this.acadJourneyData = null;
        this.derogationsData = [];
      }
    });
  }

  addMyDerogation() {
    this.subs.sink = this.dialog.open(DerogationDiplomaDialogComponent, {
      disableClose: true,
      width: '700px',
      data: {
        type: 'add',
        isUpdate: false
      }
    }).afterClosed().subscribe(resp => {

      if (resp) {

        this.derogationsData.push(resp);
        this.updateDerogationFile();
      }
    })
  }

  editMyDerogation(derogationData, derogationIndex) {
    this.subs.sink = this.dialog.open(DerogationDiplomaDialogComponent, {
      disableClose: true,
      width: '500px',
      data: {
        type: 'edit',
        isUpdate: true,
        derogation: derogationData
      }
    }).afterClosed().subscribe(resp => {

      if (resp) {

        this.derogationsData[derogationIndex] = resp;
        this.updateDerogationFile();
      }
    })
  }

  removeMyDerogation(derogationIndex) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DELETE_DEROGATION.TITLE'),
      text: this.translate.instant('DELETE_DEROGATION.TEXT'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      footer: `<span style="margin-left: auto">DELETE_DEROGATION</span>`,
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
        if (this.derogationsData && this.derogationsData[derogationIndex]) {
          this.derogationsData.splice(derogationIndex, 1);
          this.updateDerogationFile();
        }
      }
    });
  }

  downloadFile(fileUrl: string) {

    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  imgURL(src: string) {
    const isPDF =
      this.utilService.getFileExtension(src).toLocaleLowerCase() === 'pdf' ||
      this.utilService.getFileExtension(src).toLocaleLowerCase() === 'PDF';
    if (isPDF) {
      return this.pdfIcon;
    } else {
      return this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src);
    }
  }

  updateDerogationFile() {
    const payload = {
      student_id: this.studentId,
      derogations: this.derogationsData
    }
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadJourneyService.updateAcademicJourney(this.acadJourneyId, payload).subscribe(resp => {
      this.isWaitingForResponse = false;

      if (resp) {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
          confirmButtonText: this.translate.instant('OK')
        })
      }
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
