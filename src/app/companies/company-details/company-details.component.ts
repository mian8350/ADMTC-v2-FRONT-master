import { Component, OnInit, ViewChild, Input, OnChanges, OnDestroy, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, FormControl, UntypedFormArray } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CompanyService } from 'app/service/company/company.service';
import * as _ from 'lodash';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { DomSanitizer } from '@angular/platform-browser';
import { AskRevisionDialogComponent } from '../ask-revision-dialog/ask-revision-dialog.component';
import { ConnectSchoolDialogComponent } from '../connect-school-dialog/connect-school-dialog.component';
import { SubSink } from 'subsink';
import { startWith, tap, debounceTime, map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { NgxPermissionsService } from 'ngx-permissions';

interface Filter {
  school_name: string;
  shortName: string;
  classes: string;
}
@Component({
  selector: 'ms-company-details',
  templateUrl: './company-details.component.html',
  styleUrls: ['./company-details.component.scss'],
})
export class CompanyDetailsComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() companyData: any;
  @Input() companyId: string;
  @Output() submitRequest = new EventEmitter<any>();
  @Output() imgRequest = new EventEmitter<any>();
  isWaitingForResponse = false;
  isMainAddressSelected = false;
  countries;
  // filteredCountry: string[][] = [];
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];

  countryList;
  schoolList: any[] = [];
  titleList: any[] = [];
  classList: any[] = [];
  schoolDataList: any[] = [];
  titleDataList: any[] = [];
  classDataList: any[] = [];

  certifierStamp: String = '';
  certifierStampFile: any;
  companyLogoSrc: any;
  isCompanyLogoUploading: boolean;

  companyForm: UntypedFormGroup;
  isLoading = false;
  noData: any;
  timeOutSwal: any;
  sortValue = null;
  isReset = false;
  dataLoaded = false;
  entityData: any;
  CurUser: any;
  isUserAdmtc = false;
  isUserAcadir = false;
  private intVal: any;
  private timeOutVal: any;

  // *************** This variable is used to check if user has ability to edit the form or not. If admtc by default true,
  // but if acad dir/admin, need to check if company is ONLY for their school
  allowedToEdit = true;

  photo = '';
  photo_s3_path = '';
  is_photo_in_s3 = false;
  myInnerHeight = 1920;
  constructor(
    private fb: UntypedFormBuilder,
    private companyService: CompanyService,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    public dialog: MatDialog,
    private translate: TranslateService,
    private utilService: UtilityService,
    private CurUserService: AuthService,
    public permissionService: PermissionService,
    private permissions: NgxPermissionsService,
  ) {}

  ngOnInit() {
    this.heightConfig();
    this.subs.sink = this.companyService.getCountry().subscribe((list: any[]) => {
      this.countries = list;
      this.countryList = list;
    });
    // this.countries = this.companyService.getCountries();
    // this.countryList = this.companyService.getCountries();
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');

    // Cek User Type & Permission Access User to Company Data
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    if (!!this.permissions.getPermission('Academic Director') || !!this.permissions.getPermission('Academic Admin')) {
      this.isUserAcadir = true;
    }
    // ======================================================
  }

  ngOnChanges() {
    this.companyLogoSrc = null;
    this.allowedToEdit = true;

    clearInterval();
    clearTimeout();
    this.subs.unsubscribe();
    this.initForm();
    this.getData();
  }

  // *************** Function to get data heght screen windows and put as style in css
  heightConfig() {
    this.myInnerHeight = window.innerHeight - 310;
    return this.myInnerHeight;
  }

  // *************** Function to initialize form field
  initForm() {
    this.companyForm = this.fb.group({
      company_logo: [''],
      company_name: [null, Validators.required],
      no_RC: [null],
      capital_type: [null],
      capital: [null],
      type_of_company: [null],
      no_of_employee_in_france: [null],
      activity: [null],
      company_addresses: this.fb.array([this.initCompanyAddressForm()]),
    });
  }

  get companyAddressFormArray() {
    return this.companyForm.get('company_addresses') as UntypedFormArray;
  }

  // *************** Function to generate company address
  addCompanyAddressForm() {
    this.companyAddressFormArray.push(this.initCompanyAddressForm());
    // this.filteredCountry.push(this.countries);
    this.cities.push([]);
    this.regions.push([]);
    this.departments.push([]);
  }

  // *************** Function to initialize company address
  initCompanyAddressForm(): UntypedFormGroup {
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

  // *************** Function to check main address
  checkMainAddress(event: MatSlideToggleChange) {
    if (event && event.checked) {
      this.isMainAddressSelected = true;
    } else {
      this.isMainAddressSelected = false;
    }
  }

  // *************** Function to remove company address
  removeStudentAddressForm(addressIndex: number) {
    const emptyAddress = JSON.stringify(this.initCompanyAddressForm().value);
    const selectedAddress = JSON.stringify(this.companyAddressFormArray.at(addressIndex).value);
    if (emptyAddress !== selectedAddress) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DELETE_ADDRESS_COMP'),
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
          this.companyAddressFormArray.removeAt(addressIndex);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('Student address deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            footer: `<span style="margin-left: auto">EVENT_S1</span>`,
          });
        }
      });
    } else {

      this.companyAddressFormArray.removeAt(addressIndex);
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

  // *************** Function to patch data address
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

  // *************** Function to filter data address
  filterCountry(addressIndex: number) {
    this.subs.sink = this.companyAddressFormArray
      .at(addressIndex)
      .get('country')
      .valueChanges.subscribe((search) => {
        if (search && search.length >= 3) {
          this.countryList = this.countries.filter((country) =>
            country ? country.name.toLowerCase().trim().includes(search.toLowerCase()) : '',
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
  // ***************End of  Function to filter data address

  // *************** Function to validate upload loading
  setUploadLoadingTrue(type: string) {
    this.isCompanyLogoUploading = true;
  }

  setUploadLoadingFalse(type: string) {
    this.isCompanyLogoUploading = false;
  }
  // *************** End of Function to validate upload loading

  // *************** Function to upload file uploaded to server
  onFileSelected(fileInput: Event, type: string) {
    this.certifierStampFile = (<HTMLInputElement>fileInput.target).files[0];
    this.certifierStamp = this.certifierStampFile.name;
    this.setUploadLoadingTrue(type);
    if (
      (this.certifierStampFile && this.certifierStampFile.type === 'image/png') ||
      (this.certifierStampFile && this.certifierStampFile.type === 'image/jpeg')
    ) {
      this.subs.sink = this.fileUploadService.singleUpload(this.certifierStampFile).subscribe(
        (data) => {
          this.setUploadLoadingFalse(type);
          this.companyLogoSrc = data.file_url;
          this.imgRequest.emit(data.file_url);
        },
        (err) => {

          this.CurUserService.postErrorLog(err);
        },
      );
    } else {
      this.setUploadLoadingFalse(type);
    }
  }

  // *************** Function to get file uploaded
  imgURL(src: string) {
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  // *************** Function to patch and populate data company
  getData() {
    this.isWaitingForResponse = true;
    if (this.companyId) {
      this.subs.sink = this.companyService.getOneCompany(this.companyId).subscribe(
        (resp: any) => {
          if (resp) {
            if (resp.company_addresses && resp.company_addresses.length) {
              resp.company_addresses.forEach((address, index) => {
                if (address && address.is_main_address) {
                  this.isMainAddressSelected = true;
                }
                if (
                  address.postal_code &&
                  address.country &&
                  (address.country.toLowerCase() === 'france' || address.country.toLowerCase() === 'française')
                ) {
                  this.subs.sink = this.companyService.getFilteredZipCode(address.postal_code, 'France').subscribe((addresData) => {
                    // this.setAddressDropdown(addresData, index);
                  });
                }
                if (index >= 1) {
                  this.addCompanyAddressForm();
                }
              });
            }
            if (resp.company_logo) {
              this.companyLogoSrc = resp.company_logo;
            }
            this.companyForm.patchValue(resp);
            this.isWaitingForResponse = false;
          }
        },
        (err) => {

          this.CurUserService.postErrorLog(err);
        },
      );

      // *************** If user is acad dir or acad admin, then we need to check if the companies only connected to their school
      if (!!this.permissions.getPermission('Academic Director') || !!this.permissions.getPermission('Academic Admin')) {
        this.subs.sink = this.companyService.getSchoolsByCompanyId(this.companyId).subscribe((resp) => {
          const tempSchoolOfcompany = _.cloneDeep(resp);
          const schoolUser = this.utilService.getUserAllSchoolAcadDirAdmin();
          for (const schoolComp of tempSchoolOfcompany) {
            if (!schoolUser.includes(schoolComp._id)) {
              this.allowedToEdit = false;
              break;
            }
          }
        });

      }
      // ======================================================
    }
  }

  // *************** Function to open ask revision dialog
  onAskRevision() {
    this.dialog.open(AskRevisionDialogComponent, {
      minWidth: '505px',
      width: '590px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        reqNumber: '_1',
        companyId: this.companyId,
        userLogin: this.CurUser._id,
      },
    });
  }

  // *************** Function to update data detail company
  saveUpdate() {
    this.isWaitingForResponse = true;
    const payload = this.companyForm.value;
    payload.company_logo = this.companyLogoSrc;

    this.subs.sink = this.companyService.updateCompany(this.companyId, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.submitRequest.emit(true);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('COMPANY.UPDATEMSG', {
            shortName: payload.company_name,
          }),
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.submitRequest.emit(true);
        this.companyForm.markAllAsTouched();


        this.CurUserService.postErrorLog(err);
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  ngOnDestroy() {
    clearInterval(this.intVal);
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
