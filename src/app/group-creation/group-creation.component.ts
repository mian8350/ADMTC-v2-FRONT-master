import { Component, OnInit, OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { StudentData, TestGroupInput, GetTestGroup, StudentCorrectionInput } from './group-creation.model';
import { Location } from '@angular/common';
import { FormControl } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs/operators';
import { Observable } from 'apollo-link';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-group-creation',
  templateUrl: './group-creation.component.html',
  styleUrls: ['./group-creation.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class GroupCreationComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  titleId; // from url
  testId; // from url
  taskId; // from url
  schoolId; // from get task
  classId; // from get task

  titleData; // from get title
  testData; // from get test
  taskData; // from get task
  testProgressData; // from get test progress
  studentList; // from get student list
  groupList; // from get group list
  selectedGroups;

  isDataloaded = false;
  isGroupsLoaded = false;
  isCancelCreate = false;
  isWaitingForResponse = false;
  isLoading = false;

  isRuleFulfilled = false;
  private timeOutVal: any;

  isAllGroupFilled = false;
  blockConditionId: string;
  specializationId: string;
  totalStudent: number;
  totalCompleteAdmission: number;

  constructor(
    private route: ActivatedRoute,
    private groupCreationService: GroupCreationService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
    private translate: TranslateService,
    private location: Location,
    private router: Router,
    public utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.subs.sink = this.route.paramMap.subscribe((params) => {
      this.titleId = params.get('titleId');
      this.testId = params.get('testId');
      this.taskId = params.get('taskId');
    });
    this.isWaitingForResponse = true;

    // Event listener
    this.subs.sink = this.groupCreationService.studentListData.subscribe((data) => {
      this.studentList = data;
    });

    this.subs.sink = this.groupCreationService.groupListData.pipe(distinctUntilChanged((a, b) => a === b)).subscribe((data) => {
      this.groupList = data;
      const timeout = setTimeout(() => {
        this.formatSavedStudentData(this.groupCreationService.getGroupCreationDataNoSub());
        clearTimeout(timeout);
      }, 200);
    });

    this.subs.sink = this.groupCreationService.groupCreationData$.pipe(distinctUntilChanged((a, b) => a === b)).subscribe((data) => {
      this.isAllGroupFilled = !this.checkIfGroupEmpty();
    });
    this.isWaitingForResponse = false;

    // Init data
    this.getDataFromParam();
  }

  /*
    Start Functions For Fetch Data
  */
  getDataFromParam() {
    this.isWaitingForResponse = true;
    const forkParam = [];
    // get title data
    if (this.titleId) {
      const titleGet = this.groupCreationService.getTitle(this.titleId);
      forkParam.push(titleGet);
    }

    // get test data
    if (this.testId) {
      const testGet = this.groupCreationService.getTest(this.testId);
      forkParam.push(testGet);
    }

    // get task data
    if (this.taskId) {
      const taskGet = this.groupCreationService.getTask(this.taskId);
      forkParam.push(taskGet);
    }

    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      this.isDataloaded = true;
      if (resp && resp.length) {
        let count = 0;
        if (this.titleId) {
          this.titleData = resp[count];
          count++;
        }
        if (this.testId) {
          this.testData = resp[count];

          if (
            this.testData &&
            this.testData.block_of_competence_condition_id &&
            this.testData.block_of_competence_condition_id._id &&
            this.testData.class_id &&
            this.testData.class_id.type_evaluation === 'expertise'
          ) {
            this.blockConditionId = this.testData.block_of_competence_condition_id._id;
          }

          if (
            this.testData &&
            this.testData.block_of_competence_condition_id &&
            this.testData.block_of_competence_condition_id.specialization &&
            this.testData.block_of_competence_condition_id.specialization._id
          ) {
            this.specializationId = this.testData.block_of_competence_condition_id.specialization._id;
          }
          count++;
        }
        if (this.taskId) {
          this.taskData = resp[count];
          this.schoolId = this.taskData.school._id;
          this.classId = this.taskData.class_id._id;
          this.getTotalCounts(this.schoolId, this.titleId, this.classId);
          count++;
        }
      }

      // get test progress
      if (this.testId && this.schoolId) {
        this.isDataloaded = false;
        this.getTestProgress();
      }

      const testIds = [this.testId];

      const forkParam2 = [];
      // get student list
      if (this.schoolId && this.titleId && this.classId) {
        const getStudent = this.groupCreationService.getAllStudentForGroupCreation(
          this.schoolId,
          this.titleId,
          this.classId,
          true,
          testIds,
          this.specializationId,
          this.blockConditionId,
        );
        forkParam2.push(getStudent);
      }

      // get all groups
      if (this.testId && this.schoolId) {
        const getGroups = this.groupCreationService.getTestGroups(this.testId, this.schoolId);
        forkParam2.push(getGroups);
      }

      this.subs.sink = forkJoin(forkParam2).subscribe((response) => {
        if (response && response.length) {
          let count = 0;
          if (this.schoolId && this.titleId && this.classId) {
            this.getStudentList(response[count]);
            count++;
          }
          if (this.testId && this.schoolId) {
            this.getAllGroups(response[count]);
            count++;
          }
        }
      });




      this.isWaitingForResponse = false;
    });
  }

  getTestProgress() {
    const forkParam = [];

    forkParam.push(this.groupCreationService.getTestProgress(this.testId, this.schoolId));
    forkParam.push(this.groupCreationService.CheckIfTestCorrectionMarkExistsForStudentGroupTest(this.testId, this.schoolId));

    this.isLoading = true;
    this.subs.sink = forkJoin(forkParam).subscribe(resp => {

      if (resp && resp.length) {
        // First is test progress
        let data;

        if (resp && resp[0]) {
          this.isDataloaded = true;
          data = _.cloneDeep(resp[0]);
          data['is_document_expected_done'] = data.document_expected_done_count && data.document_expected_done_count.length ? true : false;
          data['is_assign_corrector_done'] = data.assign_corrector_done && data.assign_corrector_done.length ? true : false;
          data['is_mark_entry_done'] = data.mark_entry_done && data.mark_entry_done.length ? true : false;
          data['is_validate_done'] = data.validate_done && data.validate_done.length ? true : false;
          data['is_create_group_done'] = data.create_group_done && data.create_group_done.length ? true : false;
          data['already_filled_mark_entry'] = false;
        }

        // Second is if mark entry started
        if (resp && resp[1]) {
          data['already_filled_mark_entry'] = true;
        }

        this.testProgressData = data;

        this.isLoading = false;
      }
    })
  }

  getStudentList(data) {
    this.isWaitingForResponse = true;
    const temp = _.cloneDeep(data);
    this.formatStudentData(temp);
    this.isWaitingForResponse = false;
  }

  getAllGroups(data) {
    this.isWaitingForResponse = true;
    const temp = _.cloneDeep(data);
    this.formatGroupData(temp);
    this.isWaitingForResponse = false;
  }

  getTotalCounts(schoolId: string, titleId: string, classId: string) {
    this.subs.sink = this.groupCreationService.getTotalGroupStudent(schoolId, titleId, classId).subscribe(resp => {
      if (resp) {
        this.totalStudent = resp.total_student;
        this.totalCompleteAdmission = resp.total_complete_admission;
      }
    })
  }
  /*
    End Functions For Fetch Data
  */

  /*
    Start Action functions
  */
  cancel() {
    let timeDisabled = 5;
    swal
      .fire({
        type: 'question',
        title: this.translate.instant('CANCEL_GROUP.TITLE'),
        text: this.translate.instant('CANCEL_GROUP.TEXT'),
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('CANCEL_GROUP.BUTTON1', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('CANCEL_GROUP.BUTTON2'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          swal.disableConfirmButton();
          const confirmBtnRef = swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('CANCEL_GROUP.BUTTON1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('CANCEL_GROUP.BUTTON1');
            swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      })
      .then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.isCancelCreate = true;
          this.location.back();
        }
      });
  }

  saveAsDraft() {
    this.isWaitingForResponse = true;
    const data: TestGroupInput[] = _.cloneDeep(this.groupCreationService.getGroupCreationDataNoSub());
    if (data && data.length) {
      if (data[0]._id) {
        if (this.testProgressData.is_create_group_done) {
          this.subs.sink = this.groupCreationService.updateTestGroups(data).subscribe((resp) => {
            this.isWaitingForResponse = false;

            if (resp && resp.length && data.length === resp.length) {
              swal.fire({
                type: 'success',
                title: this.translate.instant('Group_S9B.TITLE'),
                html: this.translate.instant('Group_S9B.TEXT'),
                confirmButtonText: this.translate.instant('Group_S9B.BUTTON'),
              })
              .then(() => {
                data.forEach((group, index) => {
                  group._id = resp[index]._id;
                });
                this.groupCreationService.setGroupCreationData(data);
                this.groupCreationService.setGroupFirstData(data);
              });
            }
          });
        } else {
          this.subs.sink = this.groupCreationService.updateTestGroups(data).subscribe((resp) => {
            this.isWaitingForResponse = false;

            if (resp && resp.length && data.length === resp.length) {
              swal
                .fire({
                  type: 'success',
                  title: this.translate.instant('Group_S5.TITLE'),
                  html: this.translate.instant('Group_S5.TEXT'),
                  confirmButtonText: this.translate.instant('Group_S5.BUTTON'),
                })
                .then(() => {
                  data.forEach((group, index) => {
                    group._id = resp[index]._id;
                  });
                  this.groupCreationService.setGroupCreationData(data);
                  this.groupCreationService.setGroupFirstData(data);
                });
            }
          });
        }
      } else {
        data.forEach((group) => {
          delete group._id;
        });
        this.subs.sink = this.groupCreationService.createTestGroups(data).subscribe((resp) => {
          this.isWaitingForResponse = false;

          if (resp && resp.length && data.length === resp.length) {
            swal
              .fire({
                type: 'success',
                title: this.translate.instant('Group_S5.TITLE'),
                text: this.translate.instant('Group_S5.TEXT'),
                confirmButtonText: this.translate.instant('Group_S5.BUTTON'),
              })
              .then(() => {
                data.forEach((group, index) => {
                  group._id = resp[index]._id;
                });
                this.groupCreationService.setGroupCreationData(data);
                this.groupCreationService.setGroupFirstData(data);
              });
          }
        });
      }
    } else {
      swal.fire({
        type: 'success',
        title: this.translate.instant('Group_S5.TITLE'),
        html: this.translate.instant('Group_S5.TEXT'),
        confirmButtonText: this.translate.instant('Group_S5.BUTTON'),
      });
    }
  }

  saveAndSubmit() {
    this.isWaitingForResponse = true;

    const tempData: TestGroupInput[] = _.cloneDeep(this.groupCreationService.getGroupCreationDataNoSub());
    const data = this.formatPublish(tempData);

    if (data && data.length) {



      let whichSwal = 'Group_S6.'
      if (this.testProgressData && this.testProgressData.is_create_group_done) {
        whichSwal = 'Group_S10.'
      }

      if (data[0]._id) {
        swal
          .fire({
            type: 'warning',
            title: this.translate.instant(whichSwal + 'TITLE'),
            html: this.translate.instant(whichSwal + 'TEXT'),
            showCancelButton: true,
            confirmButtonText: this.translate.instant(whichSwal + 'BUTTON1'),
            cancelButtonText: this.translate.instant(whichSwal + 'BUTTON2'),
            allowOutsideClick: false,
          })
          .then((isConFirm) => {
            if (isConFirm.value) {
              this.mutationUpdateTestGroup(data);
            } else {
              this.isWaitingForResponse = false;
            }
          });
      } else {
        data.forEach((group) => {
          delete group._id;
        });
        swal
          .fire({
            type: 'warning',
            title: this.translate.instant(whichSwal + 'TITLE'),
            html: this.translate.instant(whichSwal + 'TEXT'),
            showCancelButton: true,
            confirmButtonText: this.translate.instant(whichSwal + 'BUTTON1'),
            cancelButtonText: this.translate.instant(whichSwal + 'BUTTON2'),
            allowOutsideClick: false,
          })
          .then((isConFirm) => {
            if (isConFirm.value) {
              this.mutationCreateTestGroup(data);
            } else {
              this.isWaitingForResponse = false;
            }
          });
      }
    }
  }

  mutationUpdateTestGroup(data) {
    this.subs.sink = this.groupCreationService.updateTestGroups(data).subscribe((resp) => {
      this.isWaitingForResponse = false;

      if (resp && resp.length && data.length === resp.length) {
        data.forEach((group, index) => {
          group._id = resp[index]._id;
        });
        this.groupCreationService.setGroupCreationData(data);
        this.groupCreationService.setGroupFirstData(data);
        const groupIds = data.map((group) => group._id);

        // the submit
        if (this.taskData && this.taskData.task_status === 'todo') {
          this.groupCreationService.markDoneTask(this.taskId, this.translate.currentLang, groupIds).subscribe((response) => {

            if (response) {
              swal
                .fire({
                  type: 'success',
                  title: this.translate.instant('Group_S6B.TITLE'),
                  html: this.translate.instant('Group_S6B.TEXT'),
                  confirmButtonText: this.translate.instant('Group_S6B.BUTTON'),
                  allowOutsideClick: false,
                })
                .then(() => {
                  this.routeToDashBoard();
                });
            }
          });
        } else {
          swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          })
          .then(() => {
            this.routeToDashBoard();
          });
        }
      }
    });
  }

  mutationCreateTestGroup(data) {
    this.subs.sink = this.groupCreationService.createTestGroups(data).subscribe((resp) => {
      this.isWaitingForResponse = false;

      if (resp && resp.length && data.length === resp.length) {
        data.forEach((group, index) => {
          group._id = resp[index]._id;
        });
        this.groupCreationService.setGroupCreationData(data);
        this.groupCreationService.setGroupFirstData(data);
        const groupIds = data.map((group) => group._id);

        // the submit
        if (this.taskData && this.taskData.task_status === 'todo') {
          this.groupCreationService.markDoneTask(this.taskId, this.translate.currentLang, groupIds).subscribe((response) => {

            if (response) {

              swal
                .fire({
                  type: 'success',
                  title: this.translate.instant('Group_S6B.TITLE'),
                  html: this.translate.instant('Group_S6B.TEXT'),
                  confirmButtonText: this.translate.instant('Group_S6B.BUTTON'),
                  allowOutsideClick: false,
                })
                .then(() => {
                  this.routeToDashBoard();
                });
            }
          });
        } else {
          swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          })
          .then(() => {
            this.routeToDashBoard();
          });
        }
      }
    });
  }
  /*
    End Action functions
  */

  /*
    Start Functions For Utility(Data Processing)
  */
  formatGroupData(data) {
    const temp: GetTestGroup[] = _.cloneDeep(data);
    const result: TestGroupInput[] = [];
    if (temp && temp.length) {
      temp.forEach((group) => {
        const students: StudentCorrectionInput[] = [];
        if (group.students && group.students.length) {
          group.students.forEach((student) => {
            students.push({
              student_id: student.student_id._id,
            });
          });
        }

        result.push({
          _id: group._id,
          name: group.name,
          rncp: group.rncp._id,
          school: group.school._id,
          test: group.test._id,
          students: students,
        });
      });
    }

    this.groupCreationService.setGroupCreationData(result);
    this.groupCreationService.setGroupFirstData(result);
    this.formatSavedStudentData(result);
    this.isGroupsLoaded = true;
  }

  formatStudentData(data?) {
    const temp: StudentData[] = [];
    if (data && data.length) {
      data.forEach((student) => {
        temp.push({
          _id: student._id ? student._id : null,
          first_name: student.first_name ? student.first_name : null,
          last_name: student.last_name ? student.last_name : null,
          group_id: null,
          group_name: null,
        });
      });
    } else {
    }
    this.groupCreationService.setStudentListData(temp);
  }

  formatSavedStudentData(data?) {
    const temp: StudentData[] = [];
    const students: StudentData[] = this.studentList;
    if (students && students.length) {
      students.forEach((student) => {
        let groupFound: TestGroupInput;
        if (data && data.length) {
          data.forEach((group: TestGroupInput) => {
            if (group && group.students && group.students.length) {
              for (const studentGroup of group.students) {
                if (studentGroup.student_id === student._id) {
                  groupFound = group;
                  break;
                }
              }
            }
          });
        }

        temp.push({
          _id: student._id ? student._id : null,
          first_name: student.first_name ? student.first_name : null,
          last_name: student.last_name ? student.last_name : null,
          group_id: groupFound && groupFound._id ? groupFound._id : null,
          group_name: groupFound && groupFound.name ? groupFound.name : null,
        });
      });
    }

    this.groupCreationService.setStudentListData(temp);
  }

  formatPublish(data) {

    if (data && data.length) {
      data.forEach((group) => {
        group.is_published = true;
      });
    }
    return data;
  }

  getTranslatedDate(date) {
    if (date && date.date_utc && date.time_utc) {
      return this.parseUTCtoLocal.transformDate(date.date_utc, date.time_utc);
    } else {
      return '';
    }
  }

  getTaskProgressText() {
    const testProgress = _.cloneDeep(this.testProgressData);
    if (testProgress) {
      if (testProgress.is_validate_done) {
        return `${this.translate.instant('TEST.Current Progress')} : ${testProgress.validate_done.length} ${this.translate.instant(
          'TEST.of',
        )} ${testProgress.school_count} ${this.translate.instant('TEST.TASKDONE.Validate Task Done')}`;
      } else if (testProgress.is_mark_entry_done) {
        return `${this.translate.instant('TEST.Current Progress')} : ${testProgress.mark_entry_done.length} ${this.translate.instant(
          'TEST.of',
        )} ${testProgress.school_count} ${this.translate.instant('TEST.TASKDONE.Mark Entry Task Done')}`;
      } else if (testProgress.is_assign_corrector_done) {
        return `${this.translate.instant('TEST.Current Progress')} : ${testProgress.assign_corrector_done.length} ${this.translate.instant(
          'TEST.of',
        )} ${testProgress.school_count} ${this.translate.instant('TEST.TASKDONE.Assign Corrector Task Done')}`;
      } else {
        return `${this.translate.instant('TEST.Current Progress')} : 0 ${this.translate.instant('TEST.of')} ${
          testProgress.school_count
        } ${this.translate.instant('TEST.TASKDONE.Assign Corrector Task Done')}`;
      }
    }
    return '';
  }

  checkStudentAssigned(): boolean {
    let validation = true;

    // Check if all student is allocated
    for (const student of this.studentList) {
      if (!student.group_id) {
        validation = false;
        break;
      }
    }

    return validation;
  }

  checkSaveButtonEnabled(): boolean {
    let result = false;
    if (this.taskData && this.taskData.task_status === 'done') {
      if (!this.getDataChanges() && this.checkStudentAssigned()) {
        result = true;
        return result;
      }
    } else if (this.taskData && this.taskData.task_status === 'todo') {
      if (!this.getDataChanges()) {
        result = true;
        return result;
      }
    } else {
      result = false;
      return result;
    }
  }

  checkIfGroupEmpty() {
    const data: TestGroupInput[] = _.cloneDeep(this.groupCreationService.getGroupCreationDataNoSub());
    let result = false;
    if (data && data.length) {
      for (const group of data) {
        if (group && (!group.students || !group.students.length)) {
          result = true;
          break;
        }
      }
    }

    return result;
  }

  routeToDashBoard() {
    this.router.navigate(['/rncpTitles', this.titleId, 'dashboard']);
  }
  /*
    End Functions For Utility(Data Processing)
  */

  getDataChanges() {
    const dataForm = _.cloneDeep(this.groupCreationService.getGroupCreationDataNoSub());
    const dataNow = _.cloneDeep(this.groupCreationService.getGroupCreationFirstDataNoSub());
    return _.isEqual(dataForm, dataNow);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;

    // The actual validation, by comparing data saved and current data in the form
    if (this.getDataChanges() || this.isCancelCreate) {
      validation = true;
    } else {
      validation = false;
    }

    // Passing the validation into the canExitService, if we return true, meaning user are allowed to go, otherwise user will stay
    if (!validation) {
      return new Promise((resolve, reject) => {
        swal
          .fire({
            type: 'warning',
            title: this.translate.instant('TMTC_S01.TITLE'),
            text: this.translate.instant('TMTC_S01.TEXT'),
            confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
            allowEscapeKey: false,
            allowOutsideClick: false,
          })
          .then((result) => {
            if (result.value) {
              resolve(false);
            } else {
              resolve(true);
            }
          });
      });
    } else {
      return true;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.groupCreationService.resetGroupCreationData();
    this.groupCreationService.resetGroupFirstData();
    this.groupCreationService.resetGroupListData();
    this.groupCreationService.resetStudentListData();

  }
}
