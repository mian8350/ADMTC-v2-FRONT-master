import { PermissionService } from 'app/service/permission/permission.service';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { CrossCorrectionService } from 'app/service/cross-correction/cross-correction.service';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-cross-correction-table',
  templateUrl: './cross-correction-table.component.html',
  styleUrls: ['./cross-correction-table.component.scss'],
})
export class CrossCorrectionTableComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink();
  dataTutorial: any;
  isTutorialAdded = false;
  tutorialData: any;
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  noData: any;
  dataCount = 0;
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;
  displayedColumns: string[] = ['title', 'class', 'test', 'action'];
  filterColumns: string[] = ['titleFilter', 'classFilter', 'testFilter', 'actionFilter'];
  sortValue = null;

  titleList = [];
  filteredTitles: Observable<any[]>;
  titleFilter = new UntypedFormControl('');

  classList = [];
  filteredClasss: Observable<any[]>;
  classFilter = new UntypedFormControl('');

  testList = [];
  filteredTests: Observable<any[]>;
  testFilter = new UntypedFormControl('');

  crossCorrectionList = [];
  selectedTitleId: string;
  selectedClassId: string;
  selectedTest: string;
  selectedBar = '';

  constructor(
    private router: Router,
    private crossCorrectionService: CrossCorrectionService,
    private utilService: UtilityService,
    public tutorialService: TutorialService,
    public coreService: CoreService,
    public authService: AuthService,
    private pageTitleService: PageTitleService,
    public permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of Cross Correction');
    this.getTitleDropdownList();
    this.getClassDropdownList();
    // this.getTestDropdownList();
    this.checkKeywordTest();
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);

    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  getTitleDropdownList() {
    // get titles dropdown data
    this.subs.sink = this.crossCorrectionService.getAllTitlesDropdown().subscribe((res) => {
      this.titleList = res;
      this.filteredTitles = this.titleFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.titleList.filter((title) => {
            if (searchTxt) {
              return this.utilService
                .simplifyRegex(title.short_name.toLowerCase())
                .includes(this.utilService.simplifyRegex(searchTxt.toLowerCase()));
            }
            return true;
          }),
        ),
      );
    });
  }

  setTitle(title) {
    if (title) {
      this.selectedTitleId = title._id;
      this.filteredClassList(title);
    } else {
      this.selectedTitleId = '';
    }
    if (!this.isReset) {
      this.getCrossCorrectionTableData();
    }
  }

  filteredClassList(title) {
    const filteredList = this.classList.filter((res) => {
      if (res.parent_rncp_title) {
        if (res.parent_rncp_title._id === title._id) {
          return res;
        }
      }
    });
    this.classList = filteredList;
    this.classFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
  }

  setClass(classes) {
    if (classes) {
      this.selectedClassId = classes._id;
    } else {
      this.selectedClassId = '';
    }
    if (!this.isReset) {
      this.getCrossCorrectionTableData();
    }
  }

  checkKeywordTest() {
    this.subs.sink = this.testFilter.valueChanges.pipe(debounceTime(500)).subscribe((keyword) => {
      this.selectedTest = keyword;
      if (!this.isReset) {
        this.getCrossCorrectionTableData();
      }
    });
  }

  getClassDropdownList() {
    // get classes dropdown data
    this.subs.sink = this.crossCorrectionService.getAllClassesDropdown().subscribe((res) => {
      this.classList = res;

      this.filteredClasss = this.classFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.classList.filter((classes) => {
            if (searchTxt) {
              return this.utilService
                .simplifyRegex(classes.name.toLowerCase())
                .includes(this.utilService.simplifyRegex(searchTxt.toLowerCase()));
            }
            return true;
          }),
        ),
      );
    });
  }

  // getTestDropdownList() {
  //   // get tests dropdown data
  //   this.subs.sink = this.crossCorrectionService.getAllTestsDropdown().subscribe((res) => {
  //     this.testList = res;
  //     this.filteredTests = this.testFilter.valueChanges.pipe(
  //       startWith(''),
  //       map((searchTxt: string) =>
  //         this.testList.filter((test) => {
  //           if (searchTxt) {
  //             return this.utilService
  //               .simplifyRegex(test.name.toLowerCase())
  //               .includes(this.utilService.simplifyRegex(searchTxt.toLowerCase()));
  //           }
  //           return true;
  //         }),
  //       ),
  //     );
  //   });
  // }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getCrossCorrectionTableData();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;


    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getCrossCorrectionTableData();
      }
    }
  }

  getCrossCorrectionTableData() {
    this.isWaitingForResponse = true;
    const filter = 'cross_correction';
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.subs.sink = this.crossCorrectionService
      .getTaskCrossCorrectionList(filter, pagination, this.sortValue, this.selectedTitleId, this.selectedClassId, this.selectedTest)
      .subscribe(
        (res) => {

          this.isWaitingForResponse = false;
          this.crossCorrectionList = res;
          this.dataSource.data = this.crossCorrectionList;
          this.dataCount = this.crossCorrectionList.length ? this.crossCorrectionList[0].count_document : 0;
          // this.dataSource.paginator = this.paginator;
          this.noData = this.dataSource.connect().pipe(map((data) => !data || (data && data.length === 0)));
          setTimeout(() => (this.isReset = false), 400);
        },
        (err) => {
          this.isWaitingForResponse = false;
          this.authService.postErrorLog(err);
        },
      );
  }

  openCrossCorrectionDetail(crossCorrectionData: any) {

    this.router.navigate([
      '/crossCorrection',
      'assign-cross-corrector',
      crossCorrectionData.parent_rncp_title._id,
      crossCorrectionData.class_id._id,
      crossCorrectionData._id,
    ]);
  }

  resetFilter() {
    this.titleFilter.setValue('');
    this.classFilter.setValue('');
    this.testFilter.setValue('');

    this.selectedTitleId = '';
    this.selectedClassId = '';
    this.selectedTest = '';

    this.getClassDropdownList();
    this.getTitleDropdownList();
    this.isReset = true;
    this.getCrossCorrectionTableData();
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
