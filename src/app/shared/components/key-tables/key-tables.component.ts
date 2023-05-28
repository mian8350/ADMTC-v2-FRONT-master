import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CoreService } from 'app/service/core/core.service';
import { map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { TaskService } from 'app/service/task/task.service';

@Component({
  selector: 'ms-key-tables',
  templateUrl: './key-tables.component.html',
  styleUrls: ['./key-tables.component.scss']
})
export class KeyTablesComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  isWaitingForResponse = false;
  dataSource = new MatTableDataSource([]);
  dataCount = 0;
  noData: any;
  templateId: any;
  stepId: any;
  displayedColumns: string[] = ['key', 'description', 'action'];
  filterColumns: string[] = ['keyFilter', 'descriptionFilter', 'actionFilter'];
  private subs = new SubSink();
  sortValue = null;

  constructor(
    private translate: TranslateService,
    private coreService: CoreService,
    private route: ActivatedRoute,
    private taskService: TaskService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe((res) => {
      if (res) {
        const lang = res.get('lang');
        this.translate.use(lang);
      }
    });
    this.populateTableData();
  }

  populateTableData() {
    // // use GetDocumentBuilderListOfKeys query
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.getTaskMessageAndNotificationKey(this.translate.currentLang, this.sortValue).subscribe((resp) => {
      if (resp && resp.length > 0) {
        this.dataSource.data = resp;
        this.dataCount = resp.length;
        this.dataSource.paginator = this.paginator;
      }
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      this.isWaitingForResponse = false;
      this.coreService.sidenavOpen = false;
    });
  }

  async onCopyToClipBoard(element: { key: string; description: string }) {
    if (navigator.clipboard) {
      return await navigator.clipboard.writeText(element.key);
    }
  }

  sortData(sort: Sort) {
    this.sortValue = sort.active && sort.direction ? { [sort.active]: sort.direction } : null;
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

}
