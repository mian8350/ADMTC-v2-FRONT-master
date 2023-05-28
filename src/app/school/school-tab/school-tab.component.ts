import { CoreService } from './../../service/core/core.service';
import { Component, OnInit, ViewChild, Output, EventEmitter, OnDestroy, AfterViewInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateStudentDetailComponent } from '../school-student-cards/create-student-detail/create-student-detail.component';
import { SchoolStudentCardsComponent } from '../school-student-cards/school-student-cards.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { FormControl } from '@angular/forms';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';
import { Observable } from 'apollo-link';
import * as _ from 'lodash';
import { SchoolStudentTableComponent } from '../school-student-table/school-student-table.component';
import { SchoolDetailComponent } from '../school-detail/school-detail.component';
import { PermissionService } from 'app/service/permission/permission.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'ms-school-tab',
  templateUrl: './school-tab.component.html',
  styleUrls: ['./school-tab.component.scss'],
})
export class SchoolTabComponent implements OnInit, OnDestroy {
  schoolId: string;
  studentId: string;
  classId: string;
  titleId: string;
  schoolName: string;
  tabIndex = 0;
  clickedTabIndex;
  studentSelected: any;
  studentTabSelected: any;
  selected = 0;
  @Output()
  selectedTabChange = new EventEmitter<MatTabChangeEvent>();
  private subs = new SubSink();

  @ViewChild('addStudent', { static: false }) addStudent: SchoolStudentCardsComponent;
  @ViewChild('importStudent', { static: false }) importStudent: SchoolStudentTableComponent;
  @ViewChild('schoolDetail', { static: false }) schoolDetail: SchoolDetailComponent;
  private selectedIndex;
  dataStudent: any;
  dataStudentIdentity: any;
  isUserAcadir = false;
  jobFullScreen = false;
  isACADAdmin = false;
  constructor(
    private pageTitleService: PageTitleService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private schoolService: SchoolService,
    public permissionService: PermissionService,
    private permissions: NgxPermissionsService,
    public coreService: CoreService,
  ) {}

  ngOnInit() {
    this.schoolName = '';
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');
    this.isACADAdmin = !!this.permissions.getPermission('Academic Admin');
    this.subs.sink = this.route.paramMap.subscribe((param) => {
      this.schoolId = param.get('schoolId');
    });
    if (this.schoolId) {
      this.subs.sink = this.schoolService.getSchoolIdAndShortName(this.schoolId).subscribe((resp) => {
        if (resp) {
          this.schoolName = resp.short_name;
        }
        this.getSchoolData('School Detail');
        this.redirectToTab();
      });
    }
    this.subs.sink = this.schoolService.selectedDataStudent$.subscribe((resp) => (this.dataStudent = resp));
    this.subs.sink = this.schoolService.selectedDataStudentIdentity$.subscribe((resp) => (this.dataStudentIdentity = resp));

    this.coreService.sidenavOpen = false;
  }
  getSchoolData(tabName) {
    if (this.schoolName) {
      if (this.isUserAcadir || this.isACADAdmin) {
        this.pageTitleService.setTitle(this.schoolName + ' - ' + this.translate.instant(tabName));
      } else if (this.jobFullScreen) {
        this.pageTitleService.setTitle(
          this.translate.instant('List of schools') +
            ' >> ' +
            this.schoolName +
            ' - ' +
            this.translate.instant('STUDENT_CARD.JOBDESCRIPTION'),
        );
      } else {
        this.pageTitleService.setTitle(
          this.translate.instant('List of schools') + ' >> ' + this.schoolName + ' - ' + this.translate.instant(tabName),
        );
      }
      this.pageTitleService.setIcon('account_balance');
    }
  }

  getTabIndex(tabName: string): number {
    if (tabName === this.translate.instant('School Detail')) {
      this.schoolService.updateIndexActiveTab(0);
      return 0;
    } else if (tabName === this.translate.instant('School Staff')) {
      this.schoolService.updateIndexActiveTab(1);
      return 1;
    } else if (tabName === this.translate.instant('Student Cards')) {
      this.schoolService.updateIndexActiveTab(2);
      return 2;
    } else if (tabName === this.translate.instant('NAV.Active Student')) {
      this.schoolService.updateIndexActiveTab(3);
      return 3;
    } else if (tabName === this.translate.instant('NAV.Completed Student')) {
      this.schoolService.updateIndexActiveTab(4);
      return 4;
    } else if (tabName === this.translate.instant('NAV.Suspended Student')) {
      this.schoolService.updateIndexActiveTab(5);
      return 5;
    } else if (tabName === this.translate.instant('Deactivated Student')) {
      this.schoolService.updateIndexActiveTab(6);
      return 6;
    } else {
      this.schoolService.updateIndexActiveTab(null);
      return -1;
    }
  }

