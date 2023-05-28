import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { StudentsService } from 'app/service/students/students.service';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-deactivate-student-dialog',
  templateUrl: './deactivate-student-dialog.component.html',
  styleUrls: ['./deactivate-student-dialog.component.scss'],
})
export class DeactivateStudentDialogComponent implements OnInit, OnDestroy {
  public studentDeleteForm: UntypedFormGroup;
  private subs = new SubSink();
  private timeOutVal: any;
  isWaitingForResponse = false;

  testList = [];
  blockList = [];

  selectedTests = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<DeactivateStudentDialogComponent>,
    private translate: TranslateService,
    private studentService: StudentsService,
    private dateAdapter: DateAdapter<Date>,
    public utilService: UtilityService
  ) {}

  ngOnInit() {

    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.initform();
    this.fetchTestList();
  }

  initform() {
    this.studentDeleteForm = this.fb.group({
      student_id: [this.data.studentDetails._id],
      reason_for_resignation: [null, Validators.required],
      date_of_resignation: [this.getTodayDate(), Validators.required],
    });
  }

  fetchTestList() {
    this.isWaitingForResponse = true;
    const titleId =
      this.data && this.data.studentDetails && this.data.studentDetails.rncp_title && this.data.studentDetails.rncp_title._id
        ? this.data.studentDetails.rncp_title._id
        : null;
    const classId =
      this.data && this.data.studentDetails && this.data.studentDetails.current_class && this.data.studentDetails.current_class._id
        ? this.data.studentDetails.current_class._id
        : null;
    const schoolId =
      this.data && this.data.studentDetails && this.data.studentDetails.school && this.data.studentDetails.school._id
        ? this.data.studentDetails.school._id
        : null;
    this.subs.sink = this.studentService.getDeactiveStudentTestList(titleId, classId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.testList = _.cloneDeep(resp)
        this.formatBlockList(this.testList);
      }
    });
  }

  formatBlockList(
    testList: {
      _id: string;
      name: string;
      is_published: Boolean;
      block_of_competence_condition_id: { _id: string; block_of_competence_condition: string };
    }[],
  ) {
    // *************** Code the mapping here, expected result is blockList: { _id: string, name: string, tests: test[] }
    this.blockList = [];
    testList.forEach(test => {
      if (test && test.block_of_competence_condition_id) {
        const foundBlock = this.blockList.find((block => block && block._id === test.block_of_competence_condition_id._id));
        if (foundBlock) {
          foundBlock.tests.push(test);
        } else {
          this.blockList.push({
            _id: test.block_of_competence_condition_id._id,
            name: test.block_of_competence_condition_id.block_of_competence_condition,
            tests: [test]
          });
        }
      }
    });
  }

  onCheckTest(event: MatCheckboxChange, test) {
    if (event && event.checked && test._id) {
      if (!this.selectedTests.includes(test._id)) {
        this.selectedTests.push(test._id);
      }
    } else if (event && !event.checked && test._id) {
      const foundIndex = this.selectedTests.findIndex((testId) => testId === test._id);
      if (foundIndex || foundIndex === 0) {
        this.selectedTests.splice(foundIndex, 1);
      }
    }

  }

  deleteStudent() {
    const studentId = this.studentDeleteForm.get('student_id').value;
    const reason = this.studentDeleteForm.get('reason_for_resignation').value;
    const date = this.studentDeleteForm.get('date_of_resignation').value;
    const testList = this.selectedTests;
    // const date = moment(this.studentDeleteForm.get('date_of_resignation').value).format('DD/MM/YYYY');
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.deactivateStudent(studentId, reason, date, testList).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          swal
            .fire({
              title: this.translate.instant('DEACTIVATEDSUCCESS.TITLE'),
              html: this.translate.instant('DEACTIVATEDSUCCESS.TEXT', {
                LName: this.data.studentDetails.last_name,
                FName: this.data.studentDetails.first_name,
              }),
              footer: `<span style="margin-left: auto">DEACTIVATEDSUCCESS</span>`,
              allowEscapeKey: true,
              type: 'success',
              confirmButtonText: this.translate.instant('DEACTIVATEDSUCCESS.OK'),
            })
            .then((result) => {
              if (result.value) {
                this.dialogRef.close(true);
              }
            });
        }
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error !',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        }).then((res) => {

        });
      },
    );
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  getTodayDate() {
    return moment().format('DD/MM/YYYY');
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
