import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormControl, UntypedFormBuilder, UntypedFormArray, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SchoolService } from '../../service/schools/school.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'ms-add-rncp-dialog',
  templateUrl: './add-rncp-dialog.component.html',
  styleUrls: ['./add-rncp-dialog.component.scss'],
})
export class AddRncpDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  form: UntypedFormGroup;
  specializations: UntypedFormArray;
  showDetail = false;
  editRNCP: boolean = false;
  dirName = '';
  filteredSchools: Observable<string[]>;
  schoolsArray: any[] = [];
  isWaitingForResponse = false;
  rncpLevel = [
    { value: 'I', viewValue: '1' },
    { value: 'II', viewValue: '2' },
    { value: 'III', viewValue: '3' },
    { value: 'IV', viewValue: '4' },
    { value: 'V', viewValue: '5' },
    { value: 'VI', viewValue: '6' },
    { value: 'VII', viewValue: '7' },
  ];

  dirInCharge = [
    { first_name: 'Mr. Dominique HUNIN', _id: '5d8dda35a86fa056b8994ca8' },
    { first_name: 'Mrs. Corinne CRESPIN', _id: '5d8dda35a86fa056b8994ca8' },
  ];

  countryList = [
    { id: '1', countryName: 'France' },
    { id: '2', countryName: 'Afghanistan' },
    { id: '3', countryName: 'South Africa' },
    { id: '4', countryName: 'Albanie' },
    { id: '5', countryName: 'Algeria' },
    { id: '6', countryName: 'Germany' },
    { id: '7', countryName: 'Angola' },
    { id: '8', countryName: 'Anguilla' },
    { id: '9', countryName: 'Antarctique' },
    { id: '10', countryName: 'Antigua and Barbuda' },
    { id: '11', countryName: 'Netherlands Antilles' },
    { id: '12', countryName: 'Saudi Arabia' },
    { id: '13', countryName: 'Argentina' },
    { id: '14', countryName: 'Armenia' },
    { id: '15', countryName: 'Aruba' },
  ];
  private intVal: any;
  private timeOutVal: any;

  constructor(
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private schoolService: SchoolService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dateAdapter: DateAdapter<Date>,
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    if (this.data) {
      this.editRNCP = true;
    }
    this.dirName = this.dirInCharge[1]._id;
    this.getAllAdmtcUsers();
    this.form = this.fb.group({
      short_name: new UntypedFormControl(this.data ? this.data[0].short_name : '', [Validators.required]),
      long_name: new UntypedFormControl(this.data ? this.data[0].long_name : '', [Validators.required]),
      rncp_code: new UntypedFormControl(this.data ? this.data[0].rncp_code : '', [Validators.maxLength(5), Validators.pattern('^[0-9]{5}')]),
      rncp_level: new UntypedFormControl(this.data ? this.data[0].rncp_level : '', [Validators.required]),
      journal_text: new UntypedFormControl(this.data ? this.data[0].journal_text : '', [Validators.required]),
      journal_date: new UntypedFormControl(this.data ? this.getDate(this.data[0].journal_date) : '', [Validators.required]),
      admtc_dir_responsible: new UntypedFormControl(this.data ? this.data[0].admtc_dir_responsible : '', [Validators.required]),
      specializations:
        this.data && Array.isArray(this.data[0].specializations) && this.data[0].specializations.length > 0
          ? this.fb.array(this.buildSpecialzationsWithPredefinedSpecialzations(this.data[0].specializations))
          : this.fb.array([]),
      add_school: this.fb.group({
        short_name: new UntypedFormControl('', [Validators.required]),
        long_name: new UntypedFormControl('', [Validators.required]),
        country: new UntypedFormControl('', [Validators.required]),
        school_address: this.fb.group({
          address1: new UntypedFormControl('', [Validators.required]),
          address2: new UntypedFormControl('', [Validators.required]),
          postal_code: new UntypedFormControl('', [Validators.maxLength(5), Validators.pattern('^[0-9]{5}')]),
          city: new UntypedFormControl('', [Validators.required]),
        }),
        school_siret: new UntypedFormControl('', [Validators.required]),
      }),
    });
    this.specializations = this.form.get('specializations') as UntypedFormArray;
    this.getSchools();
  }
  private _filterSchool(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schoolsArray.filter((option) => option.toLowerCase().includes(filterValue));
  }
  getDate(date: any) {
    if (date) {
      const len = date.length;
      const str1 = date.substr(0, len - 4);
      const str2 = date.substr(len - 4, 2);
      const str3 = date.substr(len - 2, 2);
      const d = str1 + '-' + str2 + '-' + str3;
      const newDate = new Date(d).toISOString();
      return newDate;
    }
  }

  /*
   * Get all users of ADMTC admin
   * */
  getAllAdmtcUsers() {
    /*  this.usersService.getAllUser().subscribe(user => {
    }); */
  }

  getSchools() {
    this.subs.sink = this.schoolService.getSchoolShortNames().subscribe((schools: any[]) => {
      schools.forEach((el) => {
        this.schoolsArray.push(el.short_name);
      });
      this.filteredSchools = this.form.controls['short_name'].valueChanges.pipe(
        startWith(''),
        map((value) => this._filterSchool(value)),
      );
    });
  }

  buildSpecialzationsWithPredefinedSpecialzations(specializations) {
    let specs = [];
    for (let spec of specializations) {
      specs.push(
        this.fb.group({
          name: new UntypedFormControl(spec.name),
          is_specialization_assigned: spec.is_specialization_assigned,
        }),
      );
    }
    return specs;
  }

  buildSpecialization(specName?: string) {
    return new UntypedFormGroup({
      name: new UntypedFormControl(specName ? specName : ''),
      is_specialization_assigned: new UntypedFormControl(specName ? true : false),
    });
  }

  addSpecialization(spec) {
    if (spec.value) {
      this.specializations = this.form.get('specializations') as UntypedFormArray;
      this.specializations.push(this.buildSpecialization(spec.value));
      spec.value = '';
    }
  }

  removeSpecialization(i) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete specialization !'),
      type: 'warning',
      allowEscapeKey: false,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        this.specializations = this.form.get('specializations') as UntypedFormArray;
        this.specializations.removeAt(i);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('specialization deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  toTimestamp(strDate) {
    var datum = Date.parse(strDate);
    return datum / 1000;
  }

  save(formValue) {
    this.isWaitingForResponse = true;
    if (this.editRNCP) {
      delete formValue.short_name;
      delete formValue.long_name;
      delete formValue.rncp_code;
      delete formValue.rncp_level;
      delete formValue.add_school;
      this.subs.sink = this.schoolService.updateTitle(this.data[1]._id, formValue).subscribe((data: any) => {
        this.isWaitingForResponse = false;
        swal
          .fire({
            title: this.translate.instant('RNCP.SUCCESS'),
            text: this.translate.instant('RNCP.RNCP_EDITED'),
            allowEscapeKey: false,
            type: 'success',
          })
          .then(function () {});
      });
    } else {
      this.subs.sink = this.schoolService.createTitle(formValue).subscribe((data: any) => {
        this.isWaitingForResponse = false;
        swal
          .fire({
            title: this.translate.instant('RNCP.SUCCESS'),
            text: this.translate.instant('RNCP.RNCP_ADDED'),
            allowEscapeKey: true,
            type: 'success',
          })
          .then(function () {});
      });
    }
  }

  addSchool() {
    this.showDetail = true;
  }

  removeSchool() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete school !'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.showDetail = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('school deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
