import { debounceTime } from 'rxjs/operators';
import { Component, OnInit, ViewChild, Input, Output, OnDestroy, OnChanges, EventEmitter } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray, FormControl, ValidationErrors } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { StudentsService } from 'app/service/students/students.service';
import { CustomValidators } from 'ng2-validation';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DateAdapter } from '@angular/material/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { ApplicationUrls } from 'app/shared/settings';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { Observable } from 'apollo-link';
import { Router } from '@angular/router';
import { UserService } from 'app/service/user/user.service';
import { UserProfileData } from 'app/users/user.model';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-create-identity-detail',
  templateUrl: './create-identity-detail.component.html',
  styleUrls: ['./create-identity-detail.component.scss'],
  providers: [ParseStringDatePipe],
})
export class CreateIdentityDetailComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() schoolId: string;
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Output() continue = new EventEmitter<boolean>();
  @Output() back = new EventEmitter<boolean>();

  isMainAddressSelected = false;
  next = false;
  lenghtAddress = 0;
  nothingMainAddress = false;
  isWaitingForResponse = false;
  nationalitiesList = [];
  nationalList = [];
  nationalitySelected: string;
  nationalityReady: boolean = true; // ready because the initial value is french
  @ViewChild('userphoto', { static: false }) uploadInput: any;

  photo: string;
  photo_s3_path: string;
  studentId: string;
  is_photo_in_s3 = false;
  dataStudent: any;
  blocksData = [];
  dataStudentIdentity: any;
  today = new Date();
  radioInvalid = false;

  typeOfFormationList = [];
  typeOfFormationListDropdown = [ 
    { key: "FORMATION_INITIALE_HORS_APPRENTISSAGE", value: "FORMATION INITIALE HORS APPRENTISSAGE" }, 
    { key: "FORMATION_INITIALE_APPRENTISSAGE", value: "FORMATION INITIALE APPRENTISSAGE" }, 
    { key: "FORMATION_CONTINUE_HORS_CONTRAT_DE_PROFESSIONNALISATION", value: "FORMATION CONTINUE HORS CONTRAT DE PROFESSIONNALISATION" }, 
    { key: "FORMATION_CONTINUE_CONTRAT_DE_PROFESSIONNALISATION", value: "FORMATION CONTINUE CONTRAT DE  PROFESSIONNALISATION" }, 
    { key: "VAE", value: "VAE" }, 
    { key: "EQUIVALENCE_DIPLOME_ETRANGER", value: "EQUIVALENCE (DIPLOME ETRANGER)" }, 
    { key: "CANDIDAT_LIBRE", value: "CANDIDAT LIBRE" },
   ]

   vaeAccessList = [];
   vaeAccessListDropdown = [
    { key: "CONGES_VAE", value: "CONGES VAE" },
    { key: "VAE_CLASSIQUE", value: "VAE CLASSIQUE" },
   ]

  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';

  identityForm: UntypedFormGroup;
  countries: string[] = [];
  filteredCountry: string[][] = [];
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  private timeOutVal: any;
  private intVal: any;
  schoolName: any;

  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private parseStringDatePipe: ParseStringDatePipe,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private router: Router,
    private userService: UserService,
    private dateAdapter: DateAdapter<Date>,
    private utilService: UtilityService
  ) {}

  ngOnInit() {
    this.resetData();
    this.getSchoolName();
    this.countries = this.schoolService.getCountries();
    this.nationalitiesList = this.studentService.getNationalitiesList();
    this.nationalList = this.studentService.getNationalitiesList();
    this.initForm();
    this.studentId = this.schoolService.getCurrentStudentId();
    this.subs.sink = this.schoolService.selectedDataStudent$.subscribe((resp) => (this.dataStudent = resp));
    this.subs.sink = this.schoolService.selectedDataStudentIdentity$.subscribe((resp) => (this.dataStudentIdentity = resp));
    this.getAllBlocks();
    this.getIdentityData();
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
      if (this.identityForm && this.identityForm.get('nationality').value) {
        const nationality = this.identityForm.get('nationality').value;
        this.identityForm.get('nationality').setValue(nationality);
      }
    });
    this.typeOfFormationList = this.typeOfFormationListDropdown;
    this.vaeAccessList = this.vaeAccessListDropdown;
  }

  ngOnChanges() {
    this.resetData();
    this.countries = this.schoolService.getCountries();
    this.nationalitiesList = this.studentService.getNationalitiesList();
    this.initForm();
    this.getIdentityData();
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
    this.studentService.resetStudentCardTrigger(true);
  }
  getSchoolName() {
    this.rncpTitleService.getSchoolName(this.schoolId).subscribe((resp) => {
      this.schoolName = resp.short_name;
    });
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

  initForm() {
    this.identityForm = this.fb.group({
      civility: [null, Validators.required],
      first_name: [null, [Validators.required, removeSpaces]],
      last_name: [null, [Validators.required, removeSpaces]],
      tele_phone: [null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(10), removeSpaces]],
      email: [null, [Validators.required, CustomValidators.email]],
      date_of_birth: [null, [Validators.required]],
      place_of_birth: [null, [Validators.required, removeSpaces]],
      nationality: ['France', [Validators.required, removeSpaces, this.nationalityValidator.bind(this)]],
      student_address: this.fb.array([this.initStudentAddressForm()]),
      postal_code_of_birth: [null, Validators.required],
      // type_of_formation: [null, Validators.required],
      // vae_access: [null],
    });
  }

  get studentAddressFormArray() {
    return this.identityForm.get('student_address') as UntypedFormArray;
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
      address: ['', [Validators.required, removeSpaces]],
      postal_code: ['', [Validators.required, Validators.maxLength(10), removeSpaces]],
      country: ['France', [Validators.required, removeSpaces]],
      city: [''],
      region: [''],
      department: [''],
      is_main_address: [false, Validators.required],
    });
  }

  checkMainAddress(event: MatSlideToggleChange) {
    if (event && event.checked) {
      this.isMainAddressSelected = true;
    } else {
      this.isMainAddressSelected = false;
    }
  }

  getPostcodeData(addressIndex: number) {
    const country = this.studentAddressFormArray.at(addressIndex).get('country').value;
    const postCode = this.studentAddressFormArray.at(addressIndex).get('postal_code').value;

    if (postCode && postCode.length > 3 && country && country.toLowerCase() === 'france') {
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

  getIdentityData() {
    this.isWaitingForResponse = true;
    const address = this.identityForm.get('student_address');
    if (this.dataStudentIdentity) {
      this.dataStudentIdentity.student_address.forEach((address, index) => {
        if (index > 0) {
          this.addAddressForm();
        }
        // get country, city, region, and department dropdown data
        this.filteredCountry[index] = this.countries;
        if (address.postal_code && address.country && address.country.toLowerCase() === 'france') {
          this.subs.sink = this.rncpTitleService.getFilteredZipCode(address.postal_code, address.country).subscribe((addresData) => {
            this.setAddressDropdown(addresData, index);
          });
        }

        // check for main address
        if (address.is_main_address) {
          this.isMainAddressSelected = true;
        }
      });
      if (this.dataStudentIdentity.date_of_birth) {
        this.dataStudentIdentity.date_of_birth = this.parseStringDatePipe.transform(this.dataStudentIdentity.date_of_birth);
      }
      this.identityForm.patchValue(this.dataStudentIdentity);
      // const time = moment(this.dataStudentIdentity.date_of_birth).format('DD/MM/YYYY');
      // this.identityForm.get('date_of_birth').setValue(time);
    }
    this.isWaitingForResponse = false;
  }

  addAddressForm() {
    this.studentAddressFormArray.push(this.initStudentAddressForm());
    this.filteredCountry.push(this.countries);
    this.cities.push([]);
    this.regions.push([]);
    this.departments.push([]);
  }

  filterNationality() {
    this.nationalityReady = false
    const searchString = this.identityForm.get('nationality').value.toLowerCase().trim();
    this.nationalList = this.nationalitiesList.filter((nationalities) => {
      let translateCountry = this.utilService.simpleDiacriticSensitiveRegex(
        this.translate.instant('NATIONALITY.' + nationalities.countryName),
      );
      return translateCountry.toLowerCase().trim().includes(this.utilService.simpleDiacriticSensitiveRegex(searchString));
    });
    this.identityForm.get('nationality').updateValueAndValidity()
  }

  filterTypeOfFormation() {
    const searchString = this.identityForm.get('type_of_formation').value.toLowerCase().trim();
    this.typeOfFormationList = this.typeOfFormationListDropdown.filter((typeFormation) =>
      typeFormation.value.toLowerCase().trim().includes(searchString)
    );
  }

  filterVaeAccess() {
    const searchString = this.identityForm.get('vae_access').value.toLowerCase().trim();
    this.vaeAccessList = this.vaeAccessListDropdown.filter((vaeAccess) => 
      vaeAccess.value.toLowerCase().trim().includes(searchString)
    );
  }

  filterCountry(addressIndex: number) {
    let searchString = this.studentAddressFormArray.at(addressIndex).get('country').value;
    if (searchString) {
      searchString = searchString.toLowerCase().trim();
      this.filteredCountry[addressIndex] = this.countries.filter((country) => country.toLowerCase().trim().includes(searchString));
    }
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

  removeStudentAddressForm(addressIndex: number, mainSelected: boolean) {
    const emptyAddress = JSON.stringify(this.initStudentAddressForm().value);
    const selectedAddress = JSON.stringify(this.studentAddressFormArray.at(addressIndex).value);

    if (emptyAddress !== selectedAddress) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DELETE_STUDENT_ADDRESS'),
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
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          const valid = this.studentAddressFormArray.at(addressIndex).get('is_main_address');
          this.studentAddressFormArray.removeAt(addressIndex);
          if (mainSelected) {
            if (valid.value) {
              this.isMainAddressSelected = false;
            } else {
              this.isMainAddressSelected = true;
            }
          }
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('CARDDETAIL.address deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      const valid = this.studentAddressFormArray.at(addressIndex).get('is_main_address');
      this.studentAddressFormArray.removeAt(addressIndex);
      if (mainSelected) {
        if (valid.value) {
          this.isMainAddressSelected = false;
        } else {
          this.isMainAddressSelected = true;
        }
      }
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('CARDDETAIL.address deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  openUploadWindow() {
    const file = this.uploadInput.nativeElement.click();
  }
  resetFileState() {
    this.uploadInput.nativeElement.value = '';
  }
  onCancelAdd() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TITLE'),
      html: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TEXT2'),
      footer: `<span style="margin-left: auto">IMP_STUDENT.CANCEL_ACTION</span>`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.DECBTN'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.schoolService.setDataStudent(null);
        this.schoolService.setCurrentStudentId(null);
        this.schoolService.setDataStudentIdentity(null);
        this.schoolService.setAddStudent(false);
      }
    });
  }

  updateStudentIdentity(type: string) {
    this.isWaitingForResponse = true;
    const data = this.identityForm.value;
    const school = {
      _id: this.schoolId,
    };
    const lang = this.translate.currentLang.toLowerCase();
    if (this.identityForm.valid) {
      this.schoolService.setDataStudentAddress(data ? data.student_address : '');
      if (data && data.student_address && data.student_address.length > 1) {
        data.student_address.forEach((element) => {
          if (element.is_main_address === false) {
            this.lenghtAddress++;
          }
        });
        if (this.lenghtAddress === data.student_address.length) {
          this.studentAddressFormArray.at(0).get('is_main_address').setValue(true);
          data.student_address[0].is_main_address = true;
        }
      }
      // this.identityForm.get('nationality').patchValue(this.nationalitySelected);

      if (data && data.student_address && data.student_address.length === 1) {
        this.studentAddressFormArray.at(0).get('is_main_address').setValue(true);
        data.student_address[0].is_main_address = true;
      }

      this.schoolService.setDataStudentIdentity(data);
      const now = moment(data.date_of_birth).format('MM/DD/YYYY');
      data.date_of_birth = now;
      const payload = this.createPayload(data);
      if (this.studentId) {
        this.subs.sink = this.schoolService.updateStudent(this.studentId, payload, lang).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            this.schoolService.setCurrentStudentId(resp._id);
            this.studentId = this.schoolService.getCurrentStudentId();
            if (resp) {
              Swal.fire({
                type: 'success',
                title: 'Bravo!',
              }).then(() => {
                if (type === 'continue') {
                  this.continue.emit(true);
                } else if (type === 'submit') {
                  this.goBackToStudentCards();
                }
              });
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
            // let index = err.indexOf("");
            const text = new String(err);
            let index = text.indexOf('/');
            let message = text.slice(21, index - 1);
            let pattern = text.slice(index);
            let str = '';

            if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ ]*$/') {
              str = 'must be letters';
            } else if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ -]*$/') {
              str = 'must be letters and "-"';
            } else if (pattern === '/^[0-9]+$/') {
              str = 'must be numbers';
            } else if (pattern === '/^[a-fA-F0-9]{24}$/') {
              str = 'must be Id';
            } else if (pattern === '/^[a-zA-Z0-9À-ÖØ-öø-ÿ -]*$/') {
              str = 'must be letters, numbers, and "-"';
            }
            let alert = message + ' ' + str;

            if (alert === 'No acad dir exists for  this rncp , school and class combinati') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ADDSTUDENT_S2.TITLE'),
                text: this.translate.instant('ADDSTUDENT_S2.TEXT', {
                  school: this.schoolName,
                }),
                footer: `<span style="margin-left: auto">ADDSTUDENT_S2</span>`,
                confirmButtonText: this.translate.instant('ADDSTUDENT_S2.CONFIRM'),
              });
            } else if (
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
            } else if (false) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ADDSTUDENT_S1.TITLE'),
                text: this.translate.instant('ADDSTUDENT_S1.TEXT'),
                confirmButtonText: this.translate.instant('ADDSTUDENT_S1.CONFIRM'),
              });
            } else if (err['message'] === 'GraphQL error: email is not valid') {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('studentmailvalidation_S1.TITLE'),
                html: this.translate.instant('studentmailvalidation_S1.TEXT'),
                footer: `<span style="margin-left: auto">studentmailvalidation_S1</span>`,
                confirmButtonText: this.translate.instant('studentmailvalidation_S1.BUTTON1'),
              }).then(() => {
                if (type === 'continue') {
                  this.continue.emit(true);
                } else if (type === 'submit') {
                  this.goBackToStudentCards();
                }
              });
            } else {
              Swal.fire({
                type: 'error',
                title: 'Error !',
                text: alert,
              });
            }
          },
        );
      } else {
        this.subs.sink = this.schoolService.createStudent(payload, lang).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            this.schoolService.setCurrentStudentId(resp._id);
            this.studentId = this.schoolService.getCurrentStudentId();
            if (resp) {
              Swal.fire({
                type: 'success',
                title: 'Bravo!',
              }).then(() => {
                if (type === 'continue') {
                  this.continue.emit(true);
                } else if (type === 'submit') {
                  this.goBackToStudentCards();
                }
              });
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
            // let index = err.indexOf("");
            const text = new String(err);
            let index = text.indexOf('/');
            let message = text.slice(21, index - 1);
            const eror = text.slice(21, index);
            let pattern = text.slice(index);
            let str = '';

            if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ ]*$/') {
              str = 'must be letters';
            } else if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ -]*$/') {
              str = 'must be letters and "-"';
            } else if (pattern === '/^[0-9]+$/') {
              str = 'must be numbers';
            } else if (pattern === '/^[a-fA-F0-9]{24}$/') {
              str = 'must be Id';
            } else if (pattern === '/^[a-zA-Z0-9À-ÖØ-öø-ÿ -]*$/') {
              str = 'must be letters, numbers, and "-"';
            }
            let alert = message + ' ' + str;

            if (eror === ' No acad dir exists for  this rncp , school and class combinatio') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ADDSTUDENT_S2.TITLE'),
                html: this.translate.instant('ADDSTUDENT_S2.TEXT', {
                  school: this.schoolName,
                }),
                footer: `<span style="margin-left: auto">ADDSTUDENT_S2</span>`,
                confirmButtonText: this.translate.instant('ADDSTUDENT_S2.CONFIRM'),
              });
            } else if (
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
            } else if (false) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ADDSTUDENT_S1.TITLE'),
                html: this.translate.instant('ADDSTUDENT_S1.TEXT'),
                confirmButtonText: this.translate.instant('ADDSTUDENT_S1.CONFIRM'),
              });
            } else if (err['message'] === 'GraphQL error: email is not valid') {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('studentmailvalidation_S1.TITLE'),
                html: this.translate.instant('studentmailvalidation_S1.TEXT'),
                footer: `<span style="margin-left: auto">studentmailvalidation_S1</span>`,
                confirmButtonText: this.translate.instant('studentmailvalidation_S1.BUTTON1'),
              }).then(() => {
                if (type === 'continue') {
                  this.continue.emit(true);
                } else if (type === 'submit') {
                  this.goBackToStudentCards();
                }
              });
            } else {
              Swal.fire({
                type: 'error',
                title: 'Error !',
                text: alert,
              });
            }
          },
        );
      }
    } else {
      this.identityForm.markAllAsTouched();
      this.isWaitingForResponse = false;
    }
  }

  formInvalidSwal() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TMTC_S02.TITLE'),
      text: this.translate.instant('TMTC_S02.TEXT'),
      footer: `<span style="margin-left: auto">TMTC_S02</span>`,
      confirmButtonText: this.translate.instant('TMTC_S02.BUTTON_1'),
      allowOutsideClick: false,
    });
    if (this.identityForm.get('civility').invalid) {
      this.radioInvalid = true;
    }
    this.identityForm.markAllAsTouched();
  }

  nextTab() {
    this.updateStudentIdentity('continue');
  }

  submit() {
    this.updateStudentIdentity('submit');
  }

  saveAndContinue() {
    const studentIdentityForm = this.identityForm.value;


    if (!this.identityForm.valid) {
      this.formInvalidSwal();
      return;
    }

    this.isWaitingForResponse = true;
    this.userService.getUserProfileData(studentIdentityForm.email).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp && resp.student_id && resp.student_id._id) {
        // if student already registered in platform, show transfer student swal
        this.showTransferStudentSwal(resp);
      } else {
        Swal.fire({
          type: 'question',
          title: 'Attention',
          html: this.translate.instant('CREATE_STUDENT.TEXT', {
            email: this.identityForm.get('email').value,
          }),
          footer: `<span style="margin-left: auto">CREATE_STUDENT</span>`,
          allowEscapeKey: true,
          showCancelButton: true,
          cancelButtonText: this.translate.instant('CREATE_STUDENT.NO'),
          confirmButtonText: this.translate.instant('CREATE_STUDENT.YES'),
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then((result) => {
          if (result.value) {
            this.updateStudentIdentity('continue');
          }
        });
      }
    });
  }

  saveAndLeave() {
    const studentIdentityForm = this.identityForm.value;


    if (!this.identityForm.valid) {
      this.formInvalidSwal();
      return;
    }

    this.isWaitingForResponse = true;
    this.userService.getUserProfileData(studentIdentityForm.email).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp && resp.student_id && resp.student_id._id) {
        // if student already registered in platform, show transfer student swal
        this.showTransferStudentSwal(resp);
      } else {
        Swal.fire({
          type: 'question',
          title: 'Attention',
          html: this.translate.instant('CREATE_STUDENT.TEXT', {
            email: studentIdentityForm.email,
          }),
          footer: `<span style="margin-left: auto">CREATE_STUDENT</span>`,
          allowEscapeKey: true,
          showCancelButton: true,
          cancelButtonText: this.translate.instant('CREATE_STUDENT.NO'),
          confirmButtonText: this.translate.instant('CREATE_STUDENT.YES'),
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then((result) => {
          if (result.value) {
            this.updateStudentIdentity('submit');
          }
        });
      }
    });
  }

  checkAskForTransfer() {
    const studentIdentityForm = this.identityForm.value;
    this.isWaitingForResponse = true;
    this.userService.getUserProfileData(studentIdentityForm.email).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp && resp.student_id && resp.student_id._id) {
          // if student already registered in platform, show transfer student swal
          this.showTransferStudentSwal(resp);
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('ASKTRAN_S01.TITLE'),
            html: this.translate.instant('ASKTRAN_S01.TEXT'),
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('ASKTRAN_S01.BUTTON'),
            footer: `<span style="margin-left: auto">ASKTRAN_S01</span>`,
            allowOutsideClick: false,
            allowEnterKey: false,
          });
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        if (error.message && error.message.includes('Student already registered.')) {
          let title = error.message.match(/title:([\s\S]*?),/g)[0].split(' ')[1].replace(/,/g,'');
          let studentClass = error.message.match(/class:([\s\S]*?),/g)[0].split(' ')[1].replace(/,/g,'');
          let status = this.translate.instant(error.message.match(/status:([\s\S]*?)+/g)[0].split(' ')[1]);

          Swal.fire({
            type: 'error',
            title: this.translate.instant('ASKTRAN_S02.TITLE'),
            html: this.translate.instant('ASKTRAN_S02.TEXT', { title, studentClass, status }),
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('ASKTRAN_S02.BUTTON'),
            footer: `<span style="margin-left: auto">ASKTRAN_S02</span>`,
            allowOutsideClick: false,
            allowEnterKey: false,
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: error && error['message'] ? error['message'] : error,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }

  showTransferStudentSwal(student: UserProfileData) {
    this.subs.sink = this.rncpTitleService.getTitleName(this.dataStudent.rncp_title).subscribe((title) => {
      let timeDisabledinSec = 6;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('acadir_transfer_swal.title', {
          studentName:
            (student.civility ? this.translate.instant(student.civility) : '') + ' ' + student.first_name + ' ' + student.last_name,
          titleName: title && title.short_name ? title.short_name : '',
        }),
        html: this.translate.instant('acadir_transfer_swal.text', {
          studentName:
            (student.civility ? this.translate.instant(student.civility) : '') + ' ' + student.first_name + ' ' + student.last_name,
          oldTitleName:
            student &&
            student.entities &&
            student.entities[0] &&
            student.entities[0].assigned_rncp_title &&
            student.entities[0].assigned_rncp_title.short_name
              ? student.entities[0].assigned_rncp_title.short_name
              : '',
          oldSchoolName:
            student && student.entities && student.entities[0] && student.entities[0].school && student.entities[0].school.short_name
              ? student.entities[0].school.short_name
              : '',
          newTitleName: title && title.short_name ? title.short_name : '',
        }),
        confirmButtonText: this.translate.instant('acadir_transfer_swal.CONFIRM'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('acadir_transfer_swal.CANCEL'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmButtonRef = Swal.getConfirmButton();
          // TimerLoop for derementing timeDisabledinSec
          this.intVal = setInterval(() => {
            timeDisabledinSec -= 1;
            confirmButtonRef.innerText = this.translate.instant('acadir_transfer_swal.CONFIRM_IN', { timer: timeDisabledinSec });
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmButtonRef.innerText = this.translate.instant('acadir_transfer_swal.CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
          }, timeDisabledinSec * 1000);
        },
      }).then((result) => {
        if (result.value) {
          this.isWaitingForResponse = true;
          this.studentService
            .transferStudent(
              student.student_id._id,
              this.dataStudent.rncp_title,
              this.dataStudent.current_class,
              this.schoolId,
              this.translate.currentLang,
              this.dataStudent.specialization,
            )
            .subscribe((resp) => {
              this.isWaitingForResponse = false;
              if (resp && resp.data && resp.data.TransferStudent) {
                Swal.fire({
                  type: 'success',
                  title: 'Bravo!',
                  allowOutsideClick: false,
                }).then((success) => {
                  if (success.value) {
                    this.goBackToStudentCards();
                  }
                });
              } else if (resp.errors && resp.errors[0] && resp.errors[0].message) {
                let errorMessage = resp.errors[0].message;
                if (resp.errors[0].message === 'Final Transcript Process Started For This Student') {
                  errorMessage = this.translate.instant('final_transcript_started_err');
                }
                Swal.fire({
                  type: 'error',
                  title: errorMessage,
                });
              }
            });
        }
      });
    });
  }

  handleInputChange(fileInput: Event) {
    const file = (<HTMLInputElement>fileInput.target).files[0];
    this.photo = '';
    this.photo_s3_path = '';
    this.is_photo_in_s3 = false;

    if (file) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          if (resp) {
            this.photo = resp.file_name;
            this.photo_s3_path = resp.s3_file_name;
            this.is_photo_in_s3 = true;
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
    this.resetFileState();
  }

  changeDateOfBirth() {
    this.identityForm
      .get('date_of_birth')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((type) => {
        this.identityForm.get('date_of_birth').setValue('');
      });
  }

  checkEmail(input) {


    const count = input.replace(/\s/g, '').length;
    if (!count || count === 0) {
      this.identityForm.get('email').patchValue('');

    }
  }

  previousTab() {
    this.canDeactivate();
  }

  isTestDataNotchanged(): boolean {
    let formData = null;
    this.subs.sink = this.schoolService.selectedDataStudentIdentity$.subscribe((resp) => (formData = resp));

    const apiData = _.cloneDeep(this.identityForm.value);

    return _.isEqual(formData, apiData);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;

    // The actual validation, by comparing data saved and current data in the form
    if (!this.identityForm.touched || this.isTestDataNotchanged()) {
      validation = true;
    } else {
      validation = false;
    }

    // Passing the validation into the canExitService, if we return true, meaning user are allowed to go, otherwise user will stay
    if (!validation) {
      return new Promise((resolve, reject) => {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          footer: `<span style="margin-left: auto">TMTC_S01</span>`,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
            this.back.emit(false);
          } else {
            this.back.emit(true);
          }
        });
      });
    } else {
      this.back.emit(true);
    }
  }
  getNationalitySelected(data) {

    this.nationalitySelected = data.countryName.toLowerCase();
  }

  getAllBlocks() {
    this.blocksData = [];
    this.subs.sink = this.studentService
      .getAllBlockCompetence(this.dataStudent.rncp_title, this.dataStudent.current_class)
      .subscribe((response) => {
        if (response) {
          this.blocksData = response;
        } else {
          this.blocksData = [];
        }
      });
  }

  createPayload(payload) {
    const partialData = [];
    const exemptionData = [];
    payload.status = 'pending';
    payload.photo = this.photo_s3_path;
    payload.school = this.schoolId;
    payload.photo_s3_path = this.photo_s3_path;
    payload.is_photo_in_s3 = this.is_photo_in_s3;
    payload.current_class = this.dataStudent.current_class;
    payload.rncp_title = this.dataStudent.rncp_title;
    payload.scholar_season = this.dataStudent.scholar_season;
    payload.specialization = this.dataStudent.specialization;
    payload.parallel_intake = this.dataStudent.parallel_intake;

    payload.exemption_document = this.dataStudent.exemption_document;
    payload.exemption_reason = this.dataStudent.exemption_reason;
    payload.is_have_exemption_block = this.dataStudent.is_have_exemption_block;
    payload.is_take_full_prepared_title = this.dataStudent.is_take_full_prepared_title;
    payload.exemption_blocks = [];
    payload.partial_blocks = [];
    payload.exemption_block_justifications = [];

    if (this.dataStudent.is_take_full_prepared_title) {
      this.dataStudent.partial_blocks = [];
      payload.exemption_blocks = this.dataStudent.exemption_blocks;
    }
    if (!this.dataStudent.is_take_full_prepared_title) {
      this.dataStudent.exemption_blocks = [];
      payload.partial_blocks = this.dataStudent.partial_blocks;
    }
    if (this.dataStudent.is_take_full_prepared_title && this.dataStudent.is_have_exemption_block) {
      payload.exemption_block_justifications = this.dataStudent.exemption_block_justifications;
    }

    return payload;
  }

  goBackToStudentCards() {
    this.schoolService.setDataStudent(null);
    this.schoolService.setCurrentStudentId(null);
    this.schoolService.setDataStudentIdentity(null);
    this.schoolService.setDataStudentCompany(null);
    this.schoolService.setDataStudentParents(null);
    this.schoolService.setAddStudent(false);
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
  displayTypeOfFormation(typeFormation): string {
    if(typeFormation) {
      const typeFormationText = this.typeOfFormationListDropdown.filter(el => el.key === typeFormation);
      return typeFormationText[0].value;
    }
  }

  displayVaeAccess(vaeAccess): string {
    if(vaeAccess) {
      const vaeAccessText = this.vaeAccessListDropdown.filter(el => el.key === vaeAccess);
      return vaeAccessText[0].value;
    }
  }

  validateNationality() {
    this.nationalityReady = true;
    this.identityForm.get('nationality').updateValueAndValidity();
  }

  nationalityValidator(c: FormControl): ValidationErrors | null {
    return this.nationalityReady ? null : {
      nationality: {
        selected: false
      }
    };
  }
}
