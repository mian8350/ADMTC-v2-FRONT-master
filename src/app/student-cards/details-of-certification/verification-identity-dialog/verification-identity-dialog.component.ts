import { DatePipe } from '@angular/common';
import { Component, OnInit, Output, Input, EventEmitter, OnDestroy, Inject } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { CustomValidators } from 'ng2-validation';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import * as moment from 'moment';

@Component({
  selector: 'ms-verification-identity-dialog',
  templateUrl: './verification-identity-dialog.component.html',
  styleUrls: ['./verification-identity-dialog.component.scss'],
  providers: [ParseStringDatePipe],
})
export class VerifcationIdentityDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  identityForm: UntypedFormGroup;
  today: Date;
  studentId: any;
  studentData: any;
  dataPass: any;
  indexTab: any;
  isMainAddressSelected = false;

  nationalitiesList = [];
  nationalList = [];
  nationalitySelected: string;

  countries;
  countryList;
  filteredCountry: any[][] = [];

  cities: string[][] = [];
  filteredCities: string[][] = [];

  departments: string[][] = [];
  filteredDepartments: string[][] = [];

  regions: string[][] = [];
  filteredRegions: string[][] = [];

  private intVal: any;
  private timeOutVal: any;

  constructor(
    public dialogRef: MatDialogRef<VerifcationIdentityDialogComponent>,
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private rncpTitleService: RNCPTitlesService,
    public utilService: UtilityService,
    public translate: TranslateService,
    private parseStringDatePipe: ParseStringDatePipe,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private schoolService: SchoolService,
    private acadJourneyService: AcademicJourneyService,
  ) {}

  ngOnInit() {
    this.resetData();
    this.today = new Date();

    this.indexTab = this.data.indexTab;
    this.dataPass = this.data.studentData;
    this.subs.sink = this.schoolService.getCountry().subscribe((list: any[]) => {
      this.countries = list;
      this.countryList = list;
    });
    this.nationalitiesList = this.studentService.getNationalitiesList();
    this.iniVerificationForm();
    this.getIdentityData();
  }

  iniVerificationForm() {
    this.identityForm = this.fb.group({
      civility: [null, Validators.required],
      first_name: [null, Validators.required],
      last_name: [null, Validators.required],
      tele_phone: [null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(10)]],
      date_of_birth: [null, Validators.required],
      place_of_birth: [null, Validators.required],
      nationality: [null, Validators.required],
      student_address: this.fb.array([this.initStudentAddressForm()]),
    });
  }

  getIdentityData() {
    this.subs.sink = this.studentService.getStudentsIdentityData(this.dataPass._id).subscribe((response) => {
      this.studentData = _.cloneDeep(response);
      this.studentId = this.studentData._id;
      const res = _.cloneDeep(response);
      if (res) {
        if (res.student_address && res.student_address.length) {
          res.student_address.forEach((address, index) => {
            if (address && address.is_main_address) {
              this.isMainAddressSelected = true;
            }
            if (address.postal_code && address.country && address.country.toLowerCase() === 'france') {
              this.subs.sink = this.rncpTitleService.getFilteredZipCode(address.postal_code, address.country).subscribe((addresData) => {
                this.setAddressDropdown(addresData, index);
              });
            }
            if (index >= 1) {
              this.addStudentAddressForm();
            }
          });
        }
        if (res.date_of_birth) {
          res.date_of_birth = this.parseStringDatePipe.transform(res.date_of_birth);
        }
        this.identityForm.patchValue(res);
      }
    });
  }

  get studentAddressFormArray() {
    return this.identityForm.get('student_address') as UntypedFormArray;
  }

  checkMainAddress(event: MatSlideToggleChange) {
    if (event && event.checked) {
      this.isMainAddressSelected = true;
    } else {
      this.isMainAddressSelected = false;
    }
  }

  resetData() {
    this.isMainAddressSelected = false;
    this.countries = [];
    this.filteredCountry = [];
    this.cities = [];
    this.filteredCities = [];
    this.departments = [];
    this.filteredDepartments = [];
    this.regions = [];
    this.filteredRegions = [];
    this.nationalitiesList = [];
  }

  addStudentAddressForm() {
    this.studentAddressFormArray.push(this.initStudentAddressForm());
    this.filteredCountry.push(this.countries);
    this.cities.push([]);
    this.regions.push([]);
    this.departments.push([]);
  }

  initStudentAddressForm(): UntypedFormGroup {
    return this.fb.group({
      address: [null, Validators.required],
      postal_code: [null, Validators.required],
      country: ['France', Validators.required],
      city: [null, Validators.required],
      region: [null, Validators.required],
      department: [null, Validators.required],
      is_main_address: [false, Validators.required],
    });
  }

  removeStudentAddressForm(addressIndex: number) {
    const emptyParentForm = JSON.stringify(this.initStudentAddressForm().value);
    const selectedParentForm = JSON.stringify(this.studentAddressFormArray.at(addressIndex).value);
    if (emptyParentForm !== selectedParentForm) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DELETE_STUDENT_ADDRESS'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
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
          this.studentAddressFormArray.removeAt(addressIndex);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('CARDDETAIL.address deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            footer: `<span style="margin-left: auto">EVENT_S1</span>`,
          });
        }
      });
    } else {
      this.studentAddressFormArray.removeAt(addressIndex);
      this.filteredCountry.splice(addressIndex, 1);
      this.cities.splice(addressIndex, 1);
      this.filteredCities.splice(addressIndex, 1);
      this.regions.splice(addressIndex, 1);
      this.filteredRegions.splice(addressIndex, 1);
      this.departments.splice(addressIndex, 1);
      this.filteredDepartments.splice(addressIndex, 1);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('CARDDETAIL.address deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  submitVerification() {
    const temp = this.identityForm.value;
    // validation for main address
    const lang = this.translate.currentLang.toLowerCase();
    if (temp && temp.student_address && temp.student_address.length === 1) {
      this.studentAddressFormArray.at(0).get('is_main_address').setValue(true);
      temp.student_address[0].is_main_address = true;
    }
    if (temp && temp.tele_phone && typeof temp.tele_phone === 'number') {
      this.identityForm.get('tele_phone').patchValue(temp.tele_phone.toString());
      temp.tele_phone = temp.tele_phone.toString();
    }
    if (temp && temp.date_of_birth) {
      temp.date_of_birth = moment(temp.date_of_birth).format('YYYY-MM-DD');
    }

    if (this.identityForm.valid) {
      this.subs.sink = this.schoolService.updateStudent(this.studentId, temp, lang).subscribe((resp) => {
        if (resp) {
          if (this.studentData.academic_journey_id && this.studentData.academic_journey_id._id) {
            this.createPayloadForAcademicJourney(temp);
          } else {
            this.studentService.updateStudentCard(true);
            this.studentService.updateStudentCardPosition(this.indexTab);
            this.closeDialog();
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
            });
          }
        }
      },
      (err) => {
        this.closeDialog();

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
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        }
      },
    );
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error !',
      }).then((res) => {
        this.identityForm.markAllAsTouched();

      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  filterNationality() {
    const searchString = this.identityForm.get('nationality').value.toLowerCase().trim();
    this.nationalList = this.nationalitiesList.filter((nationalities) =>
      nationalities.countryName.toLowerCase().trim().includes(searchString),
    );
  }

  filterCountry(addressIndex: number) {
    const searchString = this.studentAddressFormArray.at(addressIndex).get('country').value.toLowerCase().trim();
    this.filteredCountry[addressIndex] = this.countries.filter((country) => country.name.toLowerCase().trim().includes(searchString));
  }

  filterCity(addressIndex: number) {
    if (this.cities[addressIndex] && this.cities[addressIndex].length) {
      const searchString = this.studentAddressFormArray.at(addressIndex).get('city').value.toLowerCase().trim();
      this.filteredCities[addressIndex] = this.cities[addressIndex].filter((city) => city.toLowerCase().trim().includes(searchString));
    }
  }

  filterDepartment(addressIndex: number) {
    if (this.departments[addressIndex] && this.departments[addressIndex].length) {
      const searchString = this.studentAddressFormArray.at(addressIndex).get('department').value.toLowerCase().trim();
      this.filteredDepartments[addressIndex] = this.departments[addressIndex].filter((department) =>
        department.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterRegion(addressIndex: number) {
    if (this.regions[addressIndex] && this.regions[addressIndex].length) {
      const searchString = this.studentAddressFormArray.at(addressIndex).get('region').value.toLowerCase().trim();
      this.filteredRegions[addressIndex] = this.regions[addressIndex].filter((region) =>
        region.toLowerCase().trim().includes(searchString),
      );
    }
  }

  getPostcodeData(addressIndex: number) {
    const country = this.studentAddressFormArray.at(addressIndex).get('country').value;
    const postCode = this.studentAddressFormArray.at(addressIndex).get('postal_code').value;

    if ((postCode && postCode.length > 3) && country.toLowerCase() === 'france') {
      this.subs.sink = this.rncpTitleService.getFilteredZipCode(postCode, country).subscribe((resp) => {
        if (resp && resp.length) {
          this.setAddressDropdown(resp, addressIndex);

          this.studentAddressFormArray.at(addressIndex).get('city').setValue(this.cities[addressIndex][0]);
          this.studentAddressFormArray.at(addressIndex).get('department').setValue(this.departments[addressIndex][0]);
          this.studentAddressFormArray.at(addressIndex).get('region').setValue(this.regions[addressIndex][0]);
        }
      });
    }
  }

  setAddressDropdown(resp: any, addressIndex: number) {
    const tempCities = [];
    const tempDepartments = [];
    const tempRegions = [];

    if (resp && resp.length) {
      resp.forEach((address) => {
        tempCities.push(address.city);
        tempDepartments.push(address.department);
        tempRegions.push(address.province);
      });

      this.cities[addressIndex] = _.uniq(tempCities);
      this.departments[addressIndex] = _.uniq(tempDepartments);
      this.regions[addressIndex] = _.uniq(tempRegions);

      this.filteredCities[addressIndex] = this.cities[addressIndex];
      this.filteredDepartments[addressIndex] = this.departments[addressIndex];
      this.filteredRegions[addressIndex] = this.regions[addressIndex];
    }
  }

  createPayloadForAcademicJourney(pay) {
    this.subs.sink = this.acadJourneyService.GetStudentDataProfileFirstTime(this.studentId).subscribe((resp) => {
      const temp = _.cloneDeep(resp);

      // *************** Start Do Formatting of the data
      if (temp && temp.student_address && temp.student_address.length) {
        temp.address = temp.student_address.find((address) => address.is_main_address);
        delete temp.student_address;
      }
      if (temp && temp.date_of_birth) {
        temp.date_of_birth = this.parseStringDatePipe.transform(temp.date_of_birth);
      }

      if (pay && pay.photo) {
        temp.photo = pay.photo;
      }
      const payload = {
        student_id: this.studentId,
        general_presentation: temp,
      };

      this.subs.sink = this.acadJourneyService
        .updateAcademicJourney(this.studentData.academic_journey_id._id, payload)
        .subscribe((respp) => {
          this.studentService.updateStudentCard(true);
          this.studentService.updateStudentCardPosition(this.indexTab);
          this.closeDialog();

          Swal.fire({
            type: 'success',
            title: 'Bravo !',
          });
        });
    });
  }

  displayNationality(country): string {

    if (this.translate && country) {
      const nationality = this.translate.instant('NATIONALITY.' + country);

      if (!nationality.includes('NATIONALITY')) {
        return nationality;
      } else {
        return country;
      }
    } else {
      return country;
    }
  }

  ngOnDestroy() {
    this.resetData();
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
