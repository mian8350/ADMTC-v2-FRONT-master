import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { CreateClassDialogComponent } from './create-class-dialog/create-class-dialog.component';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { map, switchMap, take } from 'rxjs/operators';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'ms-class',
  templateUrl: './class.component.html',
  styleUrls: ['./class.component.scss'],
})
export class ClassComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['name', 'description', 'allow_job_description', 'allow_problematic', 'allow_mentor_evaluation', 'header', 'action'];
  filterColumns: string[] = ['nameFilter', 'descriptionFilter', 'jobFilter', 'problematicFilter', 'mentorFilter', 'headerFilter', 'actionFilter'];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @Input() rncpId = '';
  @Output() passClass = new EventEmitter();
  @Output() updateClass = new EventEmitter();
  private timeOutVal: any;
  private intVal: any;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private subs = new SubSink();
  rncpTitles: any = [];
  classList: any[] = [];
  titleName: string;
  nameFilter = new UntypedFormControl('');
  descriptionFilter = new UntypedFormControl('');
  jobFilter = new UntypedFormControl('AllM');
  problematicFilter = new UntypedFormControl('AllM');
  mentorFilter = new UntypedFormControl('AllM');
  headerFilter = new UntypedFormControl('AllM');
  jobFilterList = ['AllM', 'Active', 'Not Active'];
  problematicFilterList = ['AllM', 'Active', 'Not Active'];
  mentorFilterList = ['AllM', 'Active', 'Not Active'];
  headerFilterList = ['AllM', 'Yes', 'No'];
  filteredValues = {
    name: '',
    description: '',
    allow_job_description: 'AllM',
    allow_problematic: 'AllM',
    allow_mentor_evaluation: 'AllM',
    is_class_header: 'AllM'
  };

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;
  isWaitingForResponse = false;
  noData: any;
  isPermission: any;
  currentPage;

  constructor(
    private rncpTitlesService: RNCPTitlesService,
    public coreService: CoreService,
    private dialog: MatDialog,
    private translate: TranslateService,
    public tutorialService: TutorialService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.initFilter();
    this.getFullData();
    this.getTitleName();
    this.getInAppTutorial('List of Class');
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  getTitleName() {
    this.subs.sink = this.rncpTitlesService.getTitleShortName(this.rncpId).subscribe((resp) => {
      if (resp && resp.short_name) {
        this.titleName = resp.short_name;
      }
    });
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.authService.getLocalStorageUser();
    const userType = currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  sortData(event) {}

  initFilter() {
    this.subs.sink = this.nameFilter.valueChanges.subscribe((name) => {
      this.filteredValues['name'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.descriptionFilter.valueChanges.subscribe((name) => {
      this.filteredValues['description'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.jobFilter.valueChanges.subscribe((name) => {
      this.filteredValues['allow_job_description'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.problematicFilter.valueChanges.subscribe((name) => {
      this.filteredValues['allow_problematic'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.mentorFilter.valueChanges.subscribe((name) => {
      this.filteredValues['allow_mentor_evaluation'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.headerFilter.valueChanges.subscribe((header) => {
      this.filteredValues['is_class_header'] = header;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string): string => {
      switch (sortHeaderId) {
        case 'name': {
          if (typeof data[sortHeaderId] === 'string') {
            return data[sortHeaderId].toLocaleLowerCase();
          }
          return data[sortHeaderId];
        }
        case 'description': {
          if (typeof data[sortHeaderId] === 'string') {
            return data[sortHeaderId].toLocaleLowerCase();
          }
          return data[sortHeaderId];
        }
        case 'allow_job_description': {
          if (data.allow_job_description === 'active') {
            return '1';
          } else {
            return '2';
          }
        }
        case 'allow_problematic': {
          if (data.allow_problematic === 'active') {
            return '1';
          } else {
            return '2';
          }
        }
        case 'allow_mentor_evaluation': {
          if (data.allow_mentor_evaluation === 'active') {
            return '1';
          } else {
            return '2';
          }
        }
        case 'header': {
          if (data.is_class_header) {
            return '1';
          } else {
            return '2';
          }
        }
      }
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.classList) {
      this.dataSource.data = changes.classList.currentValue;
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      this.dataSource.paginator = this.paginator;
      this.dataSource.filterPredicate = this.customFilterPredicate();
    }
  }

  getFullData(from?) {
    this.isWaitingForResponse = true;
    this.classList = [];
    this.subs.sink = this.rncpTitlesService
      .getClassByRncpTitle(this.rncpId)
      .pipe(
        switchMap((val) => {
          const classess = val.map((element: { _id: string }) => {
            return this.rncpTitlesService.getClassById(element._id).pipe(take(1));
          });
          return classess && classess.length ? forkJoin(classess) : of([]);
        }),
        map((value) => {
          return value;
        }),
      )
      .subscribe((dataClass) => {
        this.isWaitingForResponse = false;
        const tempClass = dataClass.map((data) => {
          let allow_job_description;
          let allow_mentor_evaluation;
          let allow_problematic;

          if (data.allow_job_description) {
            allow_job_description = 'active';
          } else {
            allow_job_description = 'not active';
          }

          if (data.allow_mentor_evaluation) {
            allow_mentor_evaluation = 'active';
          } else {
            allow_mentor_evaluation = 'not active';
          }

          if (data.allow_problematic) {
            allow_problematic = 'active';
          } else {
            allow_problematic = 'not active';
          }

          return {
            description: data.description,
            allow_job_description: allow_job_description,
            allow_mentor_evaluation: allow_mentor_evaluation,
            name: data.name,
            allow_problematic: allow_problematic,
            _id: data._id,
            type_evaluation: data.type_evaluation,
            is_class_header: data.is_class_header ? true : false,
          };
        });
        this.classList = tempClass && tempClass.length ? _.cloneDeep(tempClass) : [];
        this.dataSource.data = this.classList;
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.dataSource.paginator = this.paginator;
        if (from === 'setHeaderToggle') {
          this.paginator.pageIndex = this.currentPage;
        }
        this.dataSource.filterPredicate = this.customFilterPredicate();
      });
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);

    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const nameFound = data.name.toString().trim().toLowerCase().indexOf(searchString.name.toLowerCase()) !== -1;
      const descFound = data.description.toString().trim().toLowerCase().indexOf(searchString.description.toLowerCase()) !== -1;

      const jobFound =
        searchString.allow_job_description.toLowerCase() === 'allm' ||
        (data.allow_job_description && data.allow_job_description === searchString.allow_job_description.trim().toLowerCase());

      const problematicFound =
        searchString.allow_problematic.toLowerCase() === 'allm' ||
        (data.allow_problematic && data.allow_problematic === searchString.allow_problematic.trim().toLowerCase());

      const mentorEvaluationFound =
        searchString.allow_mentor_evaluation.toLowerCase() === 'allm' ||
        (data.allow_mentor_evaluation && data.allow_mentor_evaluation === searchString.allow_mentor_evaluation.trim().toLowerCase());

      let class_header = '';
      data.is_class_header ? (class_header = 'yes') : (class_header = 'no');
      const headerFound = searchString.is_class_header === 'AllM' ? 
        true : class_header
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.is_class_header.toLowerCase()) !== -1;

      return nameFound && descFound && jobFound && problematicFound && mentorEvaluationFound && headerFound;
    };
  }

  onAddClass() {
    this.subs.sink = this.dialog
      .open(CreateClassDialogComponent, {
        width: '600px',
        height: 'auto',
        disableClose: true,
        panelClass: 'certification-rule-pop-up',
        minHeight: '130px',
        data: { rncpId: this.rncpId, titleName: this.titleName },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp && resp.classData) {

          this.classList.push({
            description: resp.classData.description,
            allow_job_description: 'not active',
            allow_mentor_evaluation: 'not active',
            name: resp.classData.name,
            status: 'active',
            allow_problematic: 'not active',
            _id: resp.classData._id,
          });
          this.dataSource.data = this.classList;
          this.updateClass.emit(this.classList);
          this.passClass.emit(this.classList[this.classList.length - 1]);
        }
      });
  }

  deleteClass(classData: any) {
    if (classData && classData._id) {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMCLASS_S01.TITLE'),
        text: this.translate.instant('TMCLASS_S01.TEXT', { className: classData.name }),
        footer: `<span style="margin-left: auto">TMCLASS_S01</span>`,
        showCancelButton: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
          // clearTimeout(this.timeOutVal);
        },
      }).then((result) => {
        clearTimeout(this.timeOutVal);
        if (result.value) {
          this.subs.sink = this.rncpTitlesService.deleteClass(classData._id).subscribe((resp) => {
            if (resp && resp.data) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('TMCLASS_S02.TITLE'),
                text: this.translate.instant('TMCLASS_S02.TEXT', { className: classData.name }),
                footer: `<span style="margin-left: auto">TMCLASS_S02</span>`,
                confirmButtonText: this.translate.instant('TMCLASS_S02.BUTTON_1'),
                allowOutsideClick: false,
                allowEscapeKey: false,
              }).then((res) => {
                const tempClassList = _.filter(this.classList, (classlistData) => classlistData._id !== classData._id);

                this.classList = tempClassList;
                this.dataSource.data = tempClassList;
                this.updateClass.emit(tempClassList);
              });
            } else if (resp && resp.errors && resp.errors.length) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('SORRY'),
                html: this.translate.instant('Delete Class Rejected'),
                confirmButtonText: this.translate.instant('OK'),
                allowOutsideClick: false,
                allowEscapeKey: false,
              });
            }
          });
        }
      });
    }
  }

  setHeaderToggle(element) {
    this.isWaitingForResponse = true;
    const filter = {
      parent_rncp_title: this.rncpId,
      is_class_header : element.is_class_header,
    }
    this.subs.sink = this.rncpTitlesService.updateClass(element._id, filter).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          this.currentPage = this.paginator.pageIndex;
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            allowOutsideClick: false,
          }).then(() => {
            this.getFullData('setHeaderToggle');
          })
        }
    },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
      
  }

  resetFilter() {
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      name: '',
      description: '',
      allow_job_description: 'AllM',
      allow_problematic: 'AllM',
      allow_mentor_evaluation: 'AllM',
      is_class_header: 'AllM'
    };

    this.nameFilter.setValue('');
    this.descriptionFilter.setValue('');
    this.jobFilter.setValue('AllM');
    this.problematicFilter.setValue('AllM');
    this.mentorFilter.setValue('AllM');
    this.headerFilter.setValue('AllM');
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
