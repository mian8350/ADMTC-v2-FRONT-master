import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

@Component({
  selector: 'ms-notification-message-table',
  templateUrl: './notification-message-table.component.html',
  styleUrls: ['./notification-message-table.component.scss'],
})
export class NotificationMessageTableComponent implements OnInit, OnDestroy, AfterViewInit {
  private subs = new SubSink();
  @Input() isPublished: boolean;
  @Input() templateId: any;
  @Input() templateType: any;
  @Input() stepId: any;
  @Output() showDetailsNotifOrMessage: EventEmitter<any> = new EventEmitter();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['ref', 'action'];
  filterColumns: String[] = ['refFilter', 'actionFilter'];
  isLoading = false;

  dummyData = [
    {
      _id: '38392920',
      ref_id: 'Notification N1',
      type: 'notification',
    },
    {
      _id: '3839292032211',
      ref_id: 'Notification N2',
      type: 'message',
    },
  ];
  intVal: NodeJS.Timeout;
  timeOutVal: NodeJS.Timeout;
  dataCount;
  noData;

  constructor(private translate: TranslateService, private formBuilderService: FormBuilderService, private userService: AuthService) {}

  ngOnInit() {
    // Use dummy until API ready
    // this.isLoading = true;
    // this.dataSource.data = this.dummyData;
    // this.dataCount = this.dataSource.data.length;
    // this.dataSource.paginator = this.paginator;
    // this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
    // setTimeout(() => {
    //   this.isLoading = false;
    // }, 1000);

    this.getStepNotificationAndMessages();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getStepNotificationAndMessages();
        }),
      )
      .subscribe();
  }

  getStepNotificationAndMessages() {
    this.isLoading = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    this.subs.sink = this.formBuilderService.getAllStepNotificationsAndMessages(this.templateId, this.stepId, pagination).subscribe(
      (resp) => {
        if (resp && resp.length) {
          const stepNotif = _.cloneDeep(resp);
          this.dataSource.data = stepNotif;
          this.dataCount = resp[0] && resp[0].count_document ? resp[0].count_document : resp.length;
          this.paginator.length = this.dataCount;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isLoading = false;
      },
      (err) => {

        this.isLoading = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  reloadTable() {
    this.paginator.pageIndex = 0;
    this.getStepNotificationAndMessages();
  }

  refSelected(dataa) {


    if (dataa && dataa.type === 'notification') {
      const emittedValue = {
        notification: false,
        message: false,
        data: dataa,
      };

      emittedValue.notification = true;
      emittedValue.message = false;
      this.showDetailsNotifOrMessage.emit(emittedValue);
    } else if (dataa) {
      const emittedMessageValue = {
        notification: false,
        message: false,
        data: dataa,
      };
      emittedMessageValue.notification = false;
      emittedMessageValue.message = true;
      this.showDetailsNotifOrMessage.emit(emittedMessageValue);
    }
  }

  deleteRef(element?) {
    const ref = { ref: element && element.ref_id ? element.ref_id : '' };
    const refSwal = element.type === 'notification'? 'Delete_Notif_S1' : 'Delete_Msg_S1';
    let timeDisabled = 3;
    Swal.fire({
      allowOutsideClick: false,
      type: 'question',
      title: this.translate.instant(refSwal + '.TITLE'),
      html: this.translate.instant(refSwal + '.TEXT', ref),
      showCancelButton: true,
      confirmButtonText: this.translate.instant(refSwal + '.BUTTON1'),
      cancelButtonText: this.translate.instant(refSwal + '.BUTTON2'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant(refSwal + '.BUTTON1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant(refSwal + '.BUTTON1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
        // clearTimeout(this.timeOutVal);
      },
    }).then((isConfirm) => {
      if (isConfirm.value) {
        // call api
        clearTimeout(this.timeOutVal);
        this.isLoading = true;
        this.subs.sink = this.formBuilderService.deleteStepNotificationAndMessage(element._id).subscribe(
          (resp) => {
            this.isLoading = false;
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo!'),
                confirmButtonText: this.translate.instant('OK'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then(() => {
                this.formBuilderService.childrenFormValidationStatus = true;
                this.reloadTable();
                const emittedValue = {
                  notification: false,
                  message: false,
                };
                emittedValue.notification = false;
                emittedValue.message = false;
                this.showDetailsNotifOrMessage.emit(emittedValue);
              });
            }
          },
          (err) => {
            this.isLoading = false;

            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          },
        );
      } else {
        clearTimeout(this.timeOutVal);
        return;
      }
    });
  }

  ngOnDestroy() {
    //
    this.subs.unsubscribe();
  }
}
