import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AcademicKitService } from '../../../service/rncpTitles/academickit.service';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { AuthService } from 'app/service/auth-service/auth.service';
import { DateAdapter } from '@angular/material/core';
import * as moment from 'moment';

@Component({
  selector: 'ms-add-calendar-event-dialog',
  templateUrl: './add-calendar-event-dialog.component.html',
  styleUrls: ['./add-calendar-event-dialog.component.scss'],
})
export class AddCalendarEventDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  calendarEventForm: UntypedFormGroup;
  eventId: '';
  from_date = new UntypedFormControl(new Date());
  to_date = new UntypedFormControl(new Date());
  userTypesList = [];
  schools = [];
  classList = [];
  userData = [];
  schoolList = [];
  idSchoolList = [];
  from_date_value: any;
  isWaitingForResponse = false;
  isSubmitDisable = false;

  selectedTitleId;
  selectedClassId;

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public translate: TranslateService,
    private acadservice: AcademicKitService,
    public dialogRef: MatDialogRef<AddCalendarEventDialogComponent>,
    private authService: AuthService,
    private dateAdapter: DateAdapter<Date>,
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    if (this.data && this.data.rncpId) {
      this.selectedTitleId = this.data.rncpId;
    }
    if (this.data && this.data.classId) {
      this.selectedClassId = this.data.classId;
    }

    this.addEvent();
    // if (this.data && this.data.rncpId) {
      this.getThisRncpClasses();
    // }
    this.getThisRncpSchools();
    this.getAllUserTypes();


    // For Edit
    if (this.data && this.data.data) {

      if (this.data.data.class_id && this.data.data.class_id.length) {
        // this.data.data.class_id = this.data.data.class_id
        const temp = [];
        this.data.data.class_id.forEach(classes => {
          if (classes._id) {
            temp.push(classes._id)
          }
        })
        this.data.data.class_id = temp;
      }
      if (this.data.data._id) {
        this.eventId = this.data.data._id;
      }
      if (this.data.data.schools && this.data.data.schools.length) {
        const temp = [];
        this.data.data.schools.forEach(school => {
          if (school._id) {
            temp.push(school._id)
          }
        })
        this.data.data.schools = temp;
      }
      if (this.data.data.from_date) {
        this.data.data.from_date = new Date(this.data.data.from_date)
      }
      if (this.data.data.to_date) {
        this.data.data.to_date = new Date(this.data.data.to_date)
      }
      this.calendarEventForm.patchValue(this.data.data);

    }

  }

  patchToDate() {
    if(!this.calendarEventForm.get('to_date').value) {
      this.calendarEventForm.get('to_date').patchValue(this.calendarEventForm.get('from_date').value);
    }

  }

  getThisRncpClasses() {
    this.subs.sink = this.acadservice.getClassDropDownList(this.data.rncpId).subscribe(response => {

      if (response) {
        this.classList = response;
      }
    })
  }

  getThisRncpSchools() {
    this.subs.sink = this.acadservice.getSchoolDropDownListByClass(this.selectedTitleId, this.selectedClassId).subscribe((data) => {
      this.schools = data;

    });
  }

  getAllUserTypes() {
    this.subs.sink = this.acadservice.getAllUserTypes().subscribe((data) => {
      this.userTypesList = data;

    });
  }

  addEvent() {
    this.calendarEventForm = this.fb.group({
      name: ['', Validators.required],
      from_date: [null, Validators.required],
      to_date: [null, Validators.required],
      schools: [[]],
      user_types: [[], Validators.required],
      is_all_school: [false],
      rncp_title: [this.data.rncpId],
      class_id: [this.data.classId],
      created_by: [this.authService.getLocalStorageUser()._id]
    });
  }

  isAllSchool() {
    this.idSchoolList = [];

    if (this.calendarEventForm.get('is_all_school').value) {
      this.schools.forEach(element => {
        this.idSchoolList.push(element._id);
      });
      this.calendarEventForm.get('schools').setValue(this.idSchoolList);
    } else {
      this.calendarEventForm.get('schools').setValue([]);
      this.idSchoolList = [];
    }
    this.getEvent('event');

  }
  saveForm() {
    this.isWaitingForResponse = true;
    if (this.data.type === 'add') {
      this.subs.sink = this.acadservice.createEvent(this.calendarEventForm.value).subscribe((data_res) => {

        if (data_res) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('EVENT_S1.TEXT'),
            footer: `<span style="margin-left: auto">EVENT_S1</span>`,
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            allowOutsideClick: false,
          })
          .then(() => {

            this.isWaitingForResponse = false;
            this.dialogRef.close({
              respData: data_res,
            });
          });
        }
      });
    } else {
      this.subs.sink = this.acadservice.updateEvent(this.eventId, this.calendarEventForm.value).subscribe((data_res) => {

        if (data_res) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('EVENT_S1.TEXT'),
            footer: `<span style="margin-left: auto">EVENT_S1</span>`,
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            allowOutsideClick: false,
          })
          .then(() => {

            this.isWaitingForResponse = false;
            this.dialogRef.close({
              respData: data_res,
            });
          });
        }
      });
    }
  }
  getEvent(event) {
    const schoolData = this.calendarEventForm.get('schools').value;
    const classData = this.calendarEventForm.get('class_id').value;
    const user_types = this.calendarEventForm.get('class_id').value;
    if (schoolData && schoolData.length < 1 && !this.calendarEventForm.get('is_all_school').value) {
      this.isSubmitDisable = true;
    } else if (classData && classData.length < 1) {
      this.isSubmitDisable = true;
    } else if (user_types && user_types.length < 1) {
      this.isSubmitDisable = true;
    } else {
      this.isSubmitDisable = false;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  // processValue(rawValue: any, isAllSchool: Boolean) {
  //   const from_date = rawValue.from_date.toISOString();
  //   const to_date = rawValue.to_date.toISOString();
  //   const schoolsID = [];
  //   if (!isAllSchool) {
  //     rawValue.schools.forEach((schoolID) => {
  //       schoolsID.push(schoolID._id);
  //     });
  //   } else {

  //     this.schools.forEach((school) => {
  //       schoolsID.push(school._id);
  //     });
  //   }

  //   const userTypesID = [];
  //   rawValue.user_types.forEach((userTypeID) => {
  //     userTypesID.push(userTypeID._id);
  //   });

  //   const data = {
  //     name: rawValue.name,
  //     from_date: from_date,
  //     to_date: to_date,
  //     schools: schoolsID,
  //     user_types: userTypesID,
  //     is_all_school: this.showSchool,
  //   };

  //   return data;
  // }
}
