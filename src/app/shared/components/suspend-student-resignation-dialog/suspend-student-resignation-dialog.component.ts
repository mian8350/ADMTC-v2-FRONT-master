import { TranslateService } from '@ngx-translate/core';
import swal from 'sweetalert2';
import { StudentsService } from './../../../service/students/students.service';
import { UntypedFormControl, Validators } from '@angular/forms';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';
import * as moment from 'moment';

@Component({
  selector: 'ms-suspend-student-resignation-dialog',
  templateUrl: './suspend-student-resignation-dialog.component.html',
  styleUrls: ['./suspend-student-resignation-dialog.component.scss']
})
export class SuspendStudentResignationDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink()

  isWaitingForResponse: boolean = false;

  inputReason = new UntypedFormControl('', Validators.required);

  blockList = [];
  testList = []
  selectedTests = [];

  constructor(
    private dialog:MatDialogRef<SuspendStudentResignationDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public studentData: any,
    private studentsService: StudentsService,
    public utilService: UtilityService,
    private translate: TranslateService,
    ) { }

  ngOnInit(): void {
    this.getAllTests()
  }

  getAllTests() {
    this.isWaitingForResponse = true;
    this.selectedTests = [];
    this.subs.sink = this.studentsService.getSuspendStudentTestList(
      this.studentData?.rncp_title?._id, this.studentData?.current_class?._id
    ).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.testList = resp;
      if (this.testList?.length) {
        this.testList?.forEach((test) => {
          this.selectedTests.push(test._id);
        })
      }
      console.log('selectedTest', this.selectedTests);
      this.getAllTestBlocks(this.testList)
    })
  }

  getAllTestBlocks(
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
      if (test?.block_of_competence_condition_id) {
        const foundBlock = this.blockList?.find((block => block?._id === test?.block_of_competence_condition_id?._id));
        if (foundBlock) {
          foundBlock?.tests?.push(test);
        } else {
          this.blockList.push({
            _id: test?.block_of_competence_condition_id?._id,
            name: test?.block_of_competence_condition_id?.block_of_competence_condition,
            tests: [test]
          });
        }
      }
    });
  }

  closeDialog() {
    this.dialog.close();
  }

  confirmDialog() {
    this.isWaitingForResponse = true
    
    // declare the payload
    const payload = this.createPayload(this.studentData?.transfer_from)
    
    // call the mutation for transferStudent
    this.subs.sink = this.studentsService?.deactiveStudentResignation(payload).subscribe(() => {
      this.isWaitingForResponse = false
      swal.fire({ 
        type: 'success', 
        title: 'Bravo!', 
        allowOutsideClick: false, 
        confirmButtonText: this.translate.instant('OK') 
      }).then(() => {
        this.dialog.close(true);
      });
    })
  }

  createPayload(transfer_from) {
    let payload;
    if(transfer_from === 'ResignationStud_S3') {
      payload = {
        student_id: this.studentData?._id,
        reason_for_resignation: this.inputReason.value,
        date_of_resignation: this.getTodayDate(),
        student_deactivated_tests_keep: this.selectedTests
      }
    }
    return payload
  }
    
  getTodayDate() {
    return moment().format('DD/MM/YYYY');
  }

  onCheckTest(event: MatCheckboxChange, test) {
    if (event?.checked && test?._id) {
      if (!this.selectedTests.includes(test?._id)) {
        this.selectedTests.push(test?._id);
      }
    } else if (!event?.checked && test?._id) {
      const foundIndex = this.selectedTests.findIndex((testId) => testId === test?._id);
      if (foundIndex || foundIndex === 0) {
        this.selectedTests.splice(foundIndex, 1);
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe()
  }

}
