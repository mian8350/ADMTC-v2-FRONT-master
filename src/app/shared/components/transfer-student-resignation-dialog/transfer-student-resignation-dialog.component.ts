import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ClassIdAndName } from 'app/rncp-titles/RncpTitle.model';
import { Title } from '@angular/platform-browser';
import { SubSink } from 'subsink';
import { StudentsService } from 'app/service/students/students.service';
import { UntypedFormControl, FormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as _ from 'lodash'
import { School } from 'app/school/School.model';

@Component({
  selector: 'ms-transfer-student-resignation-dialog',
  templateUrl: './transfer-student-resignation-dialog.component.html',
  styleUrls: ['./transfer-student-resignation-dialog.component.scss']
})
export class TransferStudentResignationDialogComponent implements OnInit {
  subs = new SubSink()

  inputSchool = new UntypedFormControl(null, Validators.required);
  inputTitle = new UntypedFormControl(null, Validators.required);
  inputClass = new UntypedFormControl(null, Validators.required);
  inputReason = new UntypedFormControl(null, Validators.required);
  transferStudentForm: UntypedFormGroup;

  titleList = [];
  classList = [];
  schoolList = [];

  filteredTitle: Observable<Title[]>;
  filteredClass: Observable<ClassIdAndName[]>;
  filteredSchool: Observable<School[]>;

  isWaitingForResponse = false;

  isDetailSame: boolean = false;

  constructor(
    private dialog: MatDialogRef<TransferStudentResignationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public studentData: any,
    private fb: FormBuilder,
    private studentsService: StudentsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getTitleDropdownList();
    console.log(this.studentData);
    
  }

  initForm() {
    this.transferStudentForm = this.fb.group({
      school_id: [null, Validators.required],
      rncp_title_id: [null, Validators.required],
      class_id: [null, Validators.required],
    });
  }

  getTitleDropdownList() {
    this.subs.sink = this.studentsService?.getAllTitles().subscribe((resp) => {
      this.titleList = _.sortBy(resp, 'short_name');

      this.filteredTitle = this.inputTitle.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          searchTxt = searchTxt ? searchTxt : '';
          return this.titleList.filter((ttl) => ttl.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))
        }),
      );
    })
  }
  
  getClassDropdownList() {
    this.isWaitingForResponse = true;
    const rncpTitleId = this.transferStudentForm?.get('rncp_title_id')?.value;
    this.subs.sink = this.studentsService.getAllClasses(rncpTitleId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.classList = _.sortBy(resp, 'name');
      
      this.filteredClass = this.inputClass.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          searchTxt = searchTxt ? searchTxt : '';
          return this.classList.filter((cls) => cls.name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))
        }),
      );
    })
  }

  getSchoolDropdownList() {
    this.isWaitingForResponse = true;
    const rncpTitleId = this.transferStudentForm?.get('rncp_title_id')?.value;
    const classId = this.transferStudentForm?.get('class_id')?.value;
    let rncpTitleIds = []
    rncpTitleIds.push(rncpTitleId)
    this.subs.sink = this.studentsService.getAllSchools(rncpTitleIds, classId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.schoolList = _.sortBy(resp, 'short_name');
      console.log(this.schoolList);
      
      
      this.filteredSchool = this.inputSchool.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          searchTxt = searchTxt ? searchTxt : '';
          return this.schoolList.filter((sch) => sch.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))
        }),
      );
    })
  }

  setSchoolDestination(schoolId) {
    this.transferStudentForm?.get('school_id')?.setValue(schoolId);
    if(
      this.transferStudentForm?.get('rncp_title_id')?.value === this.studentData?.rncp_title?._id &&
      this.transferStudentForm?.get('class_id')?.value === this.studentData?.current_class?._id &&
      this.transferStudentForm?.get('school_id')?.value === this.studentData?.school?._id
    ) {
      this.isDetailSame = true
    } else {
      this.isDetailSame = false
    }
  }

  setClassDestination(classId) {
    this.schoolList = [];
    this.inputSchool?.setValue(null);
    this.transferStudentForm?.get('class_id')?.setValue(classId);
    this.getSchoolDropdownList();
  }

  setTitleDestination(titleId) {
    this.classList = [];
    this.schoolList = [];
    this.inputSchool?.setValue(null);
    this.inputClass?.setValue(null);
    this.transferStudentForm?.get('rncp_title_id')?.setValue(titleId);
    this.getClassDropdownList();
  }

  enterDialog() {
    this.isWaitingForResponse = true
    
    // declare the payload
    const payload = this.createPayload(this.studentData?.transfer_from)
    console.log(payload);
    

    // call the mutation for transferStudent
    this.subs.sink = this.studentsService?.transferStudentResignation(payload).subscribe(() => {
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

  createPayload(transferFrom) {
    let payload
    if(transferFrom === 'ResignationStud_S1') {
      payload = {
        reason : this.inputReason.value,
        studentId : this.studentData._id,
        titleId : this.transferStudentForm?.get('rncp_title_id')?.value,
        classId : this.transferStudentForm?.get('class_id')?.value,
        schoolId : this.transferStudentForm?.get('school_id')?.value,
        isTransferWithResign : null,
        isTransferWithoutResign : true
      }
    } else if(transferFrom === 'ResignationStud_S4') {
      payload = {
        reason : this.inputReason.value,
        studentId : this.studentData._id,
        titleId : this.transferStudentForm?.get('rncp_title_id')?.value,
        classId : this.transferStudentForm?.get('class_id')?.value,
        schoolId : this.transferStudentForm?.get('school_id')?.value,
        isTransferWithResign : true,
        isTransferWithoutResign : null
      }
    } else if (transferFrom === 'ResignationStud_S3'){
      payload = {
        reason : this.inputReason.value,
        studentId : this.studentData._id,
        titleId : this.transferStudentForm?.get('rncp_title_id')?.value,
        classId : this.transferStudentForm?.get('class_id')?.value,
        schoolId : this.transferStudentForm?.get('school_id')?.value,
        isTransferWithResign : true,
        isTransferWithoutResign : null
      }
    }
    return payload
  }

  closeDialog() {
    this.dialog.close();
  }

  onCheckTitle() {
    const titleValue = this.inputTitle.value
    if(!titleValue) {
      this.inputSchool.setValue(null);
      this.inputClass.setValue(null);
      this.classList = [];
      this.schoolList = [];
    }
  }

  onCheckClass() {
    const classValue = this.inputClass.value
    if(!classValue) {
      this.inputSchool.setValue(null);
      this.schoolList = [];
    }
  }

}
