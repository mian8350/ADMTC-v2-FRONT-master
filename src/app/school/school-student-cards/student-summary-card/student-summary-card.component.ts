import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';
import { UserEmailDialogComponent } from 'app/users/user-email-dialog/user-email-dialog.component';
import { DeactivateStudentDialogComponent } from 'app/students/deactivate-student-dialog/deactivate-student-dialog.component';
import { UserService } from 'app/service/user/user.service';
import { Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SchoolService } from 'app/service/schools/school.service';
import { TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'app/service/permission/permission.service';
import { StudentsService } from './../../../service/students/students.service';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { ApplicationUrls } from 'app/shared/settings';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';
import { environment } from 'environments/environment';
import * as moment from 'moment';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ResignationActiveNonMarkPrevCourseDialogComponent } from 'app/shared/components/resignation-active-non-mark-prev-course-dialog/resignation-active-non-mark-prev-course-dialog.component';
import { ResignationActiveMarkPrevCourseDialogComponent } from 'app/shared/components/resignation-active-mark-prev-course-dialog/resignation-active-mark-prev-course-dialog.component';
import { TransferStudentResignationDialogComponent } from 'app/shared/components/transfer-student-resignation-dialog/transfer-student-resignation-dialog.component';
import { DeactivateStudentResignationDialogComponent } from 'app/shared/components/deactivate-student-resignation-dialog/deactivate-student-resignation-dialog.component';
import { SuspendStudentResignationDialogComponent } from 'app/shared/components/suspend-student-resignation-dialog/suspend-student-resignation-dialog.component';
import { SchoolStudentDeactivatedDialogComponent } from 'app/school/school-student-deactivated/school-student-deactivated-dialog/school-student-deactivated-dialog.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ms-student-summary-card',
  templateUrl: './student-summary-card.component.html',
  styleUrls: ['./student-summary-card.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseStringDatePipe, DatePipe],
})
export class StudentSummaryCardComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  student: any;
  @Input() studentId: any;
  @Input() schoolId: any;
  @Input() titleId: any;
  @Input() classId: any;
  @Input() selectedStudentStatus: string | null = null;
  @Output() reload = new EventEmitter<any>();
  isOpen: boolean;
  isStatusDifferent: boolean = false
  _studentDomainBaseUrl: string = environment.studentEnvironment;
  schoolDeactivateStudentDialog: MatDialogRef<SchoolStudentDeactivatedDialogComponent>;

  isWaitingForResponse: Boolean = false;
  isWaitingForResponseReset: Boolean = false;

  timeOutVal: any;
  intervalVal: any;
  mailUser: MatDialogRef<UserEmailDialogComponent>;
  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;
  deleteStudentConfig: MatDialogConfig = {
    disableClose: true,
    panelClass: 'no-max-height',
    width: '600px',
    maxHeight: '75vh',
  };

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  maleStudentIcon = '../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../assets/img/student_icon_fem.png';
  isConnect = false;
  blocksData: any;
  exemptedBlocks: any[] = [];
  isPartial = false;
  studentEmail: any;
  statusStudent: string;

  datePipe: DatePipe;
  isStudentContractActive: boolean;

  constructor(
    private studentService: StudentsService,
    public permissionService: PermissionService,
    private translate: TranslateService,
    private schoolService: SchoolService,
    private utilService: UtilityService,
    private authService: AuthService,
    private permissions: NgxPermissionsService,
    private router: Router,
    private userService: UserService,
    public dialog: MatDialog,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private parseStringDatePipe: ParseStringDatePipe,
  ) {}

  get studentDomain() {
    return `${this._studentDomainBaseUrl}/session/login`;
  }

  ngOnInit() {
    this.datePipe = new DatePipe(this.translate.currentLang);
    this.translate.onLangChange.subscribe(
      () => {
        this.datePipe = new DatePipe(this.translate.currentLang);
    });

    this.subs.sink = this.schoolService.selectedStatusId$.subscribe((resp) => {
      this.statusStudent = resp;
    });
    if (this.studentId) {
      this.isOpen = true;
      this.getStudentData();
    }
    this.refreshViewListener();
  }

  refreshViewListener() {
    this.subs.sink = this.studentService.triggerStudentSummary$.subscribe((resp) => {
      if (this.studentId) {
        this.isOpen = true;
        this.getStudentData();
      }
    });
  }

  getBlocksData(students) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.getAllBlockCompetence(this.titleId, this.classId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        this.blocksData = response;
        if (
          !students?.is_take_full_prepared_title &&
          students?.partial_blocks &&
          students?.partial_blocks?.length &&
          this.blocksData &&
          this.blocksData.length
        ) {
          this.isPartial = true;
          const partialId = students.partial_blocks.map((partial) => partial._id);
          this.exemptedBlocks = this.blocksData.filter((block, index) => {
            return !block?.specialization?._id && partialId.indexOf(block._id) === -1;
          });
        } else {
          this.isPartial = false;
          this.exemptedBlocks = [];
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  cleanIfHaveTag(value: string): string {
    let cleanText = value.replace(/<\/?[^>]+(>|$)/g, '');
    return cleanText;
  }

  getStudentData() {
    this.isWaitingForResponse = true;
    // need to check selectedStudentStatus, to get the student with the status active
    const status = this.selectedStudentStatus === 'active' || this.selectedStudentStatus === 'completed' ? 'student_card_active_completed' : null;
    const studentStatus = this.selectedStudentStatus === 'active' || this.selectedStudentStatus === 'completed' ? null : this.selectedStudentStatus;
    this.subs.sink = this.studentService
      .getOneStudentsCardData(this.schoolId, this.titleId, this.classId, this.studentId, studentStatus, status)
      .subscribe(
        (resp) => {
          this.student = resp && resp.length ? resp[0] : null;
          const companyActive = this.student?.companies.filter((company) => company?.status === "active");
          if(companyActive.length) {
            this.isStudentContractActive = true;
          } else {
            this.isStudentContractActive = false;
          }
          this.statusStudent = this.student?.student_title_status;
          this.studentEmail = this.student?.email;
          this.isWaitingForResponse = false;
          if(this.student?.student_title_status !== 'deactivated' && this.student?.student_title_status !== 'suspended') {
            this.getBlocksData(this.student);
          } else {
            this.exemptedBlocks = []
          }
        },
        (err) => (this.isWaitingForResponse = false),
      );
  }

  ngOnChanges() {
    this.isOpen = true;
    this.getStudentData();
  }

  thumbsToggle(flag, student) {
    const update = flag !== null ? flag : false;

    if (update) {
      let timeDisabled = 3;
      Swal.fire({
        title: this.translate.instant('THUMBSUP.SW2.TITLE'),
        html: this.translate.instant('THUMBSUP.SW2.TEXT'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CANCEL'),
      }).then((inputValue) => {
        if (inputValue.value) {
          // call API for thumb up here
          const payload = {
            is_thumbups_green: false,
          };
          const lang = this.translate.currentLang.toLowerCase();
          this.subs.sink = this.schoolService.updateStudent(student._id, payload, lang).subscribe(
            (resp) => {
              if (resp) {
                Swal.fire({ type: 'success', title: 'Bravo!', allowOutsideClick: false, confirmButtonText: this.translate.instant('OK') });
                this.getStudentData();
              }
            },
            (err) => {
              const text = err;
              const index = text.indexOf('/');
              const message = text.slice(21, index - 1);
              const pattern = text.slice(index);
              let str = '';

              if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ ]*$/') {
                str = 'must be letters';
              } else if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters and "-"';
              } else if (pattern === '/^[0-9]+$/') {
                str = 'must be numbers';
              } else if (pattern === '/^[a-fA-F0-9]{24}$/') {
                str = 'must be Id';
              } else if (pattern === '/^[a-zA-Z0-9À-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters, numbers, and "-"';
              }
              const alert = message + ' ' + str;

              if (
                err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
                err['message'] === 'GraphQL error: Error: Email Registered As User'
              ) {
                Swal.fire({
                  type: 'error',
                  title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
                  html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
                  footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
                  confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
                }).then(() => {
                  this.studentService.updateStudentCard(true);
                });
              } else {
                Swal.fire({
                  type: 'error',
                  title: 'Error !',
                  text: alert,
                });
              }
            },
          );
        }
      });
    } else {
      let timeDisabled = 3;
      Swal.fire({
        title: this.translate.instant('THUMBSUP.SW1.TITLE'),
        html: this.translate.instant('THUMBSUP.SW1.TEXT'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CANCEL'),
      }).then((inputValue) => {
        if (inputValue.value) {
          // call API for thumb up here
          const payload = {
            is_thumbups_green: true,
          };
          const lang = this.translate.currentLang.toLowerCase();
          this.subs.sink = this.schoolService.updateStudent(student._id, payload, lang).subscribe(
            (resp) => {
              if (resp) {
                Swal.fire({ type: 'success', title: 'Bravo!' });
                this.getStudentData();
              }
            },
            (err) => {
              const text = err;
              const index = text.indexOf('/');
              const message = text.slice(21, index - 1);
              const pattern = text.slice(index);
              let str = '';

              if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ ]*$/') {
                str = 'must be letters';
              } else if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters and "-"';
              } else if (pattern === '/^[0-9]+$/') {
                str = 'must be numbers';
              } else if (pattern === '/^[a-fA-F0-9]{24}$/') {
                str = 'must be Id';
              } else if (pattern === '/^[a-zA-Z0-9À-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters, numbers, and "-"';
              }
              const alert = message + ' ' + str;

              if (
                err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
                err['message'] === 'GraphQL error: Error: Email Registered As User'
              ) {
                Swal.fire({
                  type: 'error',
                  title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
                  html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
                  footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
                  confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
                });
              } else {
                Swal.fire({
                  type: 'error',
                  title: 'Error !',
                  text: alert,
                });
              }
            },
          );
        }
      });
    }
  }

  connectAsUser(student) {

    const currentUser = this.utilService.getCurrentUser();
    const studentUserId = student && student.user_id && student.user_id._id ? student.user_id._id : null;
    const unixUserType = _.uniqBy(student.entities, 'type.name');

    if (currentUser && studentUserId) {
      this.isConnect = true;
      this.subs.sink = this.authService.loginAsUser(currentUser._id, studentUserId).subscribe((resp) => {

        if (resp && resp.user) {

          const tempUser = resp.user;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('SUCCESS'),
            html: this.translate.instant('USER_S7_SUPERUSER.TEXT', {
              UserCivility: this.translate.instant(student.civility),
              UserFirstName: student.first_name,
              UserLastName: student.last_name,
            }),
            allowEscapeKey: true,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('UNDERSTOOD'),
          }).then((result) => {
            const studentType = '5a067bba1c0217218c75f8ab';
            if (tempUser.entities[0].type._id === studentType) {
              this.authService.connectAsStudent(resp, tempUser.entities[0].type.name, 'ifr');
            } else {
              this.authService.backupLocalUserProfileAndToken();
              this.authService.setLocalUserProfileAndToken(resp);
              this.authService.setPermission([tempUser.entities[0].type.name]);
              this.permissions.flushPermissions();
              this.permissions.loadPermissions([tempUser.entities[0].type.name]);
              this.userService.reloadCurrentUser(true);
              if (this.permissions.getPermission('Mentor') || this.permissions.getPermission('HR')) {
                this.router.navigate(['/students-card']);
              } else if (this.permissions.getPermission('Chief Group Academic')) {
                this.router.navigate(['/school-group']);
              }
              // else if (this.permissions.getPermission('Student')) {
              //   this.router.navigate(['/my-file']);
              // }
              else {
                this.router.navigate(['/rncpTitles']);
              }
            }
          });
        } else {
          this.isConnect = false;
        }
      });
    }
  }

  requestStudEmailCorrection(student) {

    Swal.fire({
      type: 'question',
      title: this.translate.instant('USER_S5.TITLE'),
      html: this.translate.instant('USER_S5.TEXT', {
        userCivility: this.translate.instant(student.civility),
        userFirstName: student.first_name,
        userLastName: student.last_name,
      }),
      showCancelButton: true,
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('USER_S5.SEND'),
      cancelButtonText: this.translate.instant('CANCEL'),
      allowOutsideClick: false,
    }).then((res) => {
      if (res.value) {
        const deleteConfig: MatDialogConfig = {
          disableClose: true,
          panelClass: 'no-max-height',
          width: '600px',
          maxHeight: '75vh',
        };
        // sendEmailToAcadDir();
        this.dialog
          .open(IncorrectUsersEmailDialogComponent, {
            ...deleteConfig,
            data: {
              studentId: student._id,
              schoolId: student.school._id,
              rncpId: student.rncp_title && student.rncp_title._id ? student.rncp_title._id : '',
              lang: this.translate.currentLang.toLowerCase(),
              isFromUserTable: false,
            },
          })
          .afterClosed()
          .subscribe((resp) => (resp ? this.getStudentData() : null));
      }
    });
  }

  onResignationStudend(selectedStudent){
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.checkAllowDeactivateStudent(selectedStudent._id).subscribe((student) => {
      this.isWaitingForResponse = false;
      if(student === 'ResignationStud_S1'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S1' }
        this.swalResignationStudS1(studentData);
      } else if (student === 'ResignationStud_S2'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S2' }
        this.swalResignationStudS2(studentData);
      } else if (student === 'ResignationStud_S3'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S3' }
        this.dialogResignationStudS3(studentData);
      } else if (student === 'ResignationStud_S4'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S4' }
        this.dialogResignationStudS4(studentData);
      }
    });
  }

  swalResignationStudS1(studentData){
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('RESIGNATION_STUD_S1_BLOCK.TITLE'),
      html: this.translate.instant('RESIGNATION_STUD_S1_BLOCK.TEXT',{
        civ : this.translate.instant(studentData?.civility),
        fname : studentData?.first_name,
        lname : studentData?.last_name,
        schoolcommercialname : studentData?.school?.short_name,
        titlecommercialname : studentData?.rncp_title?.short_name,
        classname : studentData?.current_class?.name,
        ft_status : this.translate.instant('certification.' + studentData?.final_transcript_id?.jury_decision_for_final_transcript)
      }),
      confirmButtonText: '<span style="color: #323232">' + this.translate.instant('RESIGNATION_STUD_S1_BLOCK.BUTTON') + '</span>',
      confirmButtonColor: '#ffd740',
      cancelButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Cancel'),
      cancelButtonColor: '#ff4040',
      showCancelButton: true,
      footer: `<span style="margin-left: auto">RESIGNATIONSTUD_S1</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      width: 800
    }).then((resp) => {
      if(resp?.value) {
        this.subs.sink = this.dialog.open(TransferStudentResignationDialogComponent, {
          disableClose: true,
            panelClass: 'certification-rule-pop-up',
            width: '750px',
            data: studentData
          }).afterClosed().subscribe((resp) => {
            if (resp) {
              this.reload.emit({ reload: true, deactivation: true });
              // this.getStudentData();
            }
          }) 
      }
    })
  }

  swalResignationStudS2(studentData){
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('RESIGNATION_STUD_S1_BLOCK.TITLE'),
      html: this.translate.instant('RESIGNATION_STUD_S2_BLOCK.TEXT',{
        civ : studentData.civility,
        fname : studentData.first_name,
        lname : studentData.last_name,
        schoolcommercialname : studentData.school.short_name,
        titlecommercialname : studentData.rncp_title.short_name,
        classname : studentData.current_class.name
      }),
      confirmButtonText: this.translate.instant('RESIGNATION_STUD_S2_BLOCK.BUTTON_CONFRIM'),
      showCancelButton: false,
      footer: `<span style="margin-left: auto">RESIGNATIONSTUD_S2</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      width: 800
    })
  }

  dialogResignationStudS3(studentData){
    this.dialog.open(ResignationActiveMarkPrevCourseDialogComponent,{
      disableClose: true,
      width: '1000px',
      panelClass: 'certification-rule-pop-up',
      data: studentData
    }).afterClosed().subscribe((resp)=>{
      if(resp?.action === 'transfer'){
        delete resp?.action;
        this.subs.sink = this.dialog.open(TransferStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '750px',
          data: { ...resp }
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.reload.emit({ reload: true, deactivation: true });
            // this.getStudentData();
          }
        })
      } else if(resp?.action === 'suspend') {
        delete resp?.action;
        this.subs.sink = this.dialog.open(SuspendStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '750px',
          data: { ...resp }
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.reload.emit({ reload: true, deactivation: true });
            // this.getStudentData();
          }
        })
      }
    });
  }

  dialogResignationStudS4(studentData){
    this.subs.sink = this.dialog.open(ResignationActiveNonMarkPrevCourseDialogComponent, {
      disableClose: true,
      panelClass: 'certification-rule-pop-up',
      width: '750px',
      data: { ...studentData }
    }).afterClosed().subscribe((resp) => {
      if(resp?.action === 'transfer') {
        delete resp?.action;
        this.subs.sink = this.dialog.open(TransferStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '750px',
          data: { ...resp }
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.reload.emit({ reload: true, deactivation: true });
            // this.getStudentData();
          }
        })
      } else if (resp?.action === 'deactivate') {
        delete resp?.action;
        this.subs.sink = this.dialog.open(DeactivateStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '600px',
          data: {...resp}
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.reload.emit({ reload: true, deactivation: true });
            // this.getStudentData();
          }
        })
      }
    })
  }

  // deactivateStudent(selectedStudent) {
  //   let timeDisabled = 5;
  //   Swal.fire({
  //     title: this.translate.instant('DEACTIVATEDSUCCESS.CONFIRMDEACTIVETITLE'),
  //     html: this.translate.instant('DEACTIVATEDSUCCESS.CONFIRMDEACTIVE', {
  //       Civility: this.translate.instant(selectedStudent.civility),
  //       LName: selectedStudent.last_name,
  //       FName: selectedStudent.first_name,
  //     }),
  //     type: 'warning',
  //     allowEscapeKey: true,
  //     showCancelButton: true,
  //     confirmButtonClass: 'btn-danger',
  //     allowOutsideClick: false,
  //     confirmButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation'),
  //     cancelButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Cancel'),
  //     onOpen: () => {
  //       Swal.disableConfirmButton();
  //       const confirmBtnRef = Swal.getConfirmButton();
  //       const time = setInterval(() => {
  //         timeDisabled -= 1;
  //         confirmBtnRef.innerText =
  //           this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation') + ' in ' + timeDisabled + ' sec';
  //       }, 1000);
  //       setTimeout(() => {
  //         confirmBtnRef.innerText = this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation');
  //         Swal.enableConfirmButton();
  //         clearTimeout(time);
  //       }, timeDisabled * 1000);
  //     },
  //   }).then((data: any) => {
  //     if (data.value) {
  //       this.subs.sink = this.dialog
  //         .open(DeactivateStudentDialogComponent, {
  //           ...this.deleteStudentConfig,
  //           data: { studentDetails: selectedStudent },
  //         })
  //         .afterClosed()
  //         .subscribe((result) => {
  //           if (result) {
  //             this.reload.emit({ reload: true, deactivation: true });
  //             // this.getStudentData();
  //           }
  //         });
  //     }
  //   });
  // }

  sendMail(data) {
    this.mailStudentsDialog = this.dialog.open(MailStudentDialogComponent, {
      disableClose: true,
      width: '750px',
      data: data,
    });
  }

  sendMailToAcadir(data) {
    this.mailUser = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...data, sendToAcadir: true },
    });
  }

  sendMailToMentor(data) {
    this.mailUser = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...data, sendToMentor: true },
    });
  }

  sendMailN1(value) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.sendReminderStudN1(value._id).subscribe(
      (res) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
          text: this.translate.instant('Email Sent'),
        }).then(() => this.getStudentData());
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }
  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  formatDate(data) {
    if (!data || (!data.date && !data.time)) {
      return '-';
    }
    const timeLocal = this.parseUTCtoLocal.transform(data.time);
    const dateLocal = this.parseUTCtoLocal.transformDate(data.date, data.time);

    return dateLocal + ' ' + timeLocal;
  }

  resetPassword() {
    this.isWaitingForResponseReset = true;
    this.subs.sink = this.authService.resetPasswordV2({ lang: this.translate.currentLang, email: this.studentEmail }).subscribe(
      (resp) => {
        if (resp?.errors && resp?.errors[0]?.message && resp?.errors[0]?.message === 'Forgot password can only be sent one time in a day') {
          this.isWaitingForResponseReset = false;
          this.showErrorForgotOnceDay();
        } else {

          this.isWaitingForResponseReset = false;
          if (resp && resp.data) {
            Swal.fire({
              type: 'info',
              title: this.translate.instant('USER_S4B.TITLE'),
              html: this.translate.instant('USER_S4B.TEXT'),
              allowOutsideClick: false,
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('USER_S4B.BUTTON'),
            });
          }
        }
      },
      (err) => (this.isWaitingForResponseReset = false),
    );
  }

  showErrorForgotOnceDay() {
    Swal.fire({
      allowOutsideClick: false,
      type: 'error',
      title: this.translate.instant('FORGOT_PASSWORD_ONCE_A_DAY.TITLE'),
      text: this.translate.instant('FORGOT_PASSWORD_ONCE_A_DAY.MESSAGE'),
      footer: `<span style="margin-left: auto">FORGOT_PASSWORD_ONCE_A_DAY</span>`,
      showConfirmButton: true,
      allowEnterKey: false,
      allowEscapeKey: false,
      confirmButtonText: this.translate.instant('FORGOT_PASSWORD_ONCE_A_DAY.BUTTON'),
    });
  }

  reactiveStudent(data) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('REACTIVATE_STUDENT.TITLE'),
      html: this.translate.instant('REACTIVATE_STUDENT.TEXT', {
        Civility: this.translate.instant(data.civility),
        LName: data.last_name,
        FName: data.first_name,
      }),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('REACTIVATE_STUDENT.REACTIVATE', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Cancel'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intervalVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('REACTIVATE_STUDENT.REACTIVATE') + ' in ' + timeDisabled + ' sec';
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('REACTIVATE_STUDENT.REACTIVATE');
          Swal.enableConfirmButton();
          // clearTimeout(time);
          clearInterval(this.intervalVal);
        }, timeDisabled * 1000);
        // clearTimeout(this.timeOutVal);
      },
    }).then((inputValue) => {
      if (inputValue.value) {
        this.schoolDeactivateStudentDialog = this.dialog.open(SchoolStudentDeactivatedDialogComponent, {
          disableClose: true,
          width: '500px',
          data: data,
        });
        this.subs.sink = this.schoolDeactivateStudentDialog.afterClosed().subscribe((result) => {
          if (result) {
            // this.getStudentData();
            this.reload.emit({ reload: true, deactivation: true });
            this.schoolDeactivateStudentDialog = null;
          }
        });
      }
    });
  }

  dateDisplay(data) {
    if (data) {
      const finalTime = '15:59';
      const date = this.parseUTCtoLocal.transformDate(data, finalTime);
      const datee = date !== 'Invalid date' ? moment(date, 'DD/MM/YYYY').format('MM/DD/YYYY') : '';
      return date !== '' ? this.datePipe.transform(datee, 'dd MMMM y') : '';
    } else {
      return '';
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
