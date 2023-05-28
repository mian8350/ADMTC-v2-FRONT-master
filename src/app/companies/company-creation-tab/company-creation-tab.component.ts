import { Component, OnInit, ViewChild, Input, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from '@angular/forms';
import { CompanyService } from 'app/service/company/company.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import * as _ from 'lodash';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-company-creation-tab',
  templateUrl: './company-creation-tab.component.html',
  styleUrls: ['./company-creation-tab.component.scss'],
})
export class CompanyCreationTabComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @ViewChild('companyLogo', { static: false }) uploadInput: any;
  isMainAddressSelected = false;
  countries;
  countryList;
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];

  @Input() companyCreation: boolean;
  @Input() dataPass: any;
  @Output() previewChange = new EventEmitter();
  @Output() newCompany = new EventEmitter();

  certifierStamp: String = '';
  certifierStampFile: any;
  companyLogoSrc: any;
  isCompanyLogoUploading: boolean;
  isUserAdmtc = false;
  isUserAcadir = false;
  isWaitingForResponse = false;
  CurUser: any;
  entityData: any;
  newCompanyId: any;
  companyForm: UntypedFormGroup;
  private timeOutVal: any;
  private intVal: any;

  constructor(
    private fb: UntypedFormBuilder,
    private companyService: CompanyService,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private utilService: UtilityService,
    private CurUserService: AuthService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    // *************** Function to get data country
    this.subs.sink = this.companyService.getCountry().subscribe((list: any) => {
      this.countries = list;
      this.countryList = list;
    });

    // *************** Cek User Type & Permission Access User to Company Data
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.isUserAcadir = this.utilService.isUserAcadir();
    this.initForm();
    if (this.dataPass) {
      this.getPassData(this.dataPass);
    }
  }

  ngOnChanges() {
    this.countries = this.companyService.getCountries();
    this.initForm();
  }

  // *************** Function to initialize form field
  initForm() {
    this.companyForm = this.fb.group({
      company_logo: [null],
      company_name: [null, [Validators.required, removeSpaces]],
      no_RC: [null, [removeSpaces]],
      capital_type: [null, [removeSpaces]],
      capital: [null, [removeSpaces]],
      type_of_company: [null, [removeSpaces]],
      no_of_employee_in_france: [null, [removeSpaces]],
      activity: [null, [removeSpaces]],
      company_addresses: this.fb.array([this.initCompanyAddressForm()]),
    });
  }

  get companyAddressFormArray() {
    return this.companyForm.get('company_addresses') as UntypedFormArray;
  }

  // *************** Function to generate address field
  addCompanyAddressForm() {
    this.companyAddressFormArray.push(this.initCompanyAddressForm());
    this.cities.push([]);
    this.regions.push([]);
    this.departments.push([]);
  }

  // *************** Function to initialize address field
  initCompanyAddressForm(): UntypedFormGroup {
    return this.fb.group({
      address: [null, [Validators.required, removeSpaces]],
      postal_code: [null, [Validators.required, removeSpaces]],
      country: ['France', [Validators.required, removeSpaces]],
      city: [null, [Validators.required, removeSpaces]],
      region: [null, [Validators.required, removeSpaces]],
      department: [null, [Validators.required, removeSpaces]],
      is_main_address: [false, Validators.required],
    });
  }

  // *************** Function to check main address
  checkMainAddress(event: MatSlideToggleChange) {
    if (event && event.checked) {
      this.isMainAddressSelected = true;
    } else {
      this.isMainAddressSelected = false;
    }
  }

  // *************** Function to remove company address
  removeStudentAddressForm(addressIndex: number, mainSelected: boolean) {
    const emptyAddress = JSON.stringify(this.initCompanyAddressForm().value);
    const selectedAddress = JSON.stringify(this.companyAddressFormArray.at(addressIndex).value);
    if (emptyAddress !== selectedAddress) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Student address !'),
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
          clearInterval(this.timeOutVal);
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
          const valid = this.companyAddressFormArray.at(addressIndex).get('is_main_address');
          this.companyAddressFormArray.removeAt(addressIndex);
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
            html: this.translate.instant('Student address deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            footer: `<span style="margin-left: auto">EVENT_S1</span>`
          });
        }
      });
    } else {
      const valid = this.companyAddressFormArray.at(addressIndex).get('is_main_address');
      this.companyAddressFormArray.removeAt(addressIndex);
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
        html: this.translate.instant('Student address deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  // *************** Function to get data postal code
  getPostcodeData(addressIndex: number) {
    const country = this.companyAddressFormArray.at(addressIndex).get('country').value;
    const postCode = this.companyAddressFormArray.at(addressIndex).get('postal_code').value;
    if (postCode && country) {
      if (postCode.length > 3 && (country.toLowerCase() === 'france' || 'française')) {
        this.subs.sink = this.companyService.getFilteredZipCode(postCode, 'France').subscribe(
          (resp) => {
            if (resp && resp.length) {
              this.setAddressDropdown(resp, addressIndex);

              this.companyAddressFormArray.at(addressIndex).get('city').setValue(this.cities[addressIndex][0]);
              this.companyAddressFormArray.at(addressIndex).get('department').setValue(this.departments[addressIndex][0]);
              this.companyAddressFormArray.at(addressIndex).get('region').setValue(this.regions[addressIndex][0]);
            }
          },
          (err) => {

            this.CurUserService.postErrorLog(err);
          },
        );
      }
    }
  }

  // *************** Function to patch data from check company dialog
  getPassData(data) {
    const country = data.country ? data.country : '';
    const postCode = data.zip_code ? data.zip_code.toString() : '';
    data.postal_code = data.zip_code ? data.zip_code.toString() : '';
    const company_name = data.company_name ? data.company_name : '';
    this.companyAddressFormArray.at(0).patchValue(data);
    this.companyForm.get('company_name').setValue(company_name);
    if (postCode && country) {

      if (postCode.length > 3 && (country.toLowerCase() === 'france' || 'française')) {
        this.subs.sink = this.companyService.getFilteredZipCode(postCode, 'France').subscribe(
          (resp) => {
            if (resp && resp.length) {
              this.setAddressDropdown(resp, 0);

              this.companyAddressFormArray.at(0).get('city').setValue(this.cities[0][0]);
              this.companyAddressFormArray.at(0).get('department').setValue(this.departments[0][0]);
              this.companyAddressFormArray.at(0).get('region').setValue(this.regions[0][0]);
            }
          },
          (err) => {

            this.CurUserService.postErrorLog(err);
          },
        );
      }
    }


  }

  // *************** Function to populate data address
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

  // *************** Function to filter data address company
  filterCountry(addressIndex: number) {
    this.subs.sink = this.companyAddressFormArray
      .at(addressIndex)
      .get('country')
      .valueChanges.subscribe((search) => {
        if (search && search.length >= 3) {
          this.countryList = this.countries.filter((country) =>
            country && country.name ? country.name.toLowerCase().trim().includes(search.toLowerCase()) : '',
          );
        }
      });
  }

  filterCity(addressIndex: number) {
    if (this.cities[addressIndex] && this.cities[addressIndex].length) {
      const searchString = this.companyAddressFormArray.at(addressIndex).get('city').value.toLowerCase().trim();
      this.filteredCities[addressIndex] = this.cities[addressIndex].filter((city) =>
        city ? city.toLowerCase().trim().includes(searchString) : '',
      );
    }
  }

  filterDepartment(addressIndex: number) {
    if (this.departments[addressIndex] && this.departments[addressIndex].length) {
      const searchString = this.companyAddressFormArray.at(addressIndex).get('department').value.toLowerCase().trim();
      this.filteredDepartments[addressIndex] = this.departments[addressIndex].filter((department) =>
        department ? department.toLowerCase().trim().includes(searchString) : '',
      );
    }
  }

  filterRegion(addressIndex: number) {
    if (this.regions[addressIndex] && this.regions[addressIndex].length) {
      const searchString = this.companyAddressFormArray.at(addressIndex).get('region').value.toLowerCase().trim();
      this.filteredRegions[addressIndex] = this.regions[addressIndex].filter((region) =>
        region ? region.toLowerCase().trim().includes(searchString) : '',
      );
    }
  }
  // *************** End of Function to filter data address company

  // *************** Function to validate loading upload
  setUploadLoadingTrue(type: string) {
    this.isCompanyLogoUploading = true;
  }

  setUploadLoadingFalse(type: string) {
    this.isCompanyLogoUploading = false;
  }

  // *************** Function to upload file to server
  onFileSelected(fileInput: Event, type: string) {
    this.certifierStampFile = (<HTMLInputElement>fileInput.target).files[0];
    this.certifierStamp = this.certifierStampFile ? this.certifierStampFile.name : '';
    this.setUploadLoadingTrue(type);
    if (this.certifierStampFile.type === 'image/png' || this.certifierStampFile.type === 'image/jpeg') {
      this.fileUploadService.singleUpload(this.certifierStampFile).subscribe(
        (data) => {
          this.setUploadLoadingFalse(type);
          this.companyLogoSrc = data.file_url;
        },
        (err) => {
          this.setUploadLoadingFalse(type);

          this.CurUserService.postErrorLog(err);
        },
      );
    } else {
      this.setUploadLoadingFalse(type);
    }
  }

  // *************** Function to get data file
  imgURL(src: string) {
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  // *************** Function to cancel action
  cancelAndReturn() {
    this.companyCreation = false;
    if (this.dataPass && this.dataPass.schoolId && this.dataPass.titleId && this.dataPass.classId && this.dataPass.studentId) {
      this.router.navigate(['/school', this.dataPass.schoolId], {
        queryParams: {
          title: this.dataPass.titleId,
          class: this.dataPass.classId,
          student: this.dataPass.studentId,
          open: 'student-cards',
          selectedTab: 'Company',
          selectedSubTab: 'Company',
        },
      });
    } else {
      this.previewChange.emit({ createCompany: this.companyCreation, companyId: null, connectCompany: false });
    }
    // this.router.navigate([`companies/`]);
  }

  // *************** Function to save data new company
  saveData() {
    if (this.companyForm.valid) {
      this.isWaitingForResponse = true;
      const payload = this.companyForm.value;

      if (this.isUserAcadir) {
        payload.school_ids = this.entityData.school._id;
      } else if (this.dataPass && this.dataPass.schoolId && this.dataPass.titleId && this.dataPass.classId && this.dataPass.studentId) {
        payload.school_ids = this.dataPass.schoolId;
      }
      payload.company_logo = this.companyLogoSrc;
      this.subs.sink = this.companyService.createCompany(payload).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((result) => {
              this.handleSuccessCreatecompany(resp);
            });
          } else {
            this.swalNormalError();
          }
        },
        (err) => {
          this.swalErrorRequired();
        },
      );
    } else {
      this.swalErrorRequired();
    }
  }

  handleSuccessCreatecompany(resp) {
    if (this.dataPass && this.dataPass.schoolId && this.dataPass.titleId && this.dataPass.classId && this.dataPass.studentId) {
      this.companyCreation = false;
      if (this.isUserAcadir) {
        const schoolId = this.entityData.school._id;
        this.subs.sink = this.companyService.connectSchoolToCompany(resp._id, schoolId).subscribe(
          (resps) => {
            if (resps) {
              this.router.navigate(['/school', this.dataPass.schoolId], {
                queryParams: {
                  title: this.dataPass.titleId,
                  class: this.dataPass.classId,
                  student: this.dataPass.studentId,
                  open: 'student-cards',
                  selectedTab: 'Company',
                  selectedSubTab: 'Company',
                  newCompanyId: resp._id,
                },
              });
            }
          },
          (err) => {

            this.CurUserService.postErrorLog(err);
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          },
        );
      } else {
        this.router.navigate(['/school', this.dataPass.schoolId], {
          queryParams: {
            title: this.dataPass.titleId,
            class: this.dataPass.classId,
            student: this.dataPass.studentId,
            open: 'student-cards',
            selectedTab: 'Company',
            selectedSubTab: 'Company',
            newCompanyId: resp._id,
          },
        });
      }
    } else {
      let companyResponse = {};
      this.companyCreation = false;
      companyResponse = {
        companyId: resp._id,
        company_name: resp.company_name,
      };
      this.previewChange.emit({ createCompany: false, companyId: resp._id, connectCompany: true });
      this.newCompany.emit(companyResponse);
    }
  }

  swalNormalError() {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'error',
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    }).then((res) => {
      this.companyForm.markAllAsTouched();

    });
  }

  swalErrorRequired() {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TESTCORRECTIONS.MESSAGE.REQUIREDFIELDMESSAGE'),
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    }).then((res) => {
      this.companyForm.markAllAsTouched();

    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
