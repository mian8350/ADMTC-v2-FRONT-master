import { Component, OnInit, Inject, ViewChild, OnDestroy } from '@angular/core';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { SchoolService } from '../../service/schools/school.service';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'ms-add-school-dialog',
  templateUrl: './add-school-dialog.component.html',
  styleUrls: ['./add-school-dialog.component.scss'],
})
export class AddSchoolDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  rncpTitles: any[] = [];
  rncptitlesList = [];
  cerifierList = [];
  form: UntypedFormGroup;
  schools: any[] = [];
  filteredSchools: Observable<any[]>;
  editSchool: boolean = false;
  addTitle: boolean = false;
  isCertifier: boolean = false;
  isWaitingForResponse = false;
  levelRNCP = '';
  tempTitles = [];
  constructor(
    private rncpTitleService: RNCPTitlesService,
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService,
    private schoolService: SchoolService,
    private dialog: MatDialogRef<AddSchoolDialogComponent>,
  ) {}

  rncpLevel = [
    { value: 'I', viewValue: 'I' },
    { value: 'II', viewValue: 'II' },
    { value: 'III', viewValue: 'III' },
    { value: 'IV', viewValue: 'IV' },
    { value: 'V', viewValue: 'V' },
    { value: 'VI', viewValue: 'VI' },
    { value: 'VII', viewValue: 'VII' },
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

  dirInCharge = [
    { name: 'Mr. Dominique HUNIN', id: '5d8dda35a86fa056b8994ca8' },
    { name: 'Mrs. Corinne CRESPIN', id: '5d8dda35a86fa056b8994ca8' },
  ];
  titleCertifier = [];

  specializations = [{ name: 'All', is_specialization_assigned: true }];

  ngOnInit() {
    if (this.data) {
      this.data.certifier_ats.forEach(title => {
        let obj = {};
        obj['short_name'] = title.short_name;
        this.titleCertifier.push(obj);
        this.tempTitles.push(obj);
      });
    }

    this.subs.sink = this.rncpTitleService.getRncpTitles().subscribe((titles: any[]) => {
      this.rncpTitles = titles;
      if (this.data) {
        this.rncpTitles.forEach(el => {
          this.data.preparation_center_ats.forEach(element => {
            if (el._id === element._id) this.rncptitlesList.push(el);
          });
          this.data.certifier_ats.forEach(element => {
            if (el._id === element._id) this.rncptitlesList.push(el);
          });
        });
      }
    });
    this.subs.sink = this.schoolService.getSchoolShortNames().subscribe((schools: any[]) => {
      schools.forEach(el => {
        if (this.schools.indexOf(el.short_name) === -1) {
          this.schools.push(el.short_name);
        }
      });

      this.filteredSchools = this.form.controls['retake_center'].valueChanges.pipe(
        startWith(''),
        map(value => this._filterSchool(value)),
      );
    });
    this.editSchool = _.isEmpty(this.data) ? false : true;
    this.addEvent();
  }
  private _filterSchool(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schools.filter(option => option.toLowerCase().includes(filterValue));
  }

  addEvent() {
    this.form = new UntypedFormGroup({
      schoolType: new UntypedFormControl('prepCenter', [Validators.required]),
      short_name: new UntypedFormControl(this.data ? this.data.short_name : '', [Validators.required]),
      long_name: new UntypedFormControl(this.data ? this.data.long_name : '', [Validators.required]),
      school_address: this.fb.group({
        address1: new UntypedFormControl(this.data ? this.data.school_address.address1 : '', [Validators.required]),
        address2: new UntypedFormControl(this.data ? this.data.school_address.address2 : ''),
        postal_code: new UntypedFormControl(this.data ? this.data.school_address.postal_code : '', [
          Validators.maxLength(5),
          Validators.pattern('^[0-9]{5}'),
          Validators.required,
        ]),
        city: new UntypedFormControl(this.data ? this.data.school_address.city : '', [Validators.required]),
        region: new UntypedFormControl(this.data ? this.data.school_address.region : ''),
      }),
      retake_center: new UntypedFormControl(this.data ? this.data._id : '', [Validators.required]),
      country: new UntypedFormControl(this.data ? this.data.country : ''),
      school_siret: new UntypedFormControl(this.data ? this.data.school_siret : ''),
      add_rncp_titles: this.fb.group({
        rncp_code: new UntypedFormControl('', [Validators.maxLength(5), Validators.pattern('^[0-9]{5}'), Validators.required]),
        short_name: new UntypedFormControl('', [Validators.required]),
        long_name: new UntypedFormControl('', [Validators.required]),
        rncp_level: new UntypedFormControl('', [Validators.required]),
        admtc_dir_responsible: new UntypedFormControl(''),
      }),
      preparation_center_ats: new UntypedFormControl([], [Validators.required]),
      prepTitles: new UntypedFormControl(this.data ? (this.data.preparation_center_ats ? this.getTitle() : '') : '', [Validators.required]),
      selected_specializations: new UntypedFormControl(this.data ? this.specializations : []),
      titleCertifier: new UntypedFormControl(this.titleCertifier, [Validators.required]),
    });
  }

  getTitle() {
    let arr = [];
    this.data.preparation_center_ats.forEach(el => {
      arr.push(el._id);
    });
    return arr;
  }

  addSchool(bool) {
    if (bool) {
      this.addTitle = true;
    } else {
      this.addTitle = false;
    }
  }

  optionSelected(event) {
    if (event.value === 'cert') {
      this.isCertifier = true;
    } else {
      this.isCertifier = false;
    }
  }

  addTitleCertifier() {
    if (
      !(
        this.form.value.add_rncp_titles.rncp_code === '' ||
        this.form.value.add_rncp_titles.short_name === '' ||
        this.form.value.add_rncp_titles.long_name === '' ||
        this.form.value.add_rncp_titles.rncp_level === '' ||
        this.form.value.add_rncp_titles.rncp_level === undefined
      )
    ) {
      this.titleCertifier.push({
        short_name: this.form.value.add_rncp_titles.short_name,
        long_name: this.form.value.add_rncp_titles.long_name,
        rncp_code: this.form.value.add_rncp_titles.rncp_code,
        rncp_level: this.form.value.add_rncp_titles.rncp_level,
        admtc_dir_responsible: this.form.value.add_rncp_titles.admtc_dir_responsible.id,
      });
      this.addTitle = false;
    }
  }

  buildSpecialization(shortName?: string) {
    return new UntypedFormGroup({
      name: new UntypedFormControl(shortName ? shortName : ''),
    });
  }

  onSubmit() {
    this.form.value.preparation_center_ats = this.form.value.prepTitles;
    delete this.form.value.schoolType;
    delete this.form.value.titleCertifier;
    delete this.form.value.prepTitles;

    if (
      this.form.value.short_name === '' ||
      this.form.value.long_name === '' ||
      this.form.value.school_address.city === '' ||
      this.form.value.school_address.address1 === '' ||
      this.form.value.school_address.postal_code === ''
    ) {
      return false;
    }

    if (this.data) {
      if (this.form.value.preparation_center_ats.length < 1) {
        return false;
      }
      this.titleCertifier = this.titleCertifier.filter(n => !this.tempTitles.includes(n));
      this.form.value.add_rncp_titles = this.titleCertifier;
      this.isWaitingForResponse = true;
      this.subs.sink = this.schoolService.updateSchool(this.data._id, this.form.value).subscribe((data: any) => {
        this.isWaitingForResponse = false;
        this.dialog.close();
        swal.fire({
          type: 'success',
          title: this.translate.instant('SCHOOL.SUCCESS'),
          text: this.translate.instant('SCHOOL.UPDATEMSG', { shortName: this.data.short_name }),
          confirmButtonText: 'OK',
        });
      });
    } else {
      if (!this.isCertifier) {
        if (this.form.value.preparation_center_ats.length < 1) {
          return false;
        }
        delete this.form.value.add_rncp_titles;
      } else {
        this.form.value.preparation_center_ats = [];
        this.form.value.add_rncp_titles.admtc_dir_responsible = this.form.value.add_rncp_titles.admtc_dir_responsible.id;
      }
      this.isWaitingForResponse = true;
      this.subs.sink = this.schoolService.createSchool(this.form.value).subscribe((data: any) => {
        this.isWaitingForResponse = false;
        this.dialog.close();
        swal.fire({
          type: 'success',
          title: this.translate.instant('SCHOOL.SUCCESS'),
          text: this.translate.instant('SCHOOL.CREATEMSG', { shortName: data.short_name }),
          confirmButtonText: 'OK',
        });
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
