import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CoreService } from 'app/service/core/core.service';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { map , debounceTime} from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

interface Keys {
  key: string;
  description: string;
}
@Component({
  selector: 'ms-key-table-window',
  templateUrl: './key-table-window.component.html',
  styleUrls: ['./key-table-window.component.scss'],
})
export class KeyTableWindowComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  isWaitingForResponse = false;
  dataSource = new MatTableDataSource([]);
  dataCount = 0;
  noData: any;
  templateId: any;
  stepId: any;
  templateType: any;
  displayedColumns: string[] = ['key', 'description', 'action'];
  filterColumns: string[] = ['keyFilter', 'descriptionFilter', 'actionFilter'];
  private subs = new SubSink();
  sortValue = null;
  filteredValues: Keys = {
    key: null,
    description: null,
  };
  keyFilter = new UntypedFormControl('');
  descriptionFilter = new UntypedFormControl('');  
  dummyData = [
    {
      key: '${user_civility}',
      description: 'description of civility',
    },
    {
      key: '${user_first_name}',
      description: 'description of user first name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
  ];

  constructor(
    private translate: TranslateService,
    private coreService: CoreService,
    private route: ActivatedRoute,
    private formBuilderService: FormBuilderService,
  ) {}

  ngOnInit() {
    this.subs.sink = this.route.queryParamMap.subscribe((res) => {
      if (res) {
        const lang = res.get('lang');
        this.stepId = res.get('stepId')
        this.translate.use(lang);
      }
    });
    this.populateTableData();
    this.initFilter();
  }

  initFilter() {
    this.subs.sink = this.keyFilter.valueChanges.pipe(debounceTime(400)).subscribe((text: any) => {
      this.filteredValues.key = text;
      this.paginator.pageIndex = 0;
      this.populateTableData();

    });

    this.subs.sink = this.descriptionFilter.valueChanges.pipe(debounceTime(400)).subscribe((text: any) => {
      this.filteredValues.description = text;
      this.paginator.pageIndex = 0;
      this.populateTableData();

    });
  }


  populateTableData() {
    this.isWaitingForResponse = true;
    const filter = {
      ...this.filteredValues,
      form_builder_step_id: this.stepId
    }
    this.subs.sink = this.formBuilderService.getAllFormBuilderKey(filter, this.translate.currentLang, this.stepId, this.sortValue).subscribe(
      (resp) => {
        if (resp) {
          this.dataSource.data = resp;
          this.dataCount = resp.length;
          this.dataSource.paginator = this.paginator;
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isWaitingForResponse = false;
        this.coreService.sidenavOpen = false;
      },
      (err) => {
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isWaitingForResponse = false;
        this.coreService.sidenavOpen = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  resetSelection() {
    this.paginator.pageIndex = 0;
    // this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      key: null,
      description: null,
    };

    this.keyFilter.setValue('', { emitEvent: false });
    this.descriptionFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;

    this.populateTableData();
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

    ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
