import { AuthService } from './../../service/auth-service/auth.service';
import { MatSort, Sort } from '@angular/material/sort';
import { map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, OnDestroy, ViewChild, Output, EventEmitter } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { ActivatedRoute } from '@angular/router';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDetailDialogComponent } from '../dashboard/document-detail-dialog/document-detail-dialog.component';
import { TestDetailsComponent } from '../dashboard/test-details/test-details.component';

@Component({
  selector: 'ms-acad-kit-quick-search-list',
  templateUrl: './acad-kit-quick-search-list.component.html',
  styleUrls: ['./acad-kit-quick-search-list.component.scss'],
})
export class AcadKitQuickSearchListComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  isWaitingForResponse: boolean = false;
  isLoading: boolean = false;
  dataLoaded = false;
  isReset = false;

  noData: any = false;

  selection = new SelectionModel<any>(true, []);
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  sortValue: any;
  dataCount = 0;
  isCheckedAll: boolean = false;

  rncpTitleId: string = '';
  classId: string = '';
  documentName: string = '';

  payload;

  currentUser;

  displayedColumns: string[] = ['select', 'documentName', 'evaluationName', 'folderName', 'action'];

  dataSelected = [];
  dataUnselect = [];

  @Output() reload = new EventEmitter<boolean>();

  constructor(
    private pageTitleService: PageTitleService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private rncpTitleService: RNCPTitlesService,
    public dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getLocalStorageUser();

    this.pageTitleService.setIcon('text-search-variant');
    this.onLangChangeCheck();
    this.pageTitleService.setTitle(this.translate.instant('NAV.Academic Kit Search List'));

    const queryParams = this.route?.snapshot?.queryParams;
    if (queryParams?.classId) {
      this.classId = queryParams?.classId;
    }

    if (queryParams?.rncpTitleId) {
      this.rncpTitleId = queryParams?.rncpTitleId;
    }

    if (queryParams?.search) {
      this.documentName = queryParams?.search;
    }

    this.payload = this.generatePayload();
    if (this.classId && this.rncpTitleId && this.documentName) {
      this.getAllAcadKitForQuickSearch();
    } else {
      this.dataSource.data = [];
      this.paginator.length = 0;
      this.dataCount = 0;
    }
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getAllAcadKitForQuickSearch();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  onLangChangeCheck() {
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      let titleToolbar;
      if (this.translate.currentLang === 'en') {
        titleToolbar = 'Academic Kit Search List';
      } else {
        titleToolbar = this.translate.instant('NAV.Academic Kit Search List');
      }
      this.pageTitleService.setTitle(titleToolbar);
    });
  }

  generatePayload() {
    return {
      class_id: this.classId ? this.classId : '',
      rncp_title_id: this.rncpTitleId ? this.rncpTitleId : '',
      document_name: this.documentName ? this.documentName : '',
    };
  }

  getAllAcadKitForQuickSearch() {
    const userTypeId = this.currentUser?.entities[0]?.type?._id;

    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.subs.sink = this.rncpTitleService.getAllAcadKitForQuickSearch(this.payload, pagination, this.sortValue, userTypeId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          console.log(resp);
          this.dataSource.data = resp;
          this.paginator.length = resp[0]?.count_document;
          this.dataCount = resp[0]?.count_document;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
        }
        this.isReset = false;
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.dataSelected = [];
      this.dataUnselect = [];
      this.isCheckedAll = false;
    } else {
      this.selection.clear();
      this.dataSelected = [];
      this.dataUnselect = [];
      this.isCheckedAll = true;
      this.dataSource.data.map((row) => {
        if (!this.dataUnselect.includes(row.row_id)) {
          this.selection.select(row.row_id);
        }
      });
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  showOptions(info, row) {
    if (this.isCheckedAll) {
      if (row) {
        if (!this.dataUnselect.includes(row.row_id)) {
          this.dataUnselect.push(row.row_id);
          this.selection.deselect(row.row_id);
        } else {
          const indx = this.dataUnselect.findIndex((list) => list === row.row_id);
          this.dataUnselect.splice(indx, 1);
          this.selection.select(row.row_id);
        }
      }
    } else {
      if (row) {
        if (this.dataSelected && this.dataSelected.length) {
          const dataFilter = this.dataSelected.filter((resp) => resp.row_id === row.row_id);
          if (dataFilter && dataFilter.length < 1) {
            this.dataSelected.push(row);
          } else {
            const indexFilter = this.dataSelected.findIndex((resp) => resp.row_id === row.row_id);
            this.dataSelected.splice(indexFilter, 1);
          }
        } else {
          this.dataSelected.push(row);
        }
      }
    }
  }

  sortData(sort: Sort) {
    console.log('sort', sort);
    if (sort.active === 'document_name') {
      this.sortValue = sort.direction ? { document_name: sort.direction } : null;
    } else if (sort.active === 'evaluation_name') {
      this.sortValue = sort.direction ? { evaluation_name: sort.direction } : null;
    } else if (sort.active === 'folder_name') {
      this.sortValue = sort.direction ? { folder_name: sort.direction } : null;
    }
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllAcadKitForQuickSearch();
      }
    }
  }

  generateTooltip(element) {
    const folderNames = element.join(', ');
    return folderNames;
  }

  viewDocument(element) {
    console.log(element);
    console.log('class', this.classId);
    const resultFrom = element?.folder_name[0];

    if(element?.document_name) {
      this.dialog
        .open(DocumentDetailDialogComponent, {
          disableClose: true,
          width: '850px',
          data: {
            ...element,
            titleId: this.rncpTitleId ? this.rncpTitleId : '',
            classId: this.classId ? this.classId : '',
            _id: element?.document_id,
          },
        })
        .afterClosed()
        .subscribe((resp) => {
          if(resp) {
            // this.reload.emit(true);
            this.getAllAcadKitForQuickSearch();
          }
        });
    } else {
      if (resultFrom.includes('03. ')) {
        this.dialog.open(TestDetailsComponent, {
          width: '600px',
          disableClose: true,
          data: {
            rncpId: this.rncpTitleId ? this.rncpTitleId : '',
            class_id: this.classId ? this.classId : '',
            _id: element?.document_id,
          },
        })
        .afterClosed()
        .subscribe((resp) => {
          if(resp) {
            // this.reload.emit(true);
            this.getAllAcadKitForQuickSearch();
          }
        })
      } else if (resultFrom.includes('06. ')) {
        const url = `/test-correction/${this.rncpTitleId}/${element?.document_id}?school=${element?.school_id?._id}`;
        window.open(url, '_blank');
      }
    }
  }

  resetSelection() {
    this.isReset = true;
    this.selection.clear();
    this.paginator.firstPage();
    this.isCheckedAll = false;
    this.dataSelected = [];
    this.dataUnselect = [];
    this.sortValue = null;
    if (this.isReset) {
      this.getAllAcadKitForQuickSearch();
    }
  }

  onSort(sort: Sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllAcadKitForQuickSearch();
      }
    }
  }

  ngOnDestroy(): void {
    this.pageTitleService.setIcon('');
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
