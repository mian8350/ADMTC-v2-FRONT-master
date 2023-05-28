import { Component, OnInit, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators, UntypedFormControl } from '@angular/forms';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GroupDropdown, TestGroupInput, StudentData, SelectedGroup, GetTestGroup, StudentCorrectionInput } from '../group-creation.model';
import { swalDefaultsProvider } from '@sweetalert2/ngx-sweetalert2/di';
import { DuplicateGroupDialogComponent } from './duplicate-group-dialog/duplicate-group-dialog.component';
import { AddGroupDialogComponent } from './add-group-dialog/add-group-dialog.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'apollo-link';

@Component({
  selector: 'ms-group-cards',
  templateUrl: './group-cards.component.html',
  styleUrls: ['./group-cards.component.scss'],
})
export class GroupCardsComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @Input() titleData;
  @Input() testData;
  @Input() taskData;
  @Input() testProgressData;
  @Input() totalStudent: number;
  @Input() totalCompleteAdmission: number;

  @ViewChild('toggleElement', {static: false}) ref: ElementRef;

  dummyFormGroup: UntypedFormGroup;
  testGroups: UntypedFormArray;

  studentList;

  init = true;
  isGroupSelected = false;
  isAllGroupSelected = false;

  is_automatic = new UntypedFormControl(false);
  isAutomatic = false;
  isWaitingForResponse = false;

  private intVal: any;
  private timeOutVal: any;

  constructor(
    private fb: UntypedFormBuilder,
    private groupCreationService: GroupCreationService,
    public dialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    // this.testGroups = new FormArray([]);

    this.testGroups = this.fb.array([]);
    this.dummyFormGroup = this.fb.group({
      testGroups: this.testGroups,
    });

    this.subs.sink = this.groupCreationService.groupCreationData$
      .pipe(debounceTime(800))
      .pipe(distinctUntilChanged())
      .subscribe((resp) => {

        if (this.init) {
          this.formatGroupData(resp);
          this.init = false;
        }
      });

    this.subs.sink = this.groupCreationService.studentListData.subscribe((data) => {
      this.studentList = data;
      this.populateStudent();
    });

    let count = 0;
    // **************** On add/edit/delete group
    this.subs.sink = this.testGroups.valueChanges
      .pipe(debounceTime(800))
      .pipe(distinctUntilChanged())
      .subscribe((resp) => {

        this.updateGroupDropdown();
        this.groupCreationService.setGroupCreationData(this.formatGroupPayload(_.cloneDeep(this.testGroups.value)));
        count++;
        if (count === 1) {
          this.groupCreationService.setGroupFirstData(this.formatGroupPayload(_.cloneDeep(this.testGroups.value)));
        }
      });
  }

  initGroupForm(): UntypedFormGroup {
    return this.fb.group({
      _id: ['', Validators.required],
      dummySelect: [false],
      test: [this.testData._id, Validators.required],
      name: ['', Validators.required],
      students: this.fb.array([]),
      school: [this.taskData.school._id, Validators.required],
      rncp: [this.titleData._id, Validators.required],
      is_published: [false, Validators.required]
    });
  }

  initStudentForm(): UntypedFormGroup {
    return this.fb.group({
      student_id: ['', Validators.required],
    });
  }

  /*
    Start of Utility functions
  */
  formatGroupData(data: TestGroupInput[]) {
    this.testGroups.clear();

    if (data && data.length) {
      data.forEach((group, groupIndex) => {
        this.addGroup();
        if (group && group.students && group.students.length) {
          group.students.forEach((student) => {
            this.addStudent(groupIndex);
          });
        }
      });
    }
    this.testGroups.patchValue(data);
  }

  populateStudent() {
    this.isWaitingForResponse = true;
    const temp: TestGroupInput[] = _.cloneDeep(this.testGroups.value);

    if (temp && temp.length) {
      temp.forEach((group: TestGroupInput, groupIndex) => {
        if (this.studentList) {
          const result = this.studentList.filter((student: StudentData) => student.group_name === group.name);
          if (result && result.length) {
            this.getStudentFormArray(groupIndex).clear();
            result.forEach((student: StudentData, studentIndex) => {
              this.addStudent(groupIndex);
              this.getStudentFormArray(groupIndex).at(studentIndex).get('student_id').patchValue(student._id);
            });
            // if mark already started, need to reset the select value after student changed
            if (this.testProgressData && this.testProgressData.is_assign_corrector_done) {
              this.getGroupFormArray().at(groupIndex).get('dummySelect').patchValue(false);
            }
          } else {
            this.getStudentFormArray(groupIndex).clear();
          }
        }
      });
    }
    this.isWaitingForResponse = false;
  }

  updateGroupDropdown() {
    this.isWaitingForResponse = true;
    const payload: GroupDropdown[] = [];
    const data: TestGroupInput[] = _.cloneDeep(this.testGroups.value);
    if (data && data.length) {
      data.forEach((group) => {
        payload.push({
          group_id: group._id,
          group_name: group.name
        });
      });
    }
    this.isWaitingForResponse = false;

    this.groupCreationService.setGroupListData(payload);
  }

  getStudentName(studentId: string): string {
    let studentName = '';
    if (this.studentList && this.studentList.length && studentId) {
      const result = _.find(this.studentList, (student) => student._id === studentId);
      if (result) {
        studentName = result.last_name.toUpperCase() + ' ' + result.first_name;
      } else {
        studentName = '';
      }
    }
    return studentName;
  }

  formatGroupPayload(data: TestGroupInput[]) {
    if (data && data.length) {
      let count = 0;
      data.forEach((group) => {
        if (group && !group._id) {
          delete group._id;
        }
        if (group && group.dummySelect) {
          this.isGroupSelected = true;
          count++;
        }
        delete group.dummySelect;
      });

      if (count === data.length) {
        this.isAllGroupSelected = true;
      } else if (count) {
        this.isAllGroupSelected = false;
      } else {
        this.isGroupSelected = false;
        this.isAllGroupSelected = false;
      }
    }
    return data;
  }

  formatGroupDuplicate(data: GetTestGroup[]) {
    const temp: GetTestGroup[] = _.cloneDeep(data);
    const result: TestGroupInput[] = [];
    this.deleteGroupsNoSwal();
    this.testGroups.clear();
    if (temp && temp.length) {
      temp.forEach((group, groupIndex) => {
        this.addGroup();
        const students: StudentCorrectionInput[] = [];
        if (group.students && group.students.length) {
          group.students.forEach((student) => {
            this.addStudent(groupIndex);
            students.push({
              student_id: student.student_id._id,
            });
          });
        }

        result.push({
          name: group.name,
          rncp: group.rncp._id,
          school: group.school._id,
          test: this.testData._id,
          students: students,
        });
      });
    }

    this.testGroups.patchValue(result);
    this.saveTestGroups();


    // this.groupCreationService.setGroupCreationData(result);
  }

  formatPayloadDelete() {
    const data = this.getGroupFormArray().value;
    const tempId = [];
    const tempIndex = [];
    if (data && data.length) {
      data.forEach((group: TestGroupInput, groupIndex) => {
        if (group && group.dummySelect) {
          tempId.push(group._id);
          tempIndex.push(groupIndex);
        }
      });
    }
    return {
      index: tempIndex,
      _ids: tempId,
    };
  }

  getTitleForGeneratedGroup() {
    const cards = this.testGroups.value;
    if (cards.length) {

      const tmpArr = [];
      let text = '';

      for (let index = 0; index < cards.length; index++) {
        if (cards && cards[index] && cards[index].students) {
          tmpArr.push(cards[index].students.length);
        }
      }
      const tmpObj = _.countBy(tmpArr);
      for (const key in tmpObj) {
        if (key) {
          text = text + '  ' + this.translate.instant('TESTCORRECTIONS.GROUP.GroupOfStudent', { groups: tmpObj[key], students: key });
        }
      }
      return text.length ? text.substring(0, text.length - 1) : '';
    }
    return '';
  }

  checkDuplicateGroup(groupName: string): boolean {
    let isDuplicate = false;
    const groupData = this.testGroups.value;


    if (groupData && !groupData.length) {
      isDuplicate = false;
    } else {
      const found = _.find(groupData, (group) => group.name.toLowerCase() === groupName.toLowerCase());
      if (found) {
        isDuplicate = true;
      }
    }


    return isDuplicate;
  }

  isTaskDoneAndAllGroupSelected() {
    let result = false;
    if (this.testProgressData && this.testProgressData.is_assign_corrector_done && this.isAllGroupSelected) {
      result = true;
    }
    return result;
  }
  /*
    End of Utility functions
  */

  /*
    Start Action Functions
  */
  openAddGroup() {
    this.subs.sink = this.dialog
      .open(AddGroupDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          test: this.testData._id,
          school: this.taskData.school._id,
          rncp: this.titleData._id,
        },
      })
      .afterClosed()
      .subscribe((response) => {

        if (response) {
          if (response && !this.checkDuplicateGroup(response.name)) {
            this.addGroup();
            this.getGroupFormArray()
              .at(this.getGroupFormArray().length - 1)
              .get('name')
              .patchValue(response.name, { emitEvent: false });
            this.saveTestGroups('add');

          } else {
            swal.fire({
              type: 'error',
              title: 'Error !',
              text: 'Group name has to be unique'
            })
          }
        }
      });
  }

  openDuplicateGroup() {
    this.subs.sink = this.dialog
      .open(DuplicateGroupDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          task: this.taskData.class_id._id,
          school: this.taskData.school._id,
          rncp: this.titleData._id,
          test: this.testData._id
        },
      })
      .afterClosed()
      .subscribe((result) => {

        if (result) {
          this.isWaitingForResponse = true;
          this.subs.sink = this.groupCreationService.getTestGroups(result.test_id, result.school_id).subscribe((resp) => {
            this.isWaitingForResponse = false;

            if (resp && resp.length) {
              this.formatGroupDuplicate(resp);
            } else {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('DUPLICATE_GROUP.TITLE'),
                text: this.translate.instant('DUPLICATE_GROUP.TEXT'),
                confirmButtonText: this.translate.instant('DUPLICATE_GROUP.BUTTON'),
              });
            }
          });
        }
      });
  }

  selectAllGroup() {
    const data = _.cloneDeep(this.getGroupFormArray().value);
    if (data && data.length) {
      data.forEach((test: TestGroupInput) => {
        test.dummySelect = true;
      });
    }
    this.getGroupFormArray().patchValue(data);
  }

  unselectAllGroup() {
    const data = _.cloneDeep(this.getGroupFormArray().value);
    if (data && data.length) {
      data.forEach((test: TestGroupInput) => {
        test.dummySelect = false;
      });
    }
    this.getGroupFormArray().patchValue(data);
  }

  deleteGroups() {
    if (this.isSelectedGroupsHasStudent()) {
      let timeDisabled = 6;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('GROUP_CREATION_SWAL.DELETE_GROUP_S1.TITLE'),
        html: this.translate.instant('GROUP_CREATION_SWAL.DELETE_GROUP_S1.TEXT'),
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('GROUP_CREATION_SWAL.DELETE_GROUP_S1.BUTTON_CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('GROUP_CREATION_SWAL.DELETE_GROUP_S1.BUTTON_CANCEL'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('GROUP_CREATION_SWAL.DELETE_GROUP_S1.BUTTON_CONFIRM') + ` (${timeDisabled})`;
          }, 1000);
  
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('GROUP_CREATION_SWAL.DELETE_GROUP_S1.BUTTON_CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          const result = this.formatPayloadDelete();

          this.subs.sink = this.groupCreationService.deleteTestGroups(result._ids).subscribe((resp) => {

            if (resp && resp === 'Delete Group Success') {
              if (result && result.index && result.index.length) {
                result.index = result.index.reverse();
                result.index.forEach((index) => {
                  this.removeGroupFormArray(index);
                });
              }
              swal.fire({
                type: 'success',
                title: 'Bravo',
              });
            }
          });
        }
      });
    } else {
      const result = this.formatPayloadDelete();

      this.subs.sink = this.groupCreationService.deleteTestGroups(result._ids).subscribe((resp) => {

        if (resp && resp === 'Delete Group Success') {
          if (result && result.index && result.index.length) {
            result.index = result.index.reverse();
            result.index.forEach((index) => {
              this.removeGroupFormArray(index);
            });
          }
          swal.fire({
            type: 'success',
            title: 'Bravo',
          });
        }
      });
    }
  }

  deleteGroupsNoSwal() {
    const result = this.formatPayloadDelete();
    this.subs.sink = this.groupCreationService.deleteTestGroups(result._ids).subscribe((resp) => {

      if (resp && resp === 'Delete Group Success') {
        if (result && result.index && result.index.length) {
          result.index = result.index.reverse();
          result.index.forEach((index) => {
            this.removeGroupFormArray(index);
          });
        }
      }
    });
  }

  isSelectedGroupsHasStudent() {
    const data = this.getGroupFormArray().value;
    let result = false;
    if (data && data.length) {
      for (const group of data) {
        if (group && group.dummySelect && group.students && group.students.length && group.students.length > 0) {
          result = true;
          break;
        }
      }
    }
    return result;
  }

  automaticGroups(event: MatSlideToggleChange) {
    if (event.checked) {
      const data = _.cloneDeep(this.testGroups.value);
      // *************** If data already exist, then show swal
      if (data && data.length) {
        let timeDisabled = 5;
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('GROUP_S8.TITLE'),
          text: this.translate.instant('GROUP_S8.TEXT'),
          confirmButtonText: this.translate.instant('GROUP_S8.BUTTON1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('GROUP_S8.BUTTON2'),
          allowEscapeKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
          onOpen: () => {
            Swal.disableConfirmButton();
            const confirmBtnRef = Swal.getConfirmButton();
            this.intVal = setInterval(() => {
              timeDisabled -= 1;
              confirmBtnRef.innerText = this.translate.instant('GROUP_S8.BUTTON1') + ` (${timeDisabled})`;
            }, 1000);
            this.timeOutVal = setTimeout(() => {
              confirmBtnRef.innerText = this.translate.instant('GROUP_S8.BUTTON1');
              Swal.enableConfirmButton();
              clearInterval(this.intVal);
            }, timeDisabled * 1000);
          },
        }).then((result) => {

          if (result.value) {
            this.generateAutomaticGroup();
          } else {
            this.is_automatic.patchValue(false);
            // this.isAutomatic = false;
          }
        });
      } else {
        this.generateAutomaticGroup();
      }
    } else {
      this.is_automatic.patchValue(false);
      // this.isAutomatic = false;
    }
  }

  generateAutomaticGroup() {
    this.isWaitingForResponse = true;
    this.is_automatic.patchValue(true);
    this.isAutomatic = true;
    this.subs.sink = this.groupCreationService.createAutomaticTestGroups(this.testData._id, this.taskData.school._id).subscribe(
      (resp) => {
        if (resp) {
          const temp: GetTestGroup[] = _.cloneDeep(resp);
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

          this.formatGroupData(result);
          this.isWaitingForResponse = false;
        }
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('GENERATE_GROUP_NOT_FOUND.TITLE'),
          text: this.translate.instant('GENERATE_GROUP_NOT_FOUND.TEXT'),
          confirmButtonText: this.translate.instant('GENERATE_GROUP_NOT_FOUND.BUTTON'),
        });
      },
    );
  }

  saveTestGroups(type?) {
    this.isWaitingForResponse = true;
    const data: TestGroupInput[] = this.formatGroupPayload(_.cloneDeep(this.testGroups.value));
    if (data && data.length) {
      if (data[0]._id) {
        this.subs.sink = this.groupCreationService.updateTestGroups(data).subscribe((resp) => {
          this.isWaitingForResponse = false;

          if (resp && resp.length && data.length === resp.length) {
            data.forEach((group, index) => {
              group._id = resp[index]._id;
              this.getGroupFormArray().at(index).get('_id').patchValue(resp[index]._id);
            });
            if (type && type === 'add') {
              swal.fire({
                type: 'success',
                title: 'Bravo'
              })
            }
          }
        });
      } else {
        data.forEach((group) => {
          delete group._id;
        });
        this.subs.sink = this.groupCreationService.createTestGroups(data).subscribe((resp) => {
          this.isWaitingForResponse = false;

          if (resp && resp.length && data.length === resp.length) {
            data.forEach((group, index) => {
              group._id = resp[index]._id;
              this.getGroupFormArray().at(index).get('_id').patchValue(resp[index]._id);
            });
            if (type && type === 'add') {
              swal.fire({
                type: 'success',
                title: 'Bravo'
              })
            }
          }
        });
      }
    }
  }
  /*
    End Action Functions
  */

  /*
    Start Form Array Functions
  */
  addGroup() {
    this.testGroups.push(this.initGroupForm());
  }

  addStudent(groupIndex) {
    this.getStudentFormArray(groupIndex).push(this.initStudentForm());
  }

  getGroupFormArray(): UntypedFormArray {
    return this.testGroups as UntypedFormArray;
  }

  getStudentFormArray(groupIndex): UntypedFormArray {
    return this.getGroupFormArray().at(groupIndex).get('students') as UntypedFormArray;
  }

  removeGroupFormArray(groupIndex) {
    this.getGroupFormArray().removeAt(groupIndex);
  }

  removeStudentFormArray(groupIndex, studentIndex) {
    this.getStudentFormArray(groupIndex).removeAt(studentIndex);
  }
  /*
    End Form Array Functions
  */

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
