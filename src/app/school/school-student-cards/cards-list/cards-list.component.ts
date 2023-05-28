import { CoreService } from './../../../service/core/core.service';
import { Component, OnInit, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { MatDialogConfig, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { StudentsService } from 'app/service/students/students.service';
import { SchoolService } from 'app/service/schools/school.service';
import { TranslateService } from '@ngx-translate/core';
import { of, Observable } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';
import { ApplicationUrls } from 'app/shared/settings';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { UtilityService } from 'app/service/utility/utility.service';
import { distinctUntilChanged } from 'rxjs/operators';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'ms-cards-list',
  templateUrl: './cards-list.component.html',
  styleUrls: ['./cards-list.component.scss'],
})
export class CardsListComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  config: MatDialogConfig = {};
  @Input() schoolId: string;
  @Input() studentSelected: any;
  @Input() studentTabSelected: any;
  @Input() searchStudent: string;
  selectedClassId = '';
  selectedRncpTitleId = '';
  selectedStudentStatus = null;
  isStatusSelectedFromUI: boolean = false;
  selectedStudentId = '';
  currentStudentTitleId = '';
  currentStudentClassId = '';
  studentCardData: any[] = [];
  studentData: any;
  filteredStudentCardData: Observable<any[]>;
  studentFilter = new UntypedFormControl('');
  studentSearch: string;
  registerStudent = false;
  isWaitingForResponse = false;
  isAddStudent = false;
  messageDataEmpty = false;
  myInnerHeight = 1920;
  currentUser: any;
  isUserCorrectorProblematic = false;
  studentPrevCourseData = null;

  initStudentId;

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;
  maleStudentIcon = '../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../assets/img/student_icon_fem.png';
  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private translate: TranslateService,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
    private coreService: CoreService,
  ) {}

  ngOnInit() {
    this.initStudentId = this.route?.snapshot?.queryParams?.student ? this.route?.snapshot?.queryParams?.student : null;
    this.selectedStudentStatus = this.route?.snapshot?.queryParams?.studentStatus ? this.route?.snapshot?.queryParams?.studentStatus : 'active';
    this.coreService.sidenavOpen = false;
    this.subs.sink = this.schoolService.selectedRncpTitleId$.subscribe((id) => {
      this.selectedRncpTitleId = id;
    });
    this.subs.sink = this.schoolService.selectedClassId$.pipe(distinctUntilChanged()).subscribe((id) => {
      this.selectedClassId = id;
      this.selectedStudentId = '';
    });
    this.subs.sink = this.schoolService.isSelectedStatus$.subscribe((data) => {
      this.isStatusSelectedFromUI = data;
      this.subs.sink = this.schoolService.selectedStatusId$.pipe(distinctUntilChanged()).subscribe((status) => {
        if((this.selectedStudentStatus !== status) || (this.selectedStudentStatus === ''))  {
          this.selectedStudentId = '';
        }
        const tempStatus = status;
        const isStatusSameAsParam = this.route.snapshot.queryParams.studentStatus === tempStatus;
        const isAllFilterFilled = this.selectedRncpTitleId && this.selectedClassId && tempStatus;
        if (isAllFilterFilled && (isStatusSameAsParam || this.isStatusSelectedFromUI)) { 
          this.selectedStudentStatus = status;
          this.getStudentData();
        }
      });
    });

    if (!this.isStatusSelectedFromUI) {
        this.getStudentData();
    }

    // get current title id and class id, this is for condition where student title/class was changed
    this.subs.sink = this.schoolService.currentStudentTitleId$.subscribe((id) => (this.currentStudentTitleId = id));
    this.subs.sink = this.schoolService.currentStudentClassId$.subscribe((id) => (this.currentStudentClassId = id));
    this.studentSearch = '';
    this.subs.sink = this.schoolService.currentSearchStudent$.subscribe((index) => {
      if (index) {
        this.studentFilterTrigger();
      } else {
        this.messageDataEmpty = false;
      }
    });
    this.subs.sink = this.schoolService.selectedStudentId$.subscribe((resp) => {

      if (resp) {
        this.selectStudentCard(resp);
        this.selectedStudentId = resp
        this.schoolService.setCurrentStudentId(null);
      }
    });
    this.subs.sink = this.studentService.triggerStudentCard$.subscribe((index) => {
      if (index) {
        this.getStudentData();
      }
    });
    if (this.studentSelected) {
      this.selectStudentCard(this.studentSelected);
    }
    // Get selected title id and class id
    // const studentId = this.route.snapshot.queryParamMap.get('student');
    // if (studentId) {
    //   this.studentSelected = studentId;
    //   this.selectedStudentId = studentId;
    //   this.registerStudent = false;
    // }
  }

  checkItemScrollTo() {
    const itemToScrollTo = document.getElementById('item-' + this.selectedStudentId);


    if (itemToScrollTo) {
      itemToScrollTo.scrollIntoView(true);
    }
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 231;
    return this.myInnerHeight;
  }

  // *************** To Get Height window screen and put in style css height
  getCardHeight() {
    this.myInnerHeight = window.innerHeight - 263;
    return this.myInnerHeight;
  }
  reload(event) {
    if (event.reload) {
      this.selectedStudentId = event.deactivation ? '' : this.selectedStudentId;
      this.getStudentData();
    }
  }

  getStudentData() {
    this.isWaitingForResponse = true;
    this.messageDataEmpty = false;
    // when login as corrector of problematic
    // filter students which have problematic_status as 'sent_to_certifier'
    if (this.permissions.getPermission('Corrector of Problematic')) {
      this.subs.sink = this.studentService
        .getStudentsCardDataSendToCertifierProblematic(this.schoolId, this.selectedRncpTitleId, this.selectedClassId)
        .subscribe((students: any) => {
          if (students && students.length) {
            this.isWaitingForResponse = false;
            this.studentCardData = students;
            if (this.initStudentId) {
              const studentData = this.studentCardData.filter((student) => student._id === this.initStudentId);
              if (studentData?.length) {
                this.selectStudentCard(studentData[0]._id, 'user_click', studentData[0])
              } else {
                this.selectStudentCard(this.studentCardData[0]._id, 'user_click', this.studentCardData[0])
              }
            } else {
              if (this.studentCardData?.length) {
                this.selectStudentCard(this.studentCardData[0]._id, 'user_click', this.studentCardData[0])
              }
            }
            this.messageDataEmpty = false;
            this.filteredStudentCardData = of(this.studentCardData);
          } else {
            this.isWaitingForResponse = false;
            this.messageDataEmpty = true;
            this.studentCardData = [];
            this.filteredStudentCardData = of([]);
          }
          // ************* Call function to autoscroll to user, set time out used to wait for render
          setTimeout(() => {
            this.checkItemScrollTo();
          }, 200);
        });
    } else {
      // to display previous course student, change 'active_completed' to 'student_card_active_completed' in the graphql query
      // need to check selectedStudentStatus, to get the student with the status active
      const status = this.selectedStudentStatus === 'active' ? 'student_card_active_completed' : null;
      const studentStatus = this.selectedStudentStatus === 'active' ? null : this.selectedStudentStatus;
      this.subs.sink = this.studentService
        .getStudentsCardData(this.schoolId, this.selectedRncpTitleId, this.selectedClassId, studentStatus, status)
        .subscribe((students: any) => {
          if (students && students.length) {
            this.isWaitingForResponse = false;
            this.studentCardData = students;
            if (this.initStudentId) {
              const studentData = this.studentCardData.filter((student) => student._id === this.initStudentId);
              if (studentData?.length) {
                this.selectStudentCard(studentData[0]._id, 'user_click', studentData[0])
              } else {
                this.selectStudentCard(this.studentCardData[0]._id, 'user_click', this.studentCardData[0])
              }
            } else {
              if (this.studentCardData?.length) {
                this.selectStudentCard(this.studentCardData[0]._id, 'user_click', this.studentCardData[0])
              }
            }
            this.messageDataEmpty = false;
            this.filteredStudentCardData = of(this.studentCardData);
          } else {
            this.isWaitingForResponse = false;
            this.messageDataEmpty = true;
            this.studentCardData = [];
            this.filteredStudentCardData = of([]);
          }
          // ************* Call function to autoscroll to user, set time out used to wait for render
          setTimeout(() => {
            this.checkItemScrollTo();
          }, 200);
        });
    }
  }

  studentFilterTrigger() {
    this.subs.sink = this.schoolService.currentSearchStudent$.subscribe((resp) => {
      this.studentFilter.setValue(this.searchStudent);
      if (resp && resp.length) {
        this.filterStundentCard(resp);
      } else {
        this.filteredStudentCardData = of(this.studentCardData);
      }
    });
  }

  isPreviousCompleted(student: any): boolean {
    let isCompleted = false;
    if (student && student.previous_courses_id && student.previous_courses_id.length) {
      for (const prev of student.previous_courses_id) {
        if (prev.rncp_id && student.rncp_title && prev.rncp_id._id === student.rncp_title._id) {
          // we should later add condition to get status based on student_title_status in prevCourse
          // if it is completed, then isCompleted is true
          if (prev.class_id && student.current_class && prev.class_id._id === student.current_class._id) {
            isCompleted = prev.student_title_status !== 'retaking';
          }
          break;
        }
      }
    }
    return isCompleted;
  }

  isPreviousRetaking(student: any): boolean {
    let isRetaking = false;
    if (student && student.previous_courses_id && student.previous_courses_id.length) {
      for (const prev of student.previous_courses_id) {
        if (prev.rncp_id && student.rncp_title && prev.rncp_id._id === student.rncp_title._id) {
          // we should later add condition to get status based on student_title_status in prevCourse
          // if it is retaking, then isRetaking is true
          if (prev.class_id && student.current_class && prev.class_id._id === student.current_class._id) {
            isRetaking = prev.student_title_status === 'retaking';
          }
          break;
        }
      }
    }
    return isRetaking;
  }

  filterStundentCard(search: string) {
    const filteredResult = this.studentCardData.filter((option) =>
      this.simpleDiacriticSensitiveRegex(option.first_name + ' ' + option.last_name)
        .toString()
        .toLowerCase()
        .includes(this.simpleDiacriticSensitiveRegex(search).toLowerCase()),
    );
    if (filteredResult && filteredResult[0] && filteredResult[0]._id && filteredResult.length !== 0) {
      this.selectStudentCard(filteredResult[0]._id, 'user_click', filteredResult[0]);
      this.messageDataEmpty = false;
    } else {
      this.selectedStudentId = null;
      this.registerStudent = false;
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentClassId(this.selectedClassId);
      this.messageDataEmpty = true;
    }
    this.filteredStudentCardData = of(filteredResult);
  }

  selectStudentCard(studentId: string, type?: string, student?: any) {    
    if (type === 'user_click') {
      this.studentTabSelected = '';
    }
    this.initStudentId = studentId;
    this.getPreviousCourseStudentData(student);
    this.selectedStudentId = studentId;
    this.registerStudent = false;
    this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
    this.schoolService.setCurrentStudentClassId(this.selectedClassId);
  }

  getPreviousCourseStudentData(student) {
    let isPrevCourseStudent = false;
    if (student && student.previous_courses_id && student.previous_courses_id.length) {
      for (const prev of student.previous_courses_id) {
        if (prev.rncp_id && student.rncp_title && prev.rncp_id._id === student.rncp_title._id) {
          if (prev.class_id && student.current_class && prev.class_id._id === student.current_class._id) {
            isPrevCourseStudent = true;
          }
          break;
        }
      }
    }
    // assign studentPrevCourseData if student selected is previous course student
    this.studentPrevCourseData = isPrevCourseStudent ? student : null;
  }

  isStudentInCorrectTitleClass(): boolean {
    if (this.selectedRncpTitleId === this.currentStudentTitleId && this.selectedClassId === this.currentStudentClassId) {
      return true;
    } else {
      return false;
    }
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  sendMail(data) {
    this.mailStudentsDialog = this.dialog.open(MailStudentDialogComponent, {
      disableClose: true,
      width: '750px',
      data: data,
    });
  }
  getTooltip(data: string) {
    return this.translate.instant(data);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
