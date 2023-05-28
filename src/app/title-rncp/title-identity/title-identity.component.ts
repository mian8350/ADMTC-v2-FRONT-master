import { Component, OnInit, Input, Sanitizer, OnDestroy } from '@angular/core';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { SchoolService } from '../../service/schools/school.service';
import { SubSink } from 'subsink';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray, FormControl } from '@angular/forms';
import { UsersService } from 'app/service/users/users.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ApplicationUrls } from 'app/shared/settings';
import { DateAdapter } from '@angular/material/core';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-title-identity',
  templateUrl: './title-identity.component.html',
  styleUrls: ['./title-identity.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class TitleIdentityComponent implements OnInit, OnDestroy {
  rncpTitles: any[] = [];
  rncpTitle: any;
  long_name: String = '';
  short_name: String = '';
  rncp_code: Number;
  rncp_level: String = '';

  // saved form
  savedForm;
  isWaitingForResponse = true;

  // for dropdown
  franceArray = ['4', '5', '6', '7'];
  europeanArray = ['4', '5', '6', '7'];
  responsablePersons = [];
  filteredRegionList: Observable<string[]>;
  regionList = [];
  filteredCityList: Observable<string[]>;
  cityList = [];
  filteredDepartmentList: Observable<string[]>;
  departmentList = [];

  countries: string[] = [];
  filteredCountry: string[][] = [];
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;

  fr: String;
  eu: Number;
  region: String;
  city: String;
  country: String;
  admtc: String;
  isPublished: Boolean = false;
  fileName: String;
  isTitleLogoUploading = false;
  isCertiLogoUploading = false;

  filteredCountryList: Observable<string[]>;
  countryList = [
    'Albania',
    'Armenia',
    'Austria',
    'Belarus',
    'Belgium',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Croatia',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'Estonia',
    'Ethiopia',
    'Finland',
    'France',
    'Georgia',
    'Germany',
    'Greece',
    'Greenland',
    'Hungary',
    'Iceland',
    'Ireland',
    'Isle of Man',
    'Israel',
    'Italy',
    'Latvia',
    'Lesotho',
    'Liberia',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Maldives',
    'Netherlands',
    'Netherlands',
    'Norway',
    'Poland',
    'Portugal',
    'Romania',
    'Senegal',
    'Serbia and Montenegro',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Sweden',
    'Switzerland',
    'United Kingdom',
    'Venezuela',
  ];

  @Input() rncpId = '';
  private subs = new SubSink();
  titleIdentityForm: UntypedFormGroup;
  certifierForm: UntypedFormGroup;

  public Editor = DecoupledEditor;
  responsableExist = false;
  private timeOutVal: any;
  private intVal: any;
  isPermission: any;

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  public onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
  constructor(
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private rncpTitleService: RNCPTitlesService,
    private usersService: UsersService,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private dateAdapter: DateAdapter<Date>,
    public coreService: CoreService,
    public tutorialService: TutorialService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.initDropdownUser();
    this.countries = this.rncpTitleService.getCountries();
    this.inittitleIdentityForm();
    // this.initFilter();
    this.getTitleDetails(this.rncpId);
    this.getInAppTutorial('Title Identity');
  }

  initDropdownUser() {
    this.subs.sink = this.usersService.getAllUserADMTCDir().subscribe((resp) => {
      if (resp) {
        this.responsablePersons = resp;
      }
    });
  }

  initFilter() {
    this.filteredCountryList = this.addressFormArray
      .at(0)
      .get('country')
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value, 'country')),
      );
    this.filteredCityList = this.addressFormArray
      .at(0)
      .get('city')
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value, 'city')),
      );
    this.filteredDepartmentList = this.addressFormArray
      .at(0)
      .get('department')
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value, 'department')),
      );
    this.filteredRegionList = this.addressFormArray
      .at(0)
      .get('region')
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value, 'region')),
      );
  }

  private _filter(value: string, type: string): string[] {
    if (value) {
      const filterValue = value.toLowerCase();
      switch (type) {
        case 'country':
          return this.countryList.filter((option) => option.toLowerCase().includes(filterValue));
          break;
        case 'city':
          return this.cityList.filter((option) => option.toLowerCase().includes(filterValue));
          break;
        case 'department':
          return this.departmentList.filter((option) => option.toLowerCase().includes(filterValue));
          break;
        case 'region':
          return this.regionList.filter((option) => option.toLowerCase().includes(filterValue));
          break;
      }
    }
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.authService.getLocalStorageUser();
    const userType = currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  inittitleIdentityForm() {
    this.titleIdentityForm = this.fb.group({
      rncp_logo: [null],
      is_certifier_also_pc: [false],
      long_name: [null, [Validators.required, removeSpaces]],
      short_name: [null, [Validators.required, removeSpaces]],
      rncp_code: [null, [Validators.required, removeSpaces]],
      rncp_level: [null, Validators.required],
      rncp_level_europe: [null],
      is_published: [false],
      journal_text: [null],
      journal_date: [null],
      admtc_dir_responsible: [null],
      secondary_admtc_dir_responsible: [null],
      // year_of_certification: [''],
      name_of_signatory: [null],
      certifier: this.fb.group({
        logo: [null],
        short_name: [null, [Validators.required, removeSpaces]],
        long_name: [null, [Validators.required, removeSpaces]],
        school_address: this.fb.array([this.initSchoolAddressForm()]),
      })
    });
  }

  initSchoolAddressForm() {
    this.regions.push([]);
    this.departments.push([]);
    this.cities.push([]);
    return this.fb.group({
      region: [null, removeSpaces],
      postal_code: [null, [Validators.required, Validators.pattern('^[0-9]+$'), removeSpaces]],
      country: [null, [Validators.required, removeSpaces]],
      city: [null, removeSpaces],
      department: [null, removeSpaces],
      address1: [null, [Validators.required, removeSpaces]],
      address2: [null],
      is_main_address: [false],
    });
  }

  get addressFormArray() {
    return this.titleIdentityForm.get('certifier').get('school_address') as UntypedFormArray;
  }

  addAddressForm() {
    this.addressFormArray.push(this.initSchoolAddressForm());
  }

  // get myDate() {
  //   const dateValue = this.titleIdentityForm.get('year_of_certification').value;
  //   if (!dateValue) { return '' }
  //   return dateValue;
  // }
  // closedYearSelected(event: any, year?: any) {
  //   const ctrlValue = moment(event).format('YYYY').toString();
  //   this.titleIdentityForm.get('year_of_certification').patchValue(ctrlValue);


  //   year.close();
  // }

  removeAddressForm(index: number) {
    if (this.isAddressClean(index)) {
      this.addressFormArray.removeAt(index);
      if (this.addressFormArray.length === 1) {
        this.addressFormArray.at(0).get('is_main_address').patchValue(true);
      }
    } else {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.TITLE'),
        html: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.TEXT'),
        footer: `<span style="margin-left: auto">SCHOOL_S10</span>`,
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.BUTTON_CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.BUTTON_CANCEL'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.BUTTON_CONFIRM') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.BUTTON_CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.addressFormArray.removeAt(index);
          if (this.addressFormArray.length === 1) {
            this.addressFormArray.at(0).get('is_main_address').patchValue(true);
          }
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            allowOutsideClick: false,
          });
        }
      });
    }
  }

  getTitleDetails(ID: string) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getOneTitleById(ID).subscribe((resp) => {
      const data = _.cloneDeep(resp);
      this.isWaitingForResponse = false;
      if (data) {
        if (data.admtc_dir_responsible) {
          data.admtc_dir_responsible = data.admtc_dir_responsible._id;
        }

        if (data.secondary_admtc_dir_responsible) {
          data.secondary_admtc_dir_responsible = data.secondary_admtc_dir_responsible._id;
        }

        if (data.journal_date) {
          data.journal_date = this.parseStringDatePipe.transformDDMMYYYY(data.journal_date);
          // data.journal_date = this.parseStringDatePipe.transformWithPlusOne(data.journal_date);
        }
        if (data.certifier && data.certifier.school_address && data.certifier.school_address.length > 0) {
          if (data.certifier.school_address.length === 1) {
            data.certifier.school_address.forEach((address, index) => {
              address.is_main_address = true;
              if (address.address1) {
                address.address1 = this.cleanHTML(address.address1);
              }
            });
          } else {
            data.certifier.school_address.forEach((address, index) => {
              if (index > 0) {
                this.addAddressForm();
              }
              if (address.address1) {
                address.address1 = this.cleanHTML(address.address1);
              }
            });
          }
        }

        // Cleaning Empty Values
        const tempData = _.omitBy(data, _.isNil);


        this.titleIdentityForm.patchValue(tempData);
      }
      this.savedForm = this.titleIdentityForm.getRawValue();
    });
  }

  setUploadLoadingTrue(type: string) {
    if (type === 'rncpLogo') {
      this.isTitleLogoUploading = true;
    } else if (type === 'certifierLogo') {
      this.isCertiLogoUploading = true;
    }
  }

  setUploadLoadingFalse(type: string) {
    if (type === 'rncpLogo') {
      this.isTitleLogoUploading = false;
    } else if (type === 'certifierLogo') {
      this.isCertiLogoUploading = false;
    }
  }

  chooseFile(fileInput: Event, type: string) {
    const file = (<HTMLInputElement>fileInput.target).files[0];
    this.setUploadLoadingTrue(type);
    if ((file && file.type === 'image/png') || (file && file.type === 'image/jpeg')) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          this.setUploadLoadingFalse(type);
          if (resp) {
            switch (type) {
              case 'rncpLogo':
                this.titleIdentityForm.get('rncp_logo').setValue(resp.s3_file_name);
                this.titleIdentityForm.get('rncp_logo').markAsTouched();
                break;
              case 'certifierLogo':
                this.titleIdentityForm.get('certifier').get('logo').setValue(resp.s3_file_name);
                this.titleIdentityForm.get('certifier').get('logo').markAsTouched();
            }
          }
        },
        (err) => {
          this.setUploadLoadingFalse(type);
          Swal.fire({
            type: 'error',
            title: 'Error !',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {

          });
        },
      );
    } else {
      this.setUploadLoadingFalse(type);
    }
  }

  filterCountry(addressIndex: number) {
    if (this.addressFormArray.at(addressIndex).get('country').value) {
      const searchString = this.addressFormArray.at(addressIndex).get('country').value.toLowerCase().trim();
      this.filteredCountry[addressIndex] = this.countries.filter(
        (country) => country && country.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterRegion(addressIndex: number) {
    if (this.addressFormArray.at(addressIndex).get('region').value) {
      const searchString = this.addressFormArray.at(addressIndex).get('region').value.toLowerCase().trim();
      this.filteredRegions[addressIndex] = this.regions[addressIndex].filter(
        (region) => region && region.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterDepartments(addressIndex: number) {
    if (this.addressFormArray.at(addressIndex).get('department').value) {
      const searchString = this.addressFormArray.at(addressIndex).get('department').value.toLowerCase().trim();


      this.filteredDepartments[addressIndex] = this.departments[addressIndex].filter(
        (department) => department && department.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterCity(addressIndex: number) {
    if (this.addressFormArray.at(addressIndex).get('city').value) {
      const searchString = this.addressFormArray.at(addressIndex).get('city').value.toLowerCase().trim();
      this.filteredCities[addressIndex] = this.cities[addressIndex].filter(
        (city) => city && city.toLowerCase().trim().includes(searchString),
      );
    }
  }

  getPostcodeData(addressIndex: number) {
    const country = this.addressFormArray.at(addressIndex).get('country').value;
    const postCode = this.addressFormArray.at(addressIndex).get('postal_code').value;

    if (postCode && postCode.length > 3 && country && country.toLowerCase() === 'france') {
      this.subs.sink = this.rncpTitleService.getFilteredZipCode(postCode, country).subscribe((resp) => {
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

          this.addressFormArray.at(addressIndex).get('city').setValue(this.cities[addressIndex][0]);
          this.addressFormArray.at(addressIndex).get('department').setValue(this.departments[addressIndex][0]);
          this.addressFormArray.at(addressIndex).get('region').setValue(this.regions[addressIndex][0]);
        }
      });
    } else {
      this.addressFormArray.at(addressIndex).get('city').setValue('');
      this.addressFormArray.at(addressIndex).get('department').setValue('');
      this.addressFormArray.at(addressIndex).get('region').setValue('');
    }
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  populateDropdownArea() {
    const zip_code = this.addressFormArray.at(0).get('postal_code').value;
    const country = this.addressFormArray.at(0).get('country').value;

    if (zip_code && country) {
      if (zip_code.length > 3 && country === 'France') {
        this.subs.sink = this.rncpTitleService.getFilteredZipCode(zip_code, country).subscribe((resp) => {

          if (resp && resp.length > 0) {
            let tempRegion = [];
            let tempCity = [];
            let tempDepartment = [];
            this.subs.sink = resp.forEach((element) => {
              tempRegion.push(element.province);
              tempCity.push(element.city);
              tempDepartment.push(element.academy);
            });

            tempRegion = _.uniq(tempRegion);
            tempCity = _.uniq(tempCity);
            tempDepartment = _.uniq(tempDepartment);

            this.cityList = tempCity;
            this.regionList = tempRegion;
            this.departmentList = tempDepartment;

            this.addressFormArray.at(0).get('city').setValue(this.cityList[0]);
            this.addressFormArray.at(0).get('department').setValue(this.departmentList[0]);
            this.addressFormArray.at(0).get('region').setValue(this.regionList[0]);
          }
        });
      }
    }
  }

  resetAutoAreaSelection() {
    this.titleIdentityForm.get('certifier').get('school_address').get('city').setValue('');
    this.titleIdentityForm.get('certifier').get('school_address').get('department').setValue('');
    this.titleIdentityForm.get('certifier').get('school_address').get('region').setValue('');
  }

  createPayload() {
    const payload = this.titleIdentityForm.getRawValue();
    if (payload && payload.journal_date) {
      payload.journal_date = moment(payload.journal_date).format('DD/MM/YYYY');
    }
    return payload;
  }

  saveUpdate() {


    if (this.titleIdentityForm.valid) {
      // Check if there is more than one main address
      if (this.isMainAddressSelected()) {
        const payload = this.createPayload();

        this.isWaitingForResponse = true;
        this.subs.sink = this.rncpTitleService.updateRncpTitle(this.rncpId, payload).subscribe((resp) => {
          this.isWaitingForResponse = false;
          if (resp && resp.data && resp.data.UpdateTitle && !resp.errors) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Success'),
              text: this.translate.instant('RNCP.RNCP_EDITED'),
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('OK'),
            }).then((result) => {
              this.savedForm = payload;
              this.inittitleIdentityForm();
              this.getTitleDetails(this.rncpId);
            });
          } else if (resp.errors && resp.errors.length && resp.errors[0].message === 'Short Name Must Be Unique') {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('TMTC_S03.TITLE'),
              text: this.translate.instant('TMTC_S03.TEXT', { ShornameTitle: this.titleIdentityForm.get('short_name').value }),
              footer: `<span style="margin-left: auto">TMTC_S03</span>`,
              confirmButtonText: this.translate.instant('TMTC_S03.BUTTON_1'),
              allowOutsideClick: false,
            }).then((result) => {
              if (result.value) {
                this.titleIdentityForm.get('short_name').reset();
                this.titleIdentityForm.get('short_name').markAsTouched();
              }
            });
          } else if (resp.errors && resp.errors.length && resp.errors[0].message === 'Cannot create school with slash') {
            Swal.fire({
              title: this.translate.instant('ADDTITLE_SZ.TITLE'),
              text: this.translate.instant('ADDTITLE_SZ.TEXT'),
              footer: `<span style="margin-left: auto">ADDTITLE_SZ</span>`,
              confirmButtonText: this.translate.instant('ADDTITLE_SZ.BUTTON'),
              type: 'error',
              allowOutsideClick: false,
            });
          } else if (
            resp.errors &&
            resp.errors.length &&
            resp.errors[0].message === 'cannot remove the certifier as a pc also, because there is user assign this pc'
          ) {
            Swal.fire({
              title: this.translate.instant('UPDATETITLE_SX.TITLE'),
              text: this.translate.instant('UPDATETITLE_SX.TEXT'),
              footer: `<span style="margin-left: auto">UPDATETITLE_SX</span>`,
              confirmButtonText: this.translate.instant('UPDATETITLE_SX.BUTTON'),
              type: 'error',
              allowOutsideClick: false,
            });
          }
        });
      } else {
        Swal.fire({
          title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S9.TITLE'),
          text: this.translate.instant('SCHOOL_SWAL.SCHOOL_S9.TEXT'),
          footer: `<span style="margin-left: auto">SCHOOL_S9</span>`,
          confirmButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S9.BUTTON'),
          type: 'error',
          allowOutsideClick: false,
        });
      }
    } else {

      this.titleIdentityForm.markAllAsTouched();
      Swal.fire({
        title: this.translate.instant('RESP_ERROR.TITLE'),
        text: this.translate.instant('RESP_ERROR.TEXT'),
        footer: `<span style="margin-left: auto">RESP_ERROR</span>`,
        confirmButtonText: this.translate.instant('RESP_ERROR.CONFIRM'),
        type: 'error',
        allowOutsideClick: false,
      });
    }
  }

  getConvertDate() {
    const today = moment(this.titleIdentityForm.get('journal_date').value).format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, '16:00');
  }

  isAddressClean(index: number) {
    let result = false;
    const data = this.addressFormArray.at(index).value;
    delete data.is_main_address;

    const isEmpty = !Object.values(data).some((x) => x !== null && x !== '');
    if (isEmpty) {
      result = true;
      return result;
    }
    return result;
  }

  isMainAddressSelected(): boolean {
    let result = false;
    const data = this.addressFormArray.value;
    if (data && data.length && data.length === 1) {
      result = true;
    } else if (data && data.length && data.length > 1) {
      for (const address of data) {
        if (address.is_main_address) {
          result = true;
          break;
        }
      }
    }
    return result;
  }

  changePublished(event: any) {

    if (event.checked) {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TITLE_IDENTITY.PUBLISH_S1_TITLE'),
        text: this.translate.instant('TITLE_IDENTITY.PUBLISH_S1_TEXT', { eventName: this.titleIdentityForm.get('short_name').value }),
        footer: `<span style="margin-left: auto">PUBLISH_S1</span>`,
        confirmButtonText: this.translate.instant('TITLE_IDENTITY.PUBLISH_S1_BUTTON_1', { timer: timeDisabled }),
        showCancelButton: true,
        allowOutsideClick: false,
        cancelButtonText: this.translate.instant('TITLE_IDENTITY.PUBLISH_S1_BUTTON_2'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('TITLE_IDENTITY.PUBLISH_S2_BUTTON_1') + ' (' + timeDisabled + ')';
          }, 1000);

          const timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('TITLE_IDENTITY.PUBLISH_S2_BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((result) => {
        if (!result.value) {
          this.titleIdentityForm.get('is_published').setValue(false);
        }
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TITLE_IDENTITY.PUBLISH_S2_TITLE'),
        text: this.translate.instant('TITLE_IDENTITY.PUBLISH_S2_TEXT', { eventName: this.titleIdentityForm.get('short_name').value }),
        footer: `<span style="margin-left: auto">PUBLISH_S2</span>`,
        confirmButtonText: this.translate.instant('TITLE_IDENTITY.PUBLISH_S2_BUTTON_1', { timer: timeDisabled }),
        showCancelButton: true,
        allowOutsideClick: false,
        cancelButtonText: this.translate.instant('TITLE_IDENTITY.PUBLISH_S1_BUTTON_2'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('TITLE_IDENTITY.PUBLISH_S2_BUTTON_1') + ' (' + timeDisabled + ')';
          }, 1000);

          const timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('TITLE_IDENTITY.PUBLISH_S2_BUTTON_1');
            Swal.enableConfirmButton();
            // clearTimeout(time);
            clearInterval(intVal);
            clearTimeout(timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((result) => {
        if (!result.value) {
          this.titleIdentityForm.get('is_published').setValue(true);
        }
      });
    }
  }

  checkMainAddress() {
    const data = this.addressFormArray.value;
    let validate = false;
    if (data && data.length) {
      for (const address of data) {
        if (address && address.is_main_address) {
          validate = true;
          break;
        }
      }
    }
    return validate;
  }

  imgURL(src: string) {
    const logo = src;
    const result = this.serverimgPath + logo;
    return this.sanitizer.bypassSecurityTrustUrl(result);
  }

  findInvalidControls() {
    const invalid = [];
    const controls = this.titleIdentityForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  cleanHTML(text: string) {
    if (text) {
      return text.replace(/<[^>]*>/g, '');
    } else {
      return '';
    }
  }

  setRncpLevelEurope() {
    this.titleIdentityForm.get('rncp_level_europe').setValue(null);
  }

  deleteLogoTitle() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DELETE_LOGO.TITLE'),
      text: this.translate.instant('DELETE_LOGO.TEXT'),
      footer: `<span style="margin-left: auto">DELETE_LOGO</span>`,
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('DELETE_LOGO.BUTTON_CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DELETE_LOGO.BUTTON_CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_LOGO.BUTTON_CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_LOGO.BUTTON_CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result && result.value) {
        this.titleIdentityForm.get('rncp_logo').setValue('');
        Swal.fire({ type: 'success', title: 'Bravo!' });
      }
    });
  }

  deleteLogoCertifier() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DELETE_LOGO.TITLE'),
      text: this.translate.instant('DELETE_LOGO.TEXT'),
      footer: `<span style="margin-left: auto">DELETE_LOGO</span>`,
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('DELETE_LOGO.BUTTON_CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DELETE_LOGO.BUTTON_CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_LOGO.BUTTON_CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_LOGO.BUTTON_CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result && result.value) {
        this.titleIdentityForm.get('certifier').get('logo').setValue('');
        Swal.fire({ type: 'success', title: 'Bravo!' });
      }
    });
  }

  goToFormFolowUp(){
    this.router.navigate([`form-follow-up/`], { queryParams: { titleId: this.rncpId } });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