  getValidTab(tabName: string): any {
    if (tabName === this.translate.instant('School Detail')) {
      this.getSchoolData('School Detail');
      return true;
    } else if (tabName === this.translate.instant('School Staff')) {
      this.getSchoolData('School Staff');
      return true;
    } else if (tabName === this.translate.instant('Student Cards')) {
      this.getSchoolData('Student Cards');
      return true;
    } else if (tabName === this.translate.instant('NAV.Active Student')) {
      this.getSchoolData('NAV.Active Student');
      return true;
    } else if (tabName === this.translate.instant('NAV.Completed Student')) {
      this.getSchoolData('NAV.Completed Student');
      return true;
    } else if (tabName === this.translate.instant('NAV.Suspended Student')) {
      this.getSchoolData('NAV.Suspended Student');
      return true;
    } else if (tabName === this.translate.instant('Deactivated Student')) {
      this.getSchoolData('Deactivated Student');
      return true;
    } else {
      return false;
    }
  }

  getTabFromParam(tabName: string): number {
    if (tabName === this.translate.instant('school-detail')) {
      this.schoolService.updateIndexActiveTab(0);
      this.getSchoolData('School Detail');
      return 0;
    } else if (tabName === this.translate.instant('school-staff')) {
      this.schoolService.updateIndexActiveTab(1);
      this.getSchoolData('School Staff');
      return 1;
    } else if (tabName === this.translate.instant('student-cards')) {
      this.schoolService.updateIndexActiveTab(2);
      this.getSchoolData('Student Cards');
      return 2;
    } else if (tabName === this.translate.instant('student-table')) {
      this.schoolService.updateIndexActiveTab(3);
      this.getSchoolData('NAV.Active Student');
      return 3;
    } else if (tabName === this.translate.instant('suspended-student')) {
      this.schoolService.updateIndexActiveTab(5);
      return 5;
    } else if (tabName === this.translate.instant('deactivated-student')) {
      this.schoolService.updateIndexActiveTab(6);
      return 6;
    } else {
      return -1;
    }
  }

