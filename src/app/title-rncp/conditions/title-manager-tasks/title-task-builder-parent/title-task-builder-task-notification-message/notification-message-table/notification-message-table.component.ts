import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TaskService } from 'app/service/task/task.service';
import { map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-notification-message-table',
  templateUrl: './notification-message-table.component.html',
  styleUrls: ['./notification-message-table.component.scss'],
})
export class NotificationMessageTableComponent implements OnInit, OnDestroy, AfterViewInit {
  private subs = new SubSink();
  @Input() templateId: any;
  @Input() stepId: any;
  @Input() isViewTask;
  @Output() showDetailsNotifOrMessage: EventEmitter<any> = new EventEmitter();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['ref', 'action'];
  filterColumns: String[] = ['refFilter', 'actionFilter'];
  isLoading = false;

  dummyData = [
    {
      _id: '38392920',
      ref: 'Notification N1',
      type: 'Notif',
    },
    {
      _id: '3839292032211',
      ref: 'Notification N2',
      type: 'Message',
    },
  ];
  intVal: NodeJS.Timeout;
  timeOutVal: NodeJS.Timeout;
  dataCount;
  noData;
  taskId;

  constructor(
    private translate: TranslateService,
    private rncpTitleService: RNCPTitlesService,
    private route: ActivatedRoute,
    private taskService: TaskService,
  ) {}

  ngOnInit() {
    this.taskId = this.route.snapshot.queryParams['taskId'];
    this.getNotificationAndMessages();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getNotificationAndMessages();
        }),
      )
      .subscribe();
  }

  getNotificationAndMessages() {
    this.isLoading = true;
    const filter = { task_builder_id: this.taskId };
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.subs.sink = this.rncpTitleService.getAllTaskBuilderNotificationAndMessages(filter,pagination).subscribe(
      (resp) => {
        this.isLoading = false;
        if (resp && resp.length) {
          this.dataSource.data = resp;
          this.dataCount = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;
        } else {
          this.dataSource.data = [];
          this.dataCount = 0;
          this.paginator.length = 0;
        }
      },
      (error) => {

        this.isLoading = false;
        this.dataSource.data = [];
        this.paginator.length = 0;
        this.dataCount = 0;
      },
    );
  }

  reloadTable() {
    this.getNotificationAndMessages();
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
    let timeDisabled = 5;
    Swal.fire({
      allowOutsideClick: false,
      type: 'warning',
      title: this.translate.instant('SWEETALERT.TITLE'),
      html: this.translate.instant('SWEETALERT.TEXT'),
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + ` (${timeDisabled})` + ' sec';
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
          Swal.enableConfirmButton();
          // clearTimeout(time);
          clearInterval(this.intVal);
        }, timeDisabled * 1000);
        // clearTimeout(this.timeOutVal);
      },
    }).then((isConfirm) => {
      if (isConfirm.value) {
        // call api
        this.isLoading = true;
        this.subs.sink = this.taskService.deleteTaskBuilderNotificationAndMessage(element._id).subscribe(
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
                this.reloadTable();
                let emittedValue = {
                  notification: false,
                  message: false,
                };
                emittedValue.notification = false;
                emittedValue.message = false;
                this.showDetailsNotifOrMessage.emit(emittedValue);
              });
            }
          },
          (error) => {
            this.isLoading = false;

          },
        );
      }
    });
  }

  ngOnDestroy() {
    //
    this.subs.unsubscribe();
  }
}
