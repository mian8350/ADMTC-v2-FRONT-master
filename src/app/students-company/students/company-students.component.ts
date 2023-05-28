import { Observable } from 'rxjs';
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StudentsService } from '../../service/students/students.service';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { startWith, map, debounceTime, tap } from 'rxjs/operators';
import { StudentTableData } from 'app/students/student.model';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { NgxPermissionsService } from 'ngx-permissions';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from 'app/service/users/users.service';
import { UserService } from 'app/service/user/user.service';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';
import { ExportEsCsvDialogComponent } from 'app/students/export-es-csv-dialog/export-es-csv-dialog.component';
import { ApplicationUrls } from 'app/shared/settings';
import { of } from 'rxjs';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-company-students',
  templateUrl: './company-students.component.html',
  styleUrls: ['./company-students.component.scss'],
})
export class CompanyStudentsComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  studentId = '';
  schoolId = '';
  titleId = '';
  classId = '';
  config: MatDialogConfig = {};
  studentSelected: any;
  searchStudent: string;
  selectedClassId = '';
  selectedRncpTitleId = '';
  selectedStudentId = '';
  selectedSchoolId = ''
  selectedStudentStatus = '';
  currentStudentTitleId = '';
  currentStudentClassId = '';
  studentCardData: any[] = [];
  filteredStudentCardData: Observable<any[]>;
  studentFilter = new UntypedFormControl('');
  searchCompany = new UntypedFormControl('');
  studentSearch: string;
  registerStudent = false;
  isWaitingForResponse = false;
  isAddStudent = false;
  messageDataEmpty = false;
  jobFullScreen = false;
  currentUser: any;
  companyList: any;
  originalList: any;
  searchComp = '';
  studentTabSelected: any;
  myInnerHeight = 600;
  studentPrevCourseData = null;

  serverimgPath = ApplicationUrls.baseApi;
  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;
  maleStudentIcon = '../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../assets/img/student_icon_fem.png';
  constructor(
    private route: ActivatedRoute,
    private schoolService: SchoolService,
    public permissionService: PermissionService,
    private studentService: StudentsService,
    private translate: TranslateService,
    private authService: AuthService,
    public dialog: MatDialog,
    private pageTitleService: PageTitleService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of students');
    const identity = this.route.snapshot.queryParamMap.get('identity');
    const studentId = this.route.snapshot.queryParamMap.get('student');
    const titleId = this.route.snapshot.queryParamMap.get('title');
    const classId = this.route.snapshot.queryParamMap.get('class');
    const schoolId = this.route.snapshot.queryParamMap.get('school');
    const type = this.route.snapshot.queryParamMap.get('type');
    if (type === 'jobfullscreen') {
      this.jobFullScreen = true;
      this.titleId = titleId;
      this.classId = classId;
      this.studentId = studentId;
      this.schoolId = schoolId;
    }
    if (studentId) {
      this.studentSelected = studentId;
      this.selectedStudentId = studentId;
      this.schoolService.setCurrentStudentId(studentId);
      this.studentTabSelected = identity;
      this.selectedSchoolId = schoolId;
      this.selectedRncpTitleId = titleId;
      this.selectedClassId = classId;
      this.registerStudent = false;
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentClassId(this.selectedClassId);
    }
    this.currentUser = this.authService.getLocalStorageUser();
    this.getDataCard('');
  }
  getDataCard(search) {
    const mentor_id = this.currentUser._id;
    this.subs.sink = this.studentService.getAllStudentsCompany(mentor_id, search).subscribe((students: any) => {
      if (students && students.length) {
        this.isWaitingForResponse = false;
        this.studentCardData = students;
        this.companyList = students;
        this.originalList = students;
        this.filteredStudentCardData = of(this.studentCardData);
        this.messageDataEmpty = false;
        // *************** Autopopulate first position of cardList
        this.selectStudentCard(this.studentCardData[0])
      } else {
        this.selectedStudentId = '';
        this.selectedSchoolId = '';
        this.isWaitingForResponse = false;
        this.messageDataEmpty = true;
        this.studentCardData = [];
        this.filteredStudentCardData = of([]);
      }
    });
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
      this.myInnerHeight = window.innerHeight - 168;
      return this.myInnerHeight;
  }

  filterCompany() {
    this.subs.sink = this.searchCompany.valueChanges.pipe(debounceTime(400)).subscribe((search) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!search.match(symbol) && !search.match(symbol1)) {
        this.getDataCard(search);
      } else {
        this.searchCompany.setValue('');
        this.getDataCard('');
      }
    });
  }
  // *************** Reset Search
  resetSearch() {
    this.searchCompany.setValue('');
    this.companyList = [];
    this.getDataCard('');
  }

  setCompanyFilter(data) {

    this.searchComp = data === 'AllM' ? '' : data.toLowerCase();
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

  filterStundentCard(search: string) {
    const filteredResult = this.studentCardData.filter((option) =>
      this.simpleDiacriticSensitiveRegex(option.first_name + ' ' + option.last_name)
        .toString()
        .toLowerCase()
        .includes(this.simpleDiacriticSensitiveRegex(search).toLowerCase()),
    );
    this.filteredStudentCardData = of(filteredResult);
  }

  selectStudentCard(student) {
    this.selectedStudentId = student._id;
    this.selectedSchoolId = student.school._id;
    this.selectedRncpTitleId = student.rncp_title._id;
    this.selectedClassId = student.current_class._id;
    this.selectedStudentStatus = student?.student_title_status;
    this.registerStudent = false;
    this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
    this.schoolService.setCurrentStudentClassId(this.selectedClassId);
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
  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
