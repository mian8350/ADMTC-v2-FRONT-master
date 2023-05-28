import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from '@angular/forms';
import { StudentsService } from 'app/service/students/students.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DateAdapter } from '@angular/material/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { CustomValidators } from 'ng2-validation';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { ApplicationUrls } from 'app/shared/settings';
import { PermissionService } from 'app/service/permission/permission.service';
import { Router } from '@angular/router';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-identity',
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.scss'],
  providers: [ParseStringDatePipe],
})
export class IdentityComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Output() continue = new EventEmitter<boolean>();

  identityForm: UntypedFormGroup;
  studentDataTemp:any;
  isMainAddressSelected = false;
  nationalitiesList = [];
  nationalList = [];
  nationalitySelected: string;
  @ViewChild('userphoto', { static: false }) uploadInput: any;

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  today: Date;

  isWaitingForResponse = false;
  countries;
  countryList;
  filteredCountry: any[][] = [];
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];

  photo: string;
  photo_s3_path: string;
  is_photo_in_s3: boolean;
  myInnerHeight = 1920;
  studentData: any;
  
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
  private intVal: any;
  private timeOutVal: any;
  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private studentService: StudentsService,
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private parseStringDatePipe: ParseStringDatePipe,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    public permissionService: PermissionService,
    private acadJourneyService: AcademicJourneyService,
    private dateAdapter: DateAdapter<Date>,
    private certieDegreeService: CertidegreeService,
    private utilService: UtilityService
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.today = new Date();
    this.typeOfFormationList = this.typeOfFormationListDropdown;
    this.vaeAccessList = this.vaeAccessListDropdown;
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    if (this.router.url === '/my-file' || this.router.url.includes('previous-course')) {
      this.myInnerHeight = window.innerHeight - 193;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 369;
      return this.myInnerHeight;
    }
  }

  ngOnChanges() {
    this.resetData();
    this.subs.sink = this.schoolService.getCountry().subscribe((list: any[]) => {
      this.countries = list;
      this.countryList = list;
    });
    this.nationalitiesList = this.studentService.getNationalitiesList();
    this.initForm();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
      if (this.identityForm && this.identityForm.get('nationality').value) {
        const nationality = this.identityForm.get('nationality').value;
        this.identityForm.get('nationality').setValue(nationality);
      }
    });
    this.getIdentityData();
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
    this.studentService.resetStudentCardTrigger(true);
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
      first_name: [null, Validators.required],
      last_name: [null, Validators.required],
      tele_phone: [null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(10)]],
      email: [null, [Validators.required, CustomValidators.email]],
      date_of_birth: [null, Validators.required],
      place_of_birth: [null, Validators.required],
      nationality: ['', Validators.required],
      student_address: this.fb.array([this.initStudentAddressForm()]),
      postal_code_of_birth: [null, Validators.required],
      // type_of_formation: [null, Validators.required],
      // vae_access: [null],
    });
  }

  initFormListener() {
    this.subs.sink = this.identityForm.valueChanges.subscribe(resp=>{
      this.isFormSame();
    })
  }

  isFormSame() {
    const secondForm = JSON.stringify(this.studentDataTemp);
    const formType = JSON.stringify(this.identityForm.value);
    if (secondForm === formType) {
      this.certieDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certieDegreeService.childrenFormValidationStatus = false;
      return false;
    }
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
      address: [null, Validators.required],
      postal_code: [null, Validators.required],
      country: ['France', Validators.required],
      city: [null],
      region: [null],
      department: [null],
      is_main_address: [false, Validators.required],
    });
  }

  removeStudentAddressForm(addressIndex: number) {
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
          html: this.translate.instant('address deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          footer: `<span style="margin-left: auto">EVENT_S1</span>`,
        });
      }
    });
  }

  getIdentityData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.getStudentsIdentityData(this.studentId).subscribe((response) => {
      this.studentData = _.cloneDeep(response);
      const res = _.cloneDeep(response);
      if (res) {
        if (res.student_address && res.student_address.length) {
          res.student_address.forEach((address, index) => {
            if (address && address.is_main_address) {
              this.isMainAddressSelected = true;
            }
            // Remove this piece of code 03/11/2021 so that the data of import are not replaced
            // if (address.postal_code && address.country && address.country.toLowerCase() === 'france') {
            //   this.subs.sink = this.rncpTitleService.getFilteredZipCode(address.postal_code, address.country).subscribe((addresData) => {
            //     this.setAddressDropdown(addresData, index);
            //   });
            // }
            if (index >= 1) {
              this.addStudentAddressForm();
            }
          });
        }
        this.is_photo_in_s3 = false;

        if (res.is_photo_in_s3) {
          this.photo = res.photo;
          this.photo_s3_path = res.photo_s3_path;
          this.is_photo_in_s3 = res.is_photo_in_s3;
        }
        if (res.date_of_birth) {
          res.date_of_birth = this.parseStringDatePipe.transformMinusOne(res.date_of_birth);
        }
        // if (res.nationality) {
        //   res.nationality = this.translate.instant('NATIONALITY.' + res.nationality);
        // }
        this.identityForm.patchValue(res, {emitEvent: false});
        this.studentDataTemp = this.identityForm.value
        this.isFormSame();
        this.initFormListener();

        // Remove this piece of code 03/11/2021 so that the data of import are not replaced
        // if (this.studentAddressFormArray && this.studentAddressFormArray.length) {
        //   const studentArray = this.studentAddressFormArray.value;
        //   studentArray.forEach((address, addressIndex) => {
        //     this.getPostcodeData(addressIndex, false)
        //   });
        // }
      }

      this.isWaitingForResponse = false;
    });
  }

  checkMainAddress(event: MatSlideToggleChange) {
    if (event && event.checked) {
      this.isMainAddressSelected = true;
    } else {
      this.isMainAddressSelected = false;
    }
  }

  getPostcodeData(addressIndex: number, assign = true) {
    const country = this.studentAddressFormArray.at(addressIndex).get('country').value;
    const postCode = this.studentAddressFormArray.at(addressIndex).get('postal_code').value;

    if (postCode && country && postCode.length > 3 && country.toLowerCase() === 'france') {
      this.subs.sink = this.rncpTitleService.getFilteredZipCode(postCode, country).subscribe((resp) => {
        if (resp && resp.length) {
          this.setAddressDropdown(resp, addressIndex);

          if (assign) {
            this.studentAddressFormArray.at(addressIndex).get('city').setValue(this.cities[addressIndex][0]);
            this.studentAddressFormArray.at(addressIndex).get('department').setValue(this.departments[addressIndex][0]);
            this.studentAddressFormArray.at(addressIndex).get('region').setValue(this.regions[addressIndex][0]);
          }
        } else if (resp && !resp.length) {
          this.cities[addressIndex] = [''];
          this.departments[addressIndex] = [''];
          this.regions[addressIndex] = [''];
          this.studentAddressFormArray.at(addressIndex).get('city').setValue(this.cities[addressIndex][0]);
          this.studentAddressFormArray.at(addressIndex).get('department').setValue(this.departments[addressIndex][0]);
          this.studentAddressFormArray.at(addressIndex).get('region').setValue(this.regions[addressIndex][0]);
          this.filteredCities[addressIndex] = this.cities[addressIndex];
          this.filteredDepartments[addressIndex] = this.departments[addressIndex];
          this.filteredRegions[addressIndex] = this.regions[addressIndex];
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

  filterNationality() {
    const searchString = this.identityForm.get('nationality').value.toLowerCase().trim();
    this.nationalList = this.nationalitiesList.filter((nationalities) => {
      let translateCountry = this.utilService.simpleDiacriticSensitiveRegex(
        this.translate.instant('NATIONALITY.' + nationalities.countryName),
      );
      return translateCountry.toLowerCase().trim().includes(this.utilService.simpleDiacriticSensitiveRegex(searchString));
    });
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

  updateStudentIdentity() {
    this.isWaitingForResponse = true;
    const tempAddress = this.identityForm.value;

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
      // const value = temp.date_of_birth.getDate() + 1
      temp.date_of_birth = moment(temp.date_of_birth).format('YYYY-MM-DD');
    }
    // this.identityForm.get('nationality').setValue(this.nationalitySelected);
    if (temp && this.is_photo_in_s3) {
      temp.photo = this.photo_s3_path;
      temp.photo_s3_path = this.photo_s3_path;
      temp.is_photo_in_s3 = this.is_photo_in_s3;
    }

    if (temp && temp.student_address && temp.student_address.length) {


      temp.student_address.forEach((address, addressIndex) => {
        if (address && address.postal_code && address.country === 'France' && (!address.city || !address.department || !address.region)) {
          if (!address.city && this.cities && this.cities[addressIndex] && this.cities[addressIndex][0]) {
            address.city = this.cities[addressIndex][0];
          }
          if (!address.department && this.departments && this.departments[addressIndex] && this.departments[addressIndex][0]) {
            address.department = this.departments[addressIndex][0];
          }
          if (!address.region && this.regions && this.regions[addressIndex] && this.regions[addressIndex][0]) {
            address.region = this.regions[addressIndex][0];
          }
        }
      });
    }

    if (this.identityForm.valid) {
      this.subs.sink = this.schoolService.updateStudent(this.studentId, temp, lang).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
            }).then(() => {
              this.studentService.updateStudentCard(true)
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

          if (err['message'] === 'GraphQL error: Error: email is not valid') {
            Swal.fire({
              type: 'warning',
              title: this.translate.instant('studentmailvalidation_S1.TITLE'),
              html: this.translate.instant('studentmailvalidation_S1.TEXT'),
              confirmButtonText: this.translate.instant('studentmailvalidation_S1.BUTTON1'),
              footer: `<span style="margin-left: auto">studentmailvalidation_S1</span>`,
            }).then(() => {
              this.studentService.updateStudentCard(true)
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
            }).then(() => {
              this.studentService.updateStudentCard(true)
            });
          } else{
            Swal.fire({
              type: 'error',
              title: 'Error !',
              text: alert,
            });
          }
        },
      );
    } else {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('TMTC_S02.TITLE'),
        text: this.translate.instant('TMTC_S02.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S02.BUTTON_1'),
        footer: `<span style="margin-left: auto">TMTC_S02</span>`,
        allowOutsideClick: false,
      }).then((res) => {
        this.identityForm.markAllAsTouched();

      });
    }
  }

  openUploadWindow() {
    const file = this.uploadInput.nativeElement.click();
  }

  handleInputChange(fileInput: Event) {
    const file = (<HTMLInputElement>fileInput.target).files[0];
    this.photo = '';
    this.photo_s3_path = '';
    this.is_photo_in_s3 = false;

    if (file) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
        if (resp) {
          this.photo = resp.file_name;
          this.photo_s3_path = resp.s3_file_name;
          this.is_photo_in_s3 = true;
          this.certieDegreeService.childrenFormValidationStatus = false
        }
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error !',
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        }).then((res) => {

        });
      },
    );
    }
    this.resetFileState();
  }

  resetFileState() {
    this.uploadInput.nativeElement.value = '';
  }
  getNationalitySelected(data) {

    this.nationalitySelected = data.countryName.toLowerCase();
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

  selectedFormation(event: MatAutocompleteSelectedEvent) {
    const typeFormation = event.option.value;

    if (typeFormation === 'VAE') {
      this.identityForm.get('vae_access').setValidators([Validators.required]);
      this.identityForm.get('vae_access').updateValueAndValidity();
      this.identityForm.get('vae_access').patchValue(null);
      this.identityForm.get('vae_access').markAsUntouched();
    } else {
      this.identityForm.get('vae_access').clearValidators();
      this.identityForm.get('vae_access').updateValueAndValidity();
      this.identityForm.get('vae_access').patchValue(null);
      this.identityForm.get('vae_access').markAsUntouched();
    }
  }
}
