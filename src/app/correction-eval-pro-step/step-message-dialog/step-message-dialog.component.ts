import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TaskService } from 'app/service/task/task.service';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { UserService } from 'app/service/user/user.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ApplicationUrls } from 'app/shared/settings';
import { DomSanitizer } from '@angular/platform-browser';
import { interval, Observable, of, PartialObserver, Subject } from 'rxjs';

@Component({
  selector: 'ms-step-message-dialog',
  templateUrl: './step-message-dialog.component.html',
  styleUrls: ['./step-message-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class StepMessageDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  paymentPlanMethod: UntypedFormGroup;
  isTitleTrue = false;
  testData;
  studentCount;
  noUsers = false;
  backupTestData;
  specializationId: string;
  blockConditionId: string;
  correctorName = '';

  userTypes = [];
  userCorrectorList = [];
  userList = [];

  memberAssigned = [];

  isGroupTest = false;

  isWaitingForResponse = false;
  isWaitingForUserList = true;
  isMultipleSelected = false;
  isSingleSelected = true;
  dataMemberAssigned = [];
  totalCandidate: any;
  singleCandidate: any;
  depositAmount: any;
  candidateAssignedMember = [];
  campusList = [
    {
      campus: 'PARIS',
      dev_leader: {
        civility: 'MR',
        first_name: 'Rémi',
        last_name: 'Barrault',
      },
    },
    {
      campus: 'NEW YORK',
      dev_leader: {
        civility: 'MRS',
        first_name: 'Michel',
        last_name: 'Lemaître',
      },
    },
    {
      campus: 'Lyon',
      dev_leader: {
        civility: 'MR',
        first_name: 'Léon',
        last_name: 'Blanc',
      },
    },
  ];

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  currentUser: any;
  method: any;
  campus = 'PARIS';
  candidate = '5fe1c81dcae641204052c742';
  validationStepList: any;
  isVideoLink = false;
  generateVideo = true;
  candidateSchool = [];
  buttonDisabled = true;
  ispause = new Subject();
  public time = 125;
  timer: Observable<number>;
  timerObserver: PartialObserver<number>;
  countdownHabis = false;
  count = 5;
  timeout = setInterval(() => {
    if (this.count > 0) {
      this.count -= 1;
    } else {
      clearInterval(this.timeout);
    }
  }, 1000);
  constructor(
    public dialogRef: MatDialogRef<StepMessageDialogComponent>,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    public userService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    /* commented because it is unused

    this.currentUser = this.userService.getLocalStorageUser();
    this.validationStepList = '';
    this.getDataValidation();
    */
  }

  confirmValidation(type) {

    const step = this.data.step;
    const data = {
      type: 'reset',
      data: this.data.type,
    };
    this.dialogRef.close(data);
  }

  closeDialog() {
    const data = {
      type: 'cancel',
      data: this.data.type,
    };
    this.dialogRef.close(data);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  sanitizeVideoUrl(url) {
    let text = url;
    let key = '';
    if (url && url.search('youtube.com/embed/') !== -1) {
      key = text.indexOf('embed/') + 6;
      const message = text.slice(key, text.length);
      text = url ? this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + message) : '';
    } else {
      if (url && url.search('youtube.com') !== -1) {
        key = text.indexOf('=') + 1;
        const message = text.slice(key, text.length);
        text = url ? this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + message) : '';
      } else {
        text = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : '';
      }
    }
    return text;
  }

  getDataValidation() {
    // this.subs.sink = this.candidateService
    //   .getAllStepValidationMessages(this.data.data.school, this.data.data.campus, this.data.step)
    //   .subscribe((resp) => {
    //     if (resp) {
    //       this.validationStepList = resp;
    //       if (this.validationStepList.video_link) {
    //         this.isVideoLink = true;
    //       }
    //     }
    //   });
  }

  messageDialog() {
    let message = '';
    message += this.translate.instant('CANDIDATE_POPUP_C6.CANDIDATE_TEXT', {
      candidateName: this.singleCandidate
        ? this.translate.instant(this.singleCandidate.civility) +
          ' ' +
          this.singleCandidate.first_name +
          ' ' +
          this.singleCandidate.last_name
        : '',
    });

    return message;
  }

  // *************** Function to countdown button submit
  secondsToHms(d) {
    // d = Number(d);
    // const s = Math.floor((d % 25) % 5);
    // let sDisplay = s > 0 ? s + (s === 1 ? '' : '') : '5';

    // sDisplay = sDisplay + 's';
    // if (s === 1) {
    //   this.countdownHabis = true;
    // }
    // if (this.countdownHabis) {
    //   sDisplay = this.translate.instant('I go to step');
    // }
    // return sDisplay;
  }
}
