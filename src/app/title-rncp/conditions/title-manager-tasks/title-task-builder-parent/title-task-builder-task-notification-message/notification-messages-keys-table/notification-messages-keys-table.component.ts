import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { map, tap } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TaskService } from 'app/service/task/task.service';

@Component({
  selector: 'ms-notification-messages-keys-table',
  templateUrl: './notification-messages-keys-table.component.html',
  styleUrls: ['./notification-messages-keys-table.component.scss'],
})
export class NotificationMessagesKeysTableComponent implements OnInit {
  @Input() templateId;
  @Input() stepId;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  dataSource = new MatTableDataSource([]);
  private subs = new SubSink();
  displayedColumns: string[] = ['key', 'description', 'action'];
  isWaitingForResponse = false;
  noData: any;
  scholarPeriodCount;
  dataCount = 0;
  sortValue = null;

  constructor(private translate: TranslateService,
     private rncpTitleService: RNCPTitlesService,
     private taskService: TaskService) {}

  ngOnInit() {
    this.fetchKeysAndPopulateTable();
    this.subs.sink = this.translate.onLangChange.pipe().subscribe((result) => {
      if (result) {
        this.fetchKeysAndPopulateTable();
      }
    });
  }

  fetchKeysAndPopulateTable() {
    this.isWaitingForResponse = true;

    const typeTable = 'message';

    this.subs.sink = this.taskService.getTaskMessageAndNotificationKey(this.translate.currentLang, this.sortValue).subscribe((resp) => {
      if (resp && resp.length > 0) {
        this.dataSource.data = resp;
        this.dataCount = resp.length;
        this.dataSource.paginator = this.paginator;
      }
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      this.isWaitingForResponse = false;
    });
  }

  sortData(sort) {
    this.sortValue = sort.active && sort.direction ? { [sort.active]: sort.direction } : null;
    this.paginator.pageIndex = 0;
    this.fetchKeysAndPopulateTable();
  }

  //handle copying click event
  async onCopyToClipBoard(element: { key: string; description: string }) {
    if (navigator.clipboard) {
      return await navigator.clipboard.writeText(element.key);
    }
  }
}