  checkValidation(clickEvent: any) {
    let validation: Boolean;
    let validTab: Boolean;
    validation = false;
    if (clickEvent && clickEvent.target) {
      const fromLabelTab = clickEvent.target.className === 'mat-tab-label-content';
      validTab = fromLabelTab ? this.getValidTab(clickEvent.target.textContent) : false;
      if (validTab) {
        this.clickedTabIndex = this.getTabIndex(clickEvent.target.innerText);
        const indexFrom = this.selected;
        if (!(this.selected === this.clickedTabIndex)) {
          if (
            (this.addStudent && this.addStudent.isAddUser && this.addStudent.isAddUser) ||
            (this.importStudent && this.importStudent.isImportStudent && this.importStudent.isImportFormFilled) ||
            (this.importStudent && this.importStudent.isAddUser && this.importStudent.isAddUser) ||
            (this.schoolDetail && this.schoolDetail.schoolForm && !this.getChangerFromSchool())
          ) {
            validation = true;
          }
          if (validation) {
            if (this.importStudent && this.importStudent.isImportStudent && this.importStudent.isImportFormFilled) {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('TMTC_S01_IMPORT.TITLE'),
                text: this.translate.instant('TMTC_S01_IMPORT.TEXT'),
                confirmButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_1'),
                showCancelButton: true,
                cancelButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_2'),
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then((result) => {
                if (result.value) {
                  this.selected = indexFrom;

                } else {
                  this.schoolService.setAddStudent(false);
                  this.schoolService.setImportStudent(false);
                  this.schoolService.setImportFormFilled(false);
                  this.selected = this.clickedTabIndex;
                }
              });
            } else {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('TMTC_S01.TITLE'),
                text: this.translate.instant('TMTC_S01.TEXT'),
                confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
                showCancelButton: true,
                cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
                allowOutsideClick: false,
              }).then((result) => {
                if (result.value) {
                  this.selected = indexFrom;

                } else {
                  this.schoolService.setAddStudent(false);
                  this.schoolService.setImportStudent(false);
                  this.schoolService.setImportFormFilled(false);
                  this.selected = this.clickedTabIndex;
                }
              });
            }
          } else {
            this.schoolService.setAddStudent(false);
            this.schoolService.setImportStudent(false);
            this.schoolService.setImportFormFilled(false);
            this.selected = this.clickedTabIndex;

          }
        }
      }
    }

    if (this.importStudent && this.importStudent.studentSelected) {
      this.selected = 2;
      this.studentSelected = this.importStudent.studentSelected;
    }
    // }
    if (this.clickedTabIndex === -1) {
      return;
    }
  }

  redirectToTab() {
    const openTab = this.route.snapshot.queryParamMap.get('open');
    const titleId = this.route.snapshot.queryParamMap.get('title');
    const classId = this.route.snapshot.queryParamMap.get('class');
    const studentId = this.route.snapshot.queryParamMap.get('student');
    const identity = this.route.snapshot.queryParamMap.get('identity');
    const type = this.route.snapshot.queryParamMap.get('type');
    const studentName = this.route.snapshot.queryParamMap.get('student-name');
    const studentsName = this.route.snapshot.queryParamMap.get('name');
    this.coreService.sidenavOpen = false;
    if (type === 'jobfullscreen') {
      this.getSchoolData('STUDENT_CARD.JOBDESCRIPTION');
      this.jobFullScreen = true;
      this.titleId = titleId;
      this.classId = classId;
      this.studentId = studentId;
    } else {
      this.clickedTabIndex = this.getTabFromParam(openTab);
      if (openTab === 'student-table') {
        this.schoolService.setAddStudent(false);
        this.schoolService.setImportStudent(false);
        this.schoolService.setImportFormFilled(false);
        this.schoolService.setSelectedRncpTitleId(titleId);
        this.schoolService.setSelectedClassId(classId);
        this.schoolService.setCurrentStudentName(studentsName);
        this.selected = this.clickedTabIndex;
        this.coreService.sidenavOpen = false;
      } else if (openTab === 'student-cards') {
        if (studentId) {

          this.studentSelected = studentId;
          this.schoolService.setCurrentStudentId(studentId);
          this.studentTabSelected = identity;
        }
        this.schoolService.setAddStudent(false);
        this.schoolService.setImportStudent(false);
        this.schoolService.setImportFormFilled(false);
        this.schoolService.setSelectedRncpTitleId(titleId);
        this.schoolService.setSelectedClassId(classId);
        this.selected = this.clickedTabIndex;
        this.coreService.sidenavOpen = false;
      } else if (openTab === 'school-staff') {
        this.schoolService.setSelectedRncpTitleId(titleId);
        this.schoolService.setSelectedClassId(classId);
        this.selected = this.clickedTabIndex;
        this.coreService.sidenavOpen = false;
      } else if (openTab === 'suspended-student') {
        this.schoolService.setSelectedRncpTitleId(titleId);
        this.schoolService.setSelectedClassId(classId);
        this.schoolService.setCurrentStudentName(studentName);
        this.selected = this.clickedTabIndex;
        this.coreService.sidenavOpen = false;
      } else if (openTab === 'deactivated-student') {
        this.schoolService.setSelectedRncpTitleId(titleId);
        this.schoolService.setSelectedClassId(classId);
        this.schoolService.setCurrentStudentName(studentName);
        this.selected = this.clickedTabIndex;
        this.coreService.sidenavOpen = false;
      }

    }
  }

  getChangerFromSchool() {

    return _.isEqual(this.schoolDetail.schoolForm.value, this.schoolDetail.loadSchoolForm);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation: Boolean;
    validation = false;
    if (
      (this.addStudent && this.addStudent.isAddUser && this.addStudent.isAddUser) ||
      (this.importStudent && this.importStudent.isImportStudent && this.importStudent.isImportFormFilled) ||
      (this.importStudent && this.importStudent.isAddUser && this.importStudent.isAddUser) ||
      (this.schoolDetail && this.schoolDetail.schoolForm && !this.getChangerFromSchool())
    ) {
      validation = true;
    }
    if (validation) {
      return new Promise((resolve, reject) => {
        if (this.importStudent && this.importStudent.isImportStudent && this.importStudent.isImportFormFilled) {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('TMTC_S01_IMPORT.TITLE'),
            text: this.translate.instant('TMTC_S01_IMPORT.TEXT'),
            confirmButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_1'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_2'),
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((result) => {
            if (result.value) {
              resolve(false);
            } else {
              this.schoolService.setAddStudent(false);
              this.schoolService.setImportFormFilled(false);
              this.schoolService.setImportStudent(false);
              resolve(true);
            }
          });
        } else {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('TMTC_S01.TITLE'),
            text: this.translate.instant('TMTC_S01.TEXT'),
            confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((result) => {
            if (result.value) {
              resolve(false);
            } else {
              this.schoolService.setAddStudent(false);
              this.schoolService.setImportFormFilled(false);
              this.schoolService.setImportStudent(false);
              resolve(true);
            }
          });
        }
      });
    } else {
      return true;
    }
  }

  ngOnDestroy(): void {
    this.pageTitleService.setTitle('');
    this.pageTitleService.setIcon('');
    this.schoolService.resetSelectedTitleAndClass();
    this.subs.unsubscribe();
  }
}
