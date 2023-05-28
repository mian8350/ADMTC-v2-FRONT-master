import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ClassIdAndName } from 'app/rncp-titles/RncpTitle.model';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

interface School {
  _id: string,
  short_name: string
}
interface Title {
  _id: string,
  short_name: string
}

interface Student {
  _id: string
  first_name: string
  last_name: string
}

interface StudentTableData {
  schoolList: School[]
}

@Component({
  selector: 'ms-transfer-student-dialog',
  templateUrl: './transfer-student-dialog.component.html',
  styleUrls: ['./transfer-student-dialog.component.scss']
})
export class TransferStudentDialogComponent implements OnInit {
  private subs = new SubSink();
  isWaitingForResponse = false;
  transferStudentForm: UntypedFormGroup;

  schoolOriginCtrl = new UntypedFormControl(null);
  schoolOriginList: School[] = []
  filteredSchoolOrigin: Observable<School[]>;

  titleCtrl = new UntypedFormControl(null);
  titleList: Title[] = []
  filteredTitle: Observable<Title[]>;

  classCtrl = new UntypedFormControl(null);
  classList: ClassIdAndName[] = []
  filteredClass: Observable<ClassIdAndName[]>;

  studentCtrl = new UntypedFormControl(null);
  studentList: Student[] = []
  filteredStudent: Observable<Student[]>;

  schoolDestinationCtrl = new UntypedFormControl(null);
  schoolDestinationList: School[] = []
  filteredSchoolDestination: Observable<School[]>;

  constructor(
    public dialogRef: MatDialogRef<TransferStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: StudentTableData,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private acadkitService: AcademicKitService,
    private rncpTitleService: RNCPTitlesService,
    private studentService: StudentsService
  ) { }

  ngOnInit() {
    this.initTransferStudentForm();
    this.getSchoolOriginDropdown();
  }

  initTransferStudentForm() {
    this.transferStudentForm = this.fb.group({
      school_origin_id: [null],
      title_id: [null],
      class_id: [null],
      student_id: [null, Validators.required],
      school_id: [null, Validators.required],
    })
  }

