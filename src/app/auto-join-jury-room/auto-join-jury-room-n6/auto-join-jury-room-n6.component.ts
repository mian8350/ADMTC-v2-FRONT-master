import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConnectedSchoolComponent } from 'app/companies/connected-school/connected-school.component';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';

@Component({
  selector: 'ms-auto-join-jury-room-n6',
  templateUrl: './auto-join-jury-room-n6.component.html',
  styleUrls: ['./auto-join-jury-room-n6.component.scss'],
  providers: [ParseUtcToLocalPipe]
})
export class AutoJoinJuryRoomN6Component implements OnInit, OnDestroy {
  private subs = new SubSink();
  juryId;
  userId;
  studentId;
  token;
  isRehearsal;
  private timeOutVal: any;

  sessionData;

  constructor(
    private route: ActivatedRoute,
    private juryService: JuryOrganizationService,
    private translate: TranslateService,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private router: Router,
  ) { }

  ngOnInit() {

    this.juryId = this.route.snapshot.queryParamMap.get('juryId');
    this.userId = this.route.snapshot.queryParamMap.get('userId');
    this.studentId = this.route.snapshot.queryParamMap.get('studentId');
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.isRehearsal = this.route.snapshot.queryParamMap.get('isRehearsal');

    if (this.token) {
      localStorage.setItem('admtc-token-encryption', JSON.stringify(this.token));
    }






    // Check if its rehearsal join, or normal join
    if (this.isRehearsal) {

      this.joinRehearsalRoom();
    } else {
      this.getSessionData();
    }
  }

  getSessionData() {
    this.subs.sink = this.juryService.getOneScheduleJuryJoinRoom(this.juryId, this.studentId).subscribe(resp => {
      const temp = _.cloneDeep(resp);
      if (temp && temp.time) {
        const time = temp.time;
        if (time && time.date && time.start && time.finish) {
          temp.time.utcDate = time.date;
          temp.time.utcStart = time.start;
          temp.time.utcFinish = time.finish;
          temp.time.date = this.convertUTCToLocalDate({ date: time.date, time_start: time.start });
          temp.time.start = this.parseUtcToLocal.transform(time.start);
          temp.time.finish = this.parseUtcToLocal.transform(time.finish);
        }
      } else {
        this.router.navigate(['/rncpTitles']);
      }

      this.sessionData = temp;


      this.launchSession(this.sessionData);
    })
  }

  launchSession(row) {

    if (
      ((row.students && row.students.student_id && row.students.student_id._id) ||
        (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id)) &&
      row._id &&
      row.time
    ) {
      if (!this.isMeetingEnded(row)) {
        if (this.isMeetingStarted(row)) {
          const timeDiff = this.calculateTimeDiff(row);
          if (row.students && row.students.student_id && row.students.student_id._id) {
            this.subs.sink = this.juryService.launchJurySessionForJury(row._id, row.students.student_id._id, timeDiff).subscribe((resp) => {
              if (resp) {
                window.open(resp.meetingURL, '_self');
              }
            });
          } else if (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id) {
            this.subs.sink = this.juryService
              .launchJurySessionForJuryGroup(row._id, row.test_groups.group_id._id, timeDiff)
              .subscribe((resp) => {
                if (resp) {
                  window.open(resp.meetingURL, '_self');
                }
              });
          }
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('JURY_S27.TITLE'),
            html: this.translate.instant('JURY_S27.TEXT'),
            confirmButtonText: this.translate.instant('JURY_S27.BUTTON'),
          }).then((resp) => {
            // this.router.navigate(['/rncpTitles']);
            window.open('https://inclass.org/', '_self');
          })
        }
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('JURY_S28.TITLE'),
          html: this.translate.instant('JURY_S28.TEXT'),
          confirmButtonText: this.translate.instant('JURY_S28.BUTTON'),
        }).then((resp) => {
          // this.router.navigate(['/rncpTitles']);
          window.open('https://inclass.org/', '_self');
        })
      }
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Error'),
        html: this.translate.instant('Data is Not Complete'),
        confirmButtonText: this.translate.instant('OK'),
      }).then(resp => {
        // this.router.navigate(['/rncpTitles']);
        window.open('https://inclass.org/', '_self');
      })
    }
  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.toISOString();
  }

  isBeforeMeetingStarted(row) {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));

    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time_start = row.time.utcStart;
    const startSession = moment(date + time_start, 'DD/MM/YYYYHH:mm');
    const startSessionMinus15Minute = moment(startSession).subtract(15, 'minutes');

    return today.isBefore(startSessionMinus15Minute);
  }

  calculateDateTimeDiff(row): number {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));

    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time_start = row.time.utcStart;
    const startSession = moment(date + time_start, 'DD/MM/YYYYHH:mm').subtract(15, 'minutes');

    return startSession.diff(today, 'minutes');
  }

  calculateTimeDiff(row): number {
    const hour = moment().hour();
    const minute = moment().minute();

    const currentTime = moment(`${hour.toString()}:${minute.toString()}`, 'HH:mm:ss');
    const startSession = moment(row.time.start, 'HH:mm');
    const endSession = moment(row.time.finish, 'HH:mm');
    const duration = moment(endSession).diff(startSession, 'minutes');

    // if duration from current time to start time is more than 0, return that duration
    if (moment(startSession).diff(currentTime, 'minutes') >= 0) {
      return moment(startSession).diff(currentTime, 'minutes') + duration;
    } else {
      // return duration from current time to end time
      return moment(endSession).diff(currentTime, 'minutes');
    }
  }

  isMeetingEnded(row) {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time = row.time.utcFinish;
    const startSession = moment(date + row.time.utcStart, 'DD/MM/YYYYHH:mm');
    const stopSession = moment(date + time, 'DD/MM/YYYYHH:mm').add(15, 'minutes');

    if (stopSession.isBefore(startSession)) {
      stopSession.add(1, 'day');
    }

    return today.isAfter(stopSession);
  }

  isMeetingStarted(row) {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
    const todayPlus15Min = moment(today).add(15, 'minutes');
    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time_start = row.time.utcStart;
    const time_finish = row.time.utcFinish;
    const startSession = moment(date + time_start, 'DD/MM/YYYYHH:mm');
    const stopSession = moment(date + time_finish, 'DD/MM/YYYYHH:mm').add(15, 'minutes');




    if (stopSession.isBefore(startSession)) {
      stopSession.add(1, 'day');
    }

    return todayPlus15Min.isAfter(startSession) && today.isBefore(stopSession);
  }

  joinRehearsalRoom() {
    this.subs.sink = this.juryService.JoinRehearsalRoom(this.juryId).subscribe((resp) => {

      if (resp) {
        window.open(resp.meetingURL, '_self');
      }
    }, (err) => {
      window.open('https://inclass.org/', '_self');
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
