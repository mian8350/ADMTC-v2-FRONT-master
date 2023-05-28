import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UsersService } from 'app/service/users/users.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { Observable, of } from 'rxjs';
import { startWith, map, debounceTime } from 'rxjs/operators';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DateAdapter } from '@angular/material/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { SubSink } from 'subsink';
import * as moment from 'moment';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { ApplicationUrls } from 'app/shared/settings';

@Component({
  selector: 'ms-create-title-identity',
  templateUrl: './create-title-identity.component.html',
  styleUrls: ['./create-title-identity.component.scss'],
  providers: [ParseStringDatePipe],
})
export class CreateTitleIdentityComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  titleIdentityForm: UntypedFormGroup;
  savedForm = '';

  // trigger
  hasSelected = false;
  hasSelectedSchool = true;
  isExistingSelected = false;
  selectedCertifier = '';
  isSchoolNotFilled = false;

  // patching value
  certifierControl = new UntypedFormControl();
  certifierList = [];
  filteredCertifier: Observable<any[]>;
  certLoading = false;
  selectedCertifierId = '';

  // new dropdown
  countries: string[] = [];
  filteredCountry: string[][] = [];
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];

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

  saveSuccessfull = false;
  isWaitingForResponse = false;

  isTitleLogoUploading = false;
  isCertiLogoUploading = false;

  selectedCertifierData;

  private intVal: any;
  private timeOutVal: any;

  // filteredCertifierList: Observable<any>;
  // certifierList = [];

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

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  // ckeditor configuration
  public Editor = DecoupledEditor;
  responsableExist = false;
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
    private router: Router,
    private dateAdapter: DateAdapter<Date>,
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.initTitleIdentityForm();
    this.initDropdownUser();
    this.countries = this.rncpTitleService.getCountries();
    this.getAllSchool();
  }

  triggerCertifier() {
    this.subs.sink = this.certifierControl.valueChanges.pipe().subscribe((value) => {
      if (this.selectedCertifierData && !this.isWaitingForResponse) {
        this.titleIdentityForm.get('certifier').setValue(null);
        this.resetAddSchoolForm();
        this.selectedCertifierData = null;
      }
      this.filteredCertifier = this.certifierControl.valueChanges.pipe(
        startWith(value),
        map((searchVal) =>
          this.certifierList.filter((opt) => {
            if (searchVal && typeof searchVal === 'string') {
              return this.simpleDiacriticSensitiveRegex(opt.short_name)
                .toLowerCase()
                .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
            } else if (searchVal === '') {
              return this.simpleDiacriticSensitiveRegex(opt.short_name)
                .toLowerCase()
                .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
            }
          }),
        ),
      );
    });
  }

  getAllSchool() {
    this.subs.sink = this.rncpTitleService.getFilteredAllSchool('').subscribe((resp) => {

      this.certifierList = _.cloneDeep(resp);
      this.filteredCertifier = of(this.certifierList);
      this.triggerCertifier();
    });
  }

  displayCertName(value?: any) {

    if (value && value.short_name) {
      return value.short_name;
    } else {
      return '';
    }
  }

  initTitleIdentityForm() {
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
      admtc_dir_responsible: [null, [Validators.required, removeSpaces]],
      certifier: [null],
      year_of_certification: [''],
      name_of_signatory: [null],
      add_school: this.fb.group({
        logo: [null],
        short_name: [null, [Validators.required, removeSpaces]],
        long_name: [null, [Validators.required, removeSpaces]],
        school_address: this.fb.array([this.initSchoolAddressForm()]),
      }),
    });
    this.savedForm = this.titleIdentityForm.getRawValue();
  }

  get myDate() {
    const dateValue = this.titleIdentityForm.get('year_of_certification').value;
    if (!dateValue) { return null; }
    return dateValue;
  }
  closedYearSelected(event: any, year?: any) {
    const ctrlValue = moment(event).format('YYYY').toString();
    this.titleIdentityForm.get('year_of_certification').patchValue(ctrlValue);


    year.close();
  }

  initSchoolAddressForm() {
    return this.fb.group({
      region: [null, removeSpaces],
      postal_code: [null, [Validators.required, Validators.maxLength(5), Validators.pattern('^[0-9]+$'), removeSpaces]],
      country: ['France', [Validators.required, removeSpaces]],
      city: [null, removeSpaces],
      department: [null, removeSpaces],
      address1: [null, [Validators.required, removeSpaces]],
      address2: [null],
      is_main_address: [false],
    });
  }

  get addressFormArray() {
    return this.titleIdentityForm.get('add_school').get('school_address') as UntypedFormArray;
  }

  addAddressForm() {
    this.addressFormArray.push(this.initSchoolAddressForm());
    if (!this.isMainAddressSelected()) {
      this.addressFormArray.at(0).get('is_main_address').patchValue(true);
    }
  }

  resetAddSchoolForm() {
    this.titleIdentityForm.get('add_school').reset();
    const addressData = this.addressFormArray.value;
    if (addressData && addressData.length) {
      let index = addressData.length - 1;
      for (const address of addressData) {
        this.addressFormArray.removeAt(index);
        if (this.addressFormArray.length === 1) {
          this.addressFormArray.at(0).get('is_main_address').patchValue(true);
        }
        index -= 1;
      }
    }
    this.addAddressForm();
  }

  initDropdownUser() {
    this.subs.sink = this.usersService.getAllUserADMTCDir().subscribe((resp) => {
      if (resp) {
        this.responsablePersons = resp;
        const corrineCrespin = this.responsablePersons.find(
          (person) => person && person.first_name === 'Corinne' && person.last_name === 'CRESPIN',
        );
        if (corrineCrespin) {
          this.titleIdentityForm.get('admtc_dir_responsible').patchValue(corrineCrespin._id);
        }
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
          return this.countryList.filter((option) => option && option.toLowerCase().includes(filterValue));
          break;
        case 'city':
          return this.cityList.filter((option) => option && option.toLowerCase().includes(filterValue));
          break;
        case 'department':
          return this.departmentList.filter((option) => option && option.toLowerCase().includes(filterValue));
          break;
        case 'region':
          return this.regionList.filter((option) => option && option.toLowerCase().includes(filterValue));
          break;
        case 'certifier':
          return this.certifierList.filter((option) => {
            return option && option.short_name.toLowerCase().includes(filterValue);
          });
      }
    }
  }

  initCertifierDropdown() {
    this.subs.sink = this.rncpTitleService.getCertifierSchool().subscribe((resp) => {
      if (resp) {
        this.certifierList = resp;
      }
    });
  }

  pickSelectOrCreate(type: string) {
    this.hasSelected = true;
    this.isSchoolNotFilled = false;
    if (type === 'select') {
      this.hasSelectedSchool = false;
      this.isExistingSelected = true;
    } else {
      if (this.isExistingSelected) {
        this.certifierControl.patchValue('');
      }
      this.hasSelectedSchool = true;
      this.isExistingSelected = false;
      this.titleIdentityForm.get('certifier').setValue(null);
      this.resetAddSchoolForm();
      // this.titleIdentityForm.get('add_school').reset();
    }
    const tempAnchor = document.getElementById('certifierSelector');
    const timeOutVal = setTimeout(() => {
      tempAnchor.scrollIntoView({ behavior: 'smooth' });
    }, 200);
    clearTimeout(timeOutVal);
  }

  // populateCertifierSelected(event: any) {
  //   this.titleIdentityForm.get('certifier').setValue(event.value._id);
  //   this.titleIdentityForm.get('add_school').patchValue(event.value);
  //   this.selectedCertifierData = event.value;

  // }

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
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
        this.setUploadLoadingFalse(type);
        if (resp) {
          switch (type) {
            case 'rncpLogo':
              this.titleIdentityForm.get('rncp_logo').setValue(resp.s3_file_name);
              this.titleIdentityForm.get('rncp_logo').markAsTouched();
              break;
            case 'certifierLogo':
              this.titleIdentityForm.get('add_school').get('logo').setValue(resp.s3_file_name);
              this.titleIdentityForm.get('add_school').get('logo').markAsTouched();
          }
        }
      },
      (err) => {
        this.setUploadLoadingFalse(type);
        Swal.fire({
          type: 'error',
          title: 'Error !',
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
      this.filteredCountry[addressIndex] = this.countries.filter((country) => country && country.toLowerCase().trim().includes(searchString));
    }
  }

  filterRegion(addressIndex: number) {
    if (this.addressFormArray.at(addressIndex).get('region').value && this.regions[addressIndex] && this.regions[addressIndex].length) {
      const searchString = this.addressFormArray.at(addressIndex).get('region').value.toLowerCase().trim();
      this.filteredRegions[addressIndex] = this.regions[addressIndex].filter((region) => region &&
        region.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterDepartments(addressIndex: number) {
    if (
      this.addressFormArray.at(addressIndex).get('department').value &&
      this.departments[addressIndex] &&
      this.departments[addressIndex].length
    ) {
      const searchString = this.addressFormArray.at(addressIndex).get('department').value.toLowerCase().trim();
      this.filteredDepartments[addressIndex] = this.departments[addressIndex].filter((department) => department &&
        department.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterCity(addressIndex: number) {
    if (this.addressFormArray.at(addressIndex).get('city').value && this.cities[addressIndex] && this.cities[addressIndex].length) {
      const searchString = this.addressFormArray.at(addressIndex).get('city').value.toLowerCase().trim();
      this.filteredCities[addressIndex] = this.cities[addressIndex].filter((city) => city && city.toLowerCase().trim().includes(searchString));
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

  createPayload() {
    const payload = this.titleIdentityForm.getRawValue();

    if (payload && payload.journal_date && payload.year_of_certification) {
      payload.journal_date = moment(payload.journal_date).format('DD/MM/YYYY');
      payload.year_of_certification = moment(payload.year_of_certification).format('YYYY');
    }
    return payload;
  }

  saveCreate() {

    if (this.titleIdentityForm.valid) {
      if (this.isMainAddressSelected()) {
        this.isWaitingForResponse = true;
        // let payload = this.titleIdentityForm.getRawValue();
        const payload = this.createPayload();
        if (this.isExistingSelected) {
          if (payload && payload.add_school) {
            payload.update_certifier = payload.add_school;
            delete payload.add_school;
          }
          delete payload.add_school;
        } else {
          delete payload.certifier;
        }

        this.subs.sink = this.rncpTitleService.createNewTitle(payload).subscribe((resp) => {
          this.isWaitingForResponse = false;

          if (resp && resp.data && resp.data.CreateTitle && !resp.errors) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('TMTC_S04.TITLE'),
              text: this.translate.instant('TMTC_S04.TEXT'),
              footer: `<span style="margin-left: auto">TMTC_S04</span>`,
              confirmButtonText: this.translate.instant('TMTC_S04.BUTTON_1'),
              showCancelButton: true,
              cancelButtonText: this.translate.instant('TMTC_S04.BUTTON_2'),
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((result) => {
              this.saveSuccessfull = true;
              if (result.value) {
                this.router.navigate([`title-rncp/details/${resp.data.CreateTitle._id}`]);
              } else {
                this.router.navigate([`title-rncp/`]);
              }
            });
          } else if (resp && resp.errors && resp.errors.length && resp.errors[0].message === 'Short Name Must Be Unique') {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('TMTC_S03.TITLE'),
              text: this.translate.instant('TMTC_S03.TEXT', { ShornameTitle: this.titleIdentityForm.get('short_name').value }),
              footer: `<span style="margin-left: auto">TMTC_S03</span>`,
              confirmButtonText: this.translate.instant('TMTC_S03.BUTTON_1'),
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((result) => {
              if (result.value) {
                this.titleIdentityForm.get('short_name').reset();
                this.titleIdentityForm.get('short_name').markAsTouched();
                const timeOutVal = setTimeout(() => {
                  const tempAnchor = document.getElementById('titleDetail');
                  tempAnchor.scrollIntoView({ behavior: 'smooth' });
                }, 100);
                clearTimeout(timeOutVal);
              }
            });
          } else if (resp && resp.errors && resp.errors.length && resp.errors[0].message === 'Cannot create school with slash') {
            Swal.fire({
              title: this.translate.instant('ADDTITLE_SZ.TITLE'),
              text: this.translate.instant('ADDTITLE_SZ.TEXT'),
              footer: `<span style="margin-left: auto">ADDTITLE_SZ</span>`,
              confirmButtonText: this.translate.instant('ADDTITLE_SZ.BUTTON'),
              type: 'error',
              allowOutsideClick: false,
            });
          } else {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('Error'),
              text: this.translate.instant('Something broke'),
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('OK'),
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
      if (!this.hasSelected) {
        Swal.fire({
          title: this.translate.instant('TMTC_S05.TITLE'),
          text: this.translate.instant('TMTC_S05.TEXT'),
          footer: `<span style="margin-left: auto">TMTC_S05</span>`,
          confirmButtonText: this.translate.instant('TMTC_S05.BUTTON_1'),
          type: 'error',
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(res => {
          this.isSchoolNotFilled = true;
          const timeOutVal = setTimeout(() => {
            const tempAnchor = document.getElementById('certifierSelector');
            tempAnchor.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          clearTimeout(timeOutVal);
        })
      } else {
        Swal.fire({
          title: this.translate.instant('TMTC_S02.TITLE'),
          text: this.translate.instant('TMTC_S02.TEXT'),
          footer: `<span style="margin-left: auto">TMTC_S02</span>`,
          confirmButtonText: this.translate.instant('TMTC_S02.BUTTON_1'),
          type: 'error',
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          this.titleIdentityForm.markAllAsTouched();
        if (this.hasSelected === false) {
          this.isSchoolNotFilled = true;
          const timeOutVal = setTimeout(() => {
            const tempAnchor = document.getElementById('certifierSelector');
            tempAnchor.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          clearTimeout(timeOutVal);
        } else if (this.hasSelected && this.titleIdentityForm.get('add_school').invalid) {
          this.titleIdentityForm.get('add_school').markAllAsTouched();
          const timeOutVal = setTimeout(() => {
            const tempAnchor = document.getElementById('certifierDetail');
            tempAnchor.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          clearTimeout(timeOutVal);
        }
        })
      }
    }
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
            resp.forEach((element) => {
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

  saveCertifierData(event: MatAutocompleteSelectedEvent) {
    // const temp: any = this.certifierList.filter(certData => certData.name === event.option.value);

    if (event && event.option && event.option.value && event.option.value._id) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.rncpTitleService.getOneCertifierSchool(event.option.value._id).subscribe((resp) => {
        const tempData = _.cloneDeep(resp);

        if (tempData) {

          if (tempData && tempData.school_address && tempData.school_address.length > 1) {
            tempData.school_address.forEach((address, index) => {

              if (index > 0) {
                this.addAddressForm();
              }
            });
          } else if (tempData && tempData.school_address && tempData.school_address.length === 1) {
            tempData.school_address[0].is_main_address = true;
          }

          this.hasSelectedSchool = true;
          this.titleIdentityForm.get('certifier').setValue(tempData._id);
          this.titleIdentityForm.get('add_school').patchValue(tempData);
          this.titleIdentityForm.get('add_school').markAllAsTouched();
          this.selectedCertifierData = _.cloneDeep(tempData);


        }
        const tempAnchor = document.getElementById('certifierSelector');
        const timeOutVal = setTimeout(() => {
          tempAnchor.scrollIntoView({ behavior: 'smooth' })
          clearTimeout(timeOutVal);
        }, 200);
        this.isWaitingForResponse = false;
      }, (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
    }
  }

  scrollTo(element) {
    window.scroll({
      behavior: 'smooth',
      left: 0,
      top: element.offsetTop,
    });
    window.removeEventListener('scroll', () => window.scrollTo(0, 0));
  }

  imgURL(src: string) {
    const logo = src;
    const result = this.serverimgPath + logo;
    return this.sanitizer.bypassSecurityTrustUrl(result);
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  goToDashboard() {
    this.router.navigate([`title-rncp/`]);
  }

  setRncpLevelEurope() {
    this.titleIdentityForm.get('rncp_level_europe').setValue(null);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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

  isMainAddressSelected(): boolean {
    let result = false;
    const data = this.addressFormArray.value;
    if (data && data.length && data.length > 0) {
      for (const address of data) {
        if (address.is_main_address) {
          result = true;
          break;
        }
      }
    }
    return result;
  }

  isAddressClean(index: number) {
    let result = false;
    if (this.addressFormArray && this.addressFormArray.at(index)) {
      const data = this.addressFormArray.at(index).value;
      delete data.is_main_address;
      const isEmpty = !Object.values(data).some((x) => x !== null && x !== '');
      if (isEmpty) {
        result = true;
        return result;
      }
    }
    return result;
  }

  removeAddressForm(index: number) {
    let timeDisabled = 5;
    if (this.isAddressClean(index)) {
      this.addressFormArray.removeAt(index);
      if (this.addressFormArray.length === 1) {
        this.addressFormArray.at(0).get('is_main_address').patchValue(true);
      }
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.TITLE'),
        text: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.TEXT'),
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
        this.titleIdentityForm.get('add_school').get('logo').setValue('');
        Swal.fire({ type: 'success', title: 'Bravo!' });
      }
    });
  }
}