  getSchoolOriginDropdown() {
    this.schoolOriginList = this.parentData.schoolList && this.parentData.schoolList.length ? this.parentData.schoolList : [];

    // sorting when the data are uppercase and lowercase
    const sorted = this.schoolOriginList.sort((a, b) => {
      const aTranslated = this.translate.instant(a.short_name.toLowerCase());
      const bTranslated = this.translate.instant(b.short_name.toLowerCase());

      if (aTranslated < bTranslated) {
        return -1;
      }

      if (aTranslated > bTranslated) {
        return 1;
      }

      return 0;
    });
    this.schoolOriginList = sorted
    // this.schoolOriginList = _.sortBy(this.schoolOriginList, 'short_name')
    this.filteredSchoolOrigin = this.schoolOriginCtrl.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => {
        searchTxt = searchTxt ? searchTxt : '';
        return this.schoolOriginList.filter((sch) => sch.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))
      }),
    );
  }

  getTitleDropdown(schoolId: string) {
    this.transferStudentForm.get('school_origin_id').setValue(schoolId);
    this.rncpTitleService.GetAllTitleDropdownListBySchool(schoolId).subscribe(resp => {
      this.titleList = resp;

      // sorting when the data are uppercase and lowercase
      const sorted = this.titleList.sort((a, b) => {
        const aTranslated = this.translate.instant(a.short_name.toLowerCase());
        const bTranslated = this.translate.instant(b.short_name.toLowerCase());

        if (aTranslated < bTranslated) {
          return -1;
        }

        if (aTranslated > bTranslated) {
          return 1;
        }

        return 0;
      });
      this.titleList = sorted
      // this.titleList = _.sortBy(this.titleList, 'short_name')
      this.filteredTitle = this.titleCtrl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          searchTxt = searchTxt ? searchTxt : '';
          return this.titleList.filter((ttl) => ttl.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))
        }),
      );
    })

    this.titleCtrl.setValue(null);
    this.classCtrl.setValue(null);
    this.studentCtrl.setValue(null);
    this.schoolDestinationCtrl.setValue(null);
    this.transferStudentForm.get('title_id').setValue(null);
    this.transferStudentForm.get('class_id').setValue(null);
    this.transferStudentForm.get('student_id').setValue(null);
    this.transferStudentForm.get('school_id').setValue(null);
  }

  getClassDropdown(titleId: string) {
    this.transferStudentForm.get('title_id').setValue(titleId);
    this.rncpTitleService.getClassesByTitle(titleId).subscribe(resp => {
      this.classList = resp;

      // sorting when the data are uppercase and lowercase
      const sorted = this.classList.sort((a, b) => {
        const aTranslated = this.translate.instant(a.name.toLowerCase());
        const bTranslated = this.translate.instant(b.name.toLowerCase());
  
        if (aTranslated < bTranslated) {
          return -1;
        }
  
        if (aTranslated > bTranslated) {
          return 1;
        }
  
        return 0;
      });
      this.classList = sorted
      
      // this.classList = _.sortBy(this.classList, 'name')
      this.filteredClass = this.classCtrl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          searchTxt = searchTxt ? searchTxt : '';
          return this.classList.filter((cls) => cls.name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))
        }),
      );
    })

    this.classCtrl.setValue(null);
    this.studentCtrl.setValue(null);
    this.schoolDestinationCtrl.setValue(null);
    this.transferStudentForm.get('class_id').setValue(null);
    this.transferStudentForm.get('student_id').setValue(null);
    this.transferStudentForm.get('school_id').setValue(null);
  }

  getStudentDropdown(classId: string) {
    this.transferStudentForm.get('class_id').setValue(classId);
    const schoolId = this.transferStudentForm.get('school_origin_id').value;
    const titleId = this.transferStudentForm.get('title_id').value;
    if (schoolId && titleId && classId) {
      this.studentService.getStudentDropdownBySchoolTitleClass(schoolId, titleId, classId).subscribe(resp => {
        this.studentList = resp;

        // sorting when the data are uppercase and lowercase
        const sorted = this.studentList.sort((a, b) => {
          const aTranslated = this.translate.instant(a.last_name.toLowerCase());
          const bTranslated = this.translate.instant(b.last_name.toLowerCase());
    
          if (aTranslated < bTranslated) {
            return -1;
          }
    
          if (aTranslated > bTranslated) {
            return 1;
          }
    
          return 0;
        });
        this.studentList = sorted

        // this.studentList = _.sortBy(this.studentList, 'last_name')
        this.filteredStudent = this.studentCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            return this.studentList.filter((stud) => {
              const fullName = stud.last_name + ' ' + stud.first_name;
              searchTxt = searchTxt ? searchTxt : '';
              return fullName.toLowerCase().trim().includes(searchTxt.toLowerCase().trim());
            })
          }),
        );
      })

      this.studentCtrl.setValue(null);
      this.schoolDestinationCtrl.setValue(null);
      this.transferStudentForm.get('student_id').setValue(null);
      this.transferStudentForm.get('school_id').setValue(null);
    }
  }

  getSchoolDestinationDropdown(studentId: string) {
    this.transferStudentForm.get('student_id').setValue(studentId);
    const titleId = this.transferStudentForm.get('title_id').value;
    if (titleId) {
      this.acadkitService.getSchoolDropDownList(titleId).subscribe(resp => {
      this.schoolDestinationList = resp;

      // sorting when the data are uppercase and lowercase
      const sorted = this.schoolDestinationList.sort((a, b) => {
        const aTranslated = this.translate.instant(a.short_name.toLowerCase());
        const bTranslated = this.translate.instant(b.short_name.toLowerCase());
  
        if (aTranslated < bTranslated) {
          return -1;
        }
  
        if (aTranslated > bTranslated) {
          return 1;
        }
  
        return 0;
      });
      this.schoolDestinationList = sorted


      // this.schoolDestinationList = _.sortBy(this.schoolDestinationList, 'short_name')
      this.filteredSchoolDestination = this.schoolDestinationCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.schoolDestinationList.filter((sch) => sch.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))
          }),
        );
      })
    }
  }

  setSchoolDestination(schoolId: string) {
    this.transferStudentForm.get('school_id').setValue(schoolId);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  transferStudent() {
    const studentId = this.transferStudentForm.get('student_id').value;
    const schoolId = this.transferStudentForm.get('school_id').value;

    this.isWaitingForResponse = true;
    this.studentService.transferStudentToDifferentSchoolSameTitle(studentId, schoolId, this.translate.currentLang).subscribe(resp => {
      this.isWaitingForResponse = false;
      if (resp && resp.data && resp.data.TransferStudentToDifferentSchool) {
        Swal.fire({
          type: 'success',
          title: 'Bravo!',
          allowOutsideClick: false
        }).then(result => {
          if (result.value) {
            this.dialogRef.close(true);
          }
        })
      } else if (resp.errors && resp.errors[0] && resp.errors[0].message) {
        let errorMessage = resp.errors[0].message;
        if (resp.errors[0].message === 'Final Transcript Process Started For This Student') {
          errorMessage = this.translate.instant('final_transcript_started_err');
        }
        Swal.fire({
          type: 'error',
          title: errorMessage
        })
      }
    })
  }

}
