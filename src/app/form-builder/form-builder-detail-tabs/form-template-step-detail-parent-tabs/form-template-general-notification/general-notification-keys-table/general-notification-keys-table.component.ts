import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { debounceTime, map, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { UntypedFormControl } from '@angular/forms';
import { MatSort } from '@angular/material/sort';

interface Keys {
  key: string;
  description: string;
}

@Component({
  selector: 'ms-general-notification-keys-table',
  templateUrl: './general-notification-keys-table.component.html',
  styleUrls: ['./general-notification-keys-table.component.scss']
})
export class GeneralNotificationKeysTableComponent implements OnInit {
  @Input() templateId;
  @Input() templateType;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  private subs = new SubSink();
  filterColumns: string[] = ['keyFilter', 'descriptionFilter', 'actionFilter'];
  displayedColumns: string[] = ['key', 'description', 'action'];
  filteredValues: Keys = {
    key: null,
    description: null,
  };

  keyFilter = new UntypedFormControl('');
  descriptionFilter = new UntypedFormControl('');
  
  isWaitingForResponse = false;
  noData: any;
  scholarPeriodCount;
  dataCount = 0;
  sortValue: any;

  constructor(private translate: TranslateService, private formBuilderService: FormBuilderService) {}

  ngOnInit() {
    this.subs.sink = this.translate.onLangChange.pipe().subscribe((result) => {
      if (result) {
        this.fetchKeysAndPopulateTable();
      }
    });
    this.fetchKeysAndPopulateTable();
    this.initFilter();
  }

  initFilter() {
    this.subs.sink = this.keyFilter.valueChanges.pipe(debounceTime(400)).subscribe((text) => {
      this.filteredValues.key = text;
      this.paginator.pageIndex = 0;
      this.fetchKeysAndPopulateTable();
    });

    this.subs.sink = this.descriptionFilter.valueChanges.pipe(debounceTime(400)).subscribe((text) => {
      this.filteredValues.description = text;
      this.paginator.pageIndex = 0;
      this.fetchKeysAndPopulateTable();
    });
  }

  fetchKeysAndPopulateTable() {
    this.isWaitingForResponse = true;
    const filter = {
      ...this.filteredValues,
      form_builder_id: this.templateId
    }
    const generalNotification = {      
      stepID: null,      
    }
    this.subs.sink = this.formBuilderService.getAllFormBuilderKey(filter, this.translate.currentLang, generalNotification.stepID, this.sortValue).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.dataSource.data = resp;
        this.dataCount = resp.length;
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.dataSource.paginator = this.paginator;
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  sortData(sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    this.fetchKeysAndPopulateTable();
  }

  resetSelection() {
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      key: null,
      description: null,
    };

    this.keyFilter.setValue('', { emitEvent: false });
    this.descriptionFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;

    this.fetchKeysAndPopulateTable();
  }

  // handle copying click event
  async onCopyToClipBoard(element: { key: string; description: string }) {
    if (navigator.clipboard) {
      return await navigator.clipboard.writeText(element.key);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
