import { Component, OnInit, ViewChild, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import Swal from 'sweetalert2';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { SchoolService } from 'app/service/schools/school.service';
import { ConnectTitleDialogComponent } from './connect-title-dialog/connect-title-dialog.component';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { debounceTime, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { EditConnectedTitleDialogComponent } from './edit-connected-title-dialog/edit-connected-title-dialog.component';
import { SchoolPreparationCenterAndCertifierTable } from '../School.model';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { Observable, of } from 'rxjs';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { ApplicationUrls } from 'app/shared/settings';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';

interface SchoolDropdown {
  _id: string;
  long_name: string;
}

interface Filter {
  shortName: string;
  longName: string;
  specialization: string;
  connectedAs: string;
  className: string;
}

@Component({
  selector: 'ms-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.scss'],
})
export class SchoolDetailComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() schoolId: string;
  isMainAddressSelectedd = false;

  // connected rncp title table variables
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatTable, { static: false }) table: MatTable<any>;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  displayedColumns: string[] = ['shortName', 'longName', 'class', 'specialization', 'connectedAs'];
  filterColumns: string[] = ['shortNameFilter', 'longNameFilter', 'classFilter', 'specializationFilter', 'connectedAsFilter'];
  shortNameFilter = new UntypedFormControl('');
  longNameFilter = new UntypedFormControl('');
  classFilter = new UntypedFormControl('');
  specializationFilter = new UntypedFormControl('');
  connectedAsFilter = new UntypedFormControl('');
  filteredValues: Filter = {
    shortName: '',
    longName: '',
    specialization: '',
    connectedAs: '',
    className: '',
  };
  connectedAsFilterList = [
    {
      name: 'all',
      value: 'all',
    },
    {
      name: 'preparation_center',
      value: 'preparation_center',
    },
    {
      name: 'certifier',
      value: 'certifier',
    },
  ];

  schoolForm: UntypedFormGroup;
  retakeCenterControl = new UntypedFormControl('');
  groupControl = new UntypedFormControl('');
  selectedRetakeCenter: any;
  schools: SchoolDropdown[] = [];
  groups = [];
  filteredGroupName: Observable<any[]>;

  originalConnectedTitleData: SchoolPreparationCenterAndCertifierTable[];
  uniqOriginalConnectedTitleDataShort: SchoolPreparationCenterAndCertifierTable[] = [];
  uniqOriginalConnectedTitleDataLong: SchoolPreparationCenterAndCertifierTable[] = [];
  filteredShortName: any[] = [];
  filteredLongName: any[] = [];

  countries: string[] = [];
  filteredCountry: string[][] = [];
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];

  // trigger for main class selected
  isMainClassSelected = false;
  isWaitingForResponse = false;
  isResetTableProcess = false;
  CurUser: any;
  isEditable = true;

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;

  isUploading = false;
  isUserAcadir = false;
  dialogConfig: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };
  hideRequiredMarker = false;
  loadSchoolForm: any;
  private intVal: any;
  private timeOutVal: any;

  isADMTC = false;
  isADMTCDir = false;
  isPCDir = false;
  isCRDir = false;
  isCRAdmin = false;
  isACADAdmin = false;
  iconPc = '../../../assets/img/icon-pc.png';
  iconCp = '../../../assets/img/icon-cp.png';

  isPermission: any;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  filteredClass: any[];
  originalClass: any[];
  originalConnectedTitleDataLong: any;
  originalLongName: any;
  originalShortName: any;
  noData: Observable<boolean>;
  hasCertifier: boolean;
  schoolData: any;

  constructor(
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    public translate: TranslateService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private router: Router,
    private authService: AuthService,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
    public permissionService: PermissionService,
    public coreService: CoreService,
    public tutorialService: TutorialService,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.CurUser = this.authService.getLocalStorageUser();
    this.userTypeChecking();
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');
    this.isACADAdmin = !!this.permissions.getPermission('Academic Admin');
    this.isADMTCDir = !!this.permissions.getPermission('ADMTC Director');
    this.isPCDir = !!this.permissions.getPermission('PC School Director');
    this.isCRDir = !!this.permissions.getPermission('CR School Director');
    this.isCRAdmin = !!this.permissions.getPermission('Certifier Admin');


    this.isADMTC = this.utilService.isUserEntityADMTC();


    if (this.isADMTC || this.isADMTCDir) {
      this.displayedColumns.push('action');
      this.filterColumns.push('actionFilter');
    }
    this.initSchoolForm();
    this.countries = this.schoolService.getCountries();
    this.addAddressForm();
    this.getAllRetakeSchool();
    this.getAllGroupOfSchool();
    this.setAutocompleteField();
    this.getInAppTutorial('Detail of School');

    if (this.schoolId) {
      this.getSchoolData();
      this.getConnectedTitleTableData();
    } else {
      this.loadSchoolForm = this.schoolForm.value;
    }
  }

  // ngAfterViewInit() {
  //   this.dataSource.sort = this.sort;
  // }

  initSchoolForm() {
    this.schoolForm = this.fb.group({
      long_name: ['', [Validators.required, removeSpaces]],
      short_name: ['', [Validators.required, removeSpaces]],
      group_of_school_id: [null, removeSpaces],
      logo: [''],
      school_address: this.fb.array([]),
      retake_center: [null, [removeSpaces]], // school id
      school_siret: ['', removeSpaces],
      government_certifier_id: [''],
      contract_number_certifier: [''],
    });
  }

  initAddressForm() {
    return this.fb.group({
      address1: ['', [Validators.required, removeSpaces]],
      postal_code: ['', [Validators.required, removeSpaces]],
      country: ['France', [Validators.required, removeSpaces]],
      city: ['', [Validators.required, removeSpaces]],
      department: ['', [Validators.required, removeSpaces]],
      region: ['', [Validators.required, removeSpaces]],
      is_main_address: [false],
    });
  }

  get addressFormArray() {
    return this.schoolForm.get('school_address') as UntypedFormArray;
  }

  addAddressForm() {
    this.addressFormArray.push(this.initAddressForm());
    this.filteredCountry.push(this.countries);
    this.cities.push([]);
    this.regions.push([]);
    this.departments.push([]);
  }

  removeAddressForm(index: number, mainSelected: boolean) {
    let timeDisabled = 5;
    if (this.isAddressClean(index)) {
      const valid = this.addressFormArray.at(index).get('is_main_address');
      this.addressFormArray.removeAt(index);
      if (this.addressFormArray.length === 1) {
        this.addressFormArray.at(0).get('is_main_address').patchValue(true);
      }
      if (valid.value) {
        this.isMainAddressSelectedd = false;
      } else {
        this.isMainAddressSelectedd = true;
      }
    } else {
      Swal.fire({
        title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.TITLE'),
        text: this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.TEXT'),
        type: 'warning',
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
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.BUTTON_CONFIRM') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S10.BUTTON_CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          const valid = this.addressFormArray.at(index).get('is_main_address');
          this.addressFormArray.removeAt(index);
          if (this.addressFormArray.length === 1) {
            this.addressFormArray.at(0).get('is_main_address').patchValue(true);
          }
          if (valid.value) {
            this.isMainAddressSelectedd = false;
          } else {
            this.isMainAddressSelectedd = true;
          }
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    }
  }

  getSchoolData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.schoolService.getSchool(this.schoolId).subscribe((response) => {
      const resp = _.cloneDeep(response);
      this.schoolData = resp;
      if (resp) {
        if (resp.school_address && resp.school_address.length) {
          resp.school_address.forEach((address, index) => {
            if (address && address.is_main_address) {
              this.isMainAddressSelectedd = true;
            }
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
            // if (address.is_main_address) {
            //   this.isMainClassSelected = true;
            // }
          });
        }
        if (resp.retake_center) {
          // set retake center field's value and dropdown
          const retakeCenter = _.cloneDeep(resp.retake_center);
          resp['retake_center'] = retakeCenter._id;
          this.retakeCenterControl.setValue(retakeCenter);
          this.schools.push(retakeCenter);
        }
        if (resp.group_of_school_id && resp.group_of_school_id._id) {
          this.groupControl.setValue(response.group_of_school_id);
          resp.group_of_school_id = resp.group_of_school_id._id;
        }

        this.schoolForm.patchValue(resp);

        this.loadSchoolForm = this.schoolForm.value;
        this.isWaitingForResponse = false;
      }
    });
  }

  getAllRetakeSchool() {
    this.subs.sink = this.rncpTitleService.getFilteredAllSchool('').subscribe((schools) => {
      this.schools = schools;
      this.schools.sort((a, b) => {
        return (a && a.long_name ? a.long_name.toLowerCase() : '') > (b && b.long_name ? b.long_name.toLowerCase() : '') ? 1 : -1;
      });
    });
  }

  getAllGroupOfSchool() {
    this.subs.sink = this.schoolService.getAllGroupOfSchoolsDropdown().subscribe((resp) => {
      let temp = _.cloneDeep(resp);
      if (temp && temp.length) {
        temp = temp.sort((groupA, groupB) => {
          if (this.utilService.simplifyRegex(groupA.group_name) < this.utilService.simplifyRegex(groupB.group_name)) {
            return -1;
          } else if (this.utilService.simplifyRegex(groupA.group_name) > this.utilService.simplifyRegex(groupB.group_name)) {
            return 1;
          } else {
            return 0;
          }
        });
      }
      this.groups = temp;
      this.filteredGroupName = of(this.groups);

      this.subs.sink = this.groupControl.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
        if (typeof input === 'string') {
          const result = this.groups.filter((group) =>
            this.utilService.simplifyRegex(group.group_name).includes(this.utilService.simplifyRegex(input)),
          );

          this.filteredGroupName = of(result);
        }
      });
    });
  }

  setAutocompleteField() {
    // retake center autocomplete
    this.subs.sink = this.retakeCenterControl.valueChanges.pipe().subscribe((searchString) => {
      if (this.selectedRetakeCenter) {


        if (this.selectedRetakeCenter.long_name !== searchString) {
          this.schoolForm.get('retake_center').setValue(null);
          this.selectedRetakeCenter = null;
        }
      }
      this.subs.sink = this.rncpTitleService.getFilteredAllSchool(searchString).subscribe((schools) => {
        this.schools = schools;
        this.schools.sort((a, b) => {
          return a.long_name.toLowerCase() > b.long_name.toLowerCase() ? 1 : -1;
        });
      });
    });
  }

  selectRetakeCenter(event: MatAutocompleteSelectedEvent) {
    this.schoolForm.get('retake_center').setValue(event.option.value ? event.option.value._id : null);
    this.selectedRetakeCenter = event.option.value;
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const userType = this.CurUser.entities[0].type.name;
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

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);

    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  displayRetakeCenterName(school: SchoolDropdown): string {
    return school && school.long_name ? school.long_name : '';
  }

  displayGroupName(group): string {
    return group && group.group_name ? group.group_name : '';
    // if (this.groups && group_id) {
    //   const findGroup = this.groups.find((group) => group._id === group_id);
    //   return findGroup._group_name;
    // } else {
    //   return ''
    // }
  }

  filterCountry(addressIndex: number) {
    const searchString = this.addressFormArray.at(addressIndex).get('country').value.toLowerCase().trim();
    this.filteredCountry[addressIndex] = this.countries.filter((country) => country.toLowerCase().trim().includes(searchString));
  }

  getPostcodeData(addressIndex: number) {
    const country = this.addressFormArray.at(addressIndex).get('country').value;
    const postCode = this.addressFormArray.at(addressIndex).get('postal_code').value;

    if (postCode.length > 3 && country.toLowerCase() === 'france') {
      this.subs.sink = this.rncpTitleService.getFilteredZipCode(postCode, country).subscribe((resp) => {
        if (resp && resp.length) {
          this.setAddressDropdown(resp, addressIndex);

          this.addressFormArray.at(addressIndex).get('city').setValue(this.cities[addressIndex][0]);
          this.addressFormArray.at(addressIndex).get('department').setValue(this.departments[addressIndex][0]);
          this.addressFormArray.at(addressIndex).get('region').setValue(this.regions[addressIndex][0]);
        }
      });
    }
  }

  /*
   * @param resp: data from API call getFilteredZipCode()
   */
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

  filterCity(addressIndex: number) {
    const searchString = this.addressFormArray.at(addressIndex).get('city').value.toLowerCase().trim();
    this.filteredCities[addressIndex] = this.cities[addressIndex].filter((city) => city.toLowerCase().trim().includes(searchString));
  }

  filterDepartment(addressIndex: number) {
    const searchString = this.addressFormArray.at(addressIndex).get('department').value.toLowerCase().trim();
    this.filteredDepartments[addressIndex] = this.departments[addressIndex].filter((department) =>
      department.toLowerCase().trim().includes(searchString),
    );
  }

  filterRegion(addressIndex: number) {
    const searchString = this.addressFormArray.at(addressIndex).get('region').value.toLowerCase().trim();
    this.filteredRegions[addressIndex] = this.regions[addressIndex].filter((region) => region.toLowerCase().trim().includes(searchString));
  }

  setGroupOfSchool(groupId: string) {
    this.schoolForm.get('group_of_school_id').patchValue(groupId);
  }

  save() {
    this.isWaitingForResponse = true;

    // if (!this.retakeCenterControl.value) {
    //   this.isWaitingForResponse = false;
    //   this.markFormAsTouched();
    //   this.showSchool_S7();
    //   return;
    // }

    const temp = this.schoolForm.value;
    // validation for main address
    if (temp && temp.school_address && temp.school_address.length === 1) {
      this.addressFormArray.at(0).get('is_main_address').setValue(true);
    }

    if (this.schoolForm.valid) {
      if (this.isMainAddressSelected()) {
        if (this.schoolId) {
          // update operation
          this.subs.sink = this.schoolService.updateSchool(this.schoolId, this.schoolForm.value).subscribe(
            (resp) => {
              this.isWaitingForResponse = false;
              if (resp) {
                Swal.fire({ type: 'success', title: 'Bravo!' });
                this.loadSchoolForm = this.schoolForm.value;
              } else {
                this.showSchool_S7();
              }
            },
            (err) => {
              this.isWaitingForResponse = false;
              if (err['message'] === 'GraphQL error: Cannot create school with slash') {
                Swal.fire({
                  title: this.translate.instant('ADDTITLE_SZ.TITLE'),
                  text: this.translate.instant('ADDTITLE_SZ.TEXT'),
                  confirmButtonText: this.translate.instant('ADDTITLE_SZ.BUTTON'),
                  type: 'error',
                  allowOutsideClick: false,
                  footer: `<span style="margin-left: auto">ADDTITLE_SZ</span>`
                });
              } else if (err['message'] === 'GraphQL error: schoolExists') {
                this.showSwalS2();
              }
            },
          );
        } else {
          // create operation
          this.subs.sink = this.schoolService.createSchool(this.schoolForm.value).subscribe(
            (resp) => {
              this.isWaitingForResponse = false;
              if (resp) {
                Swal.fire({ type: 'success', title: 'Bravo!', allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false }).then(
                  (result) => {
                    this.loadSchoolForm = this.schoolForm.value;
                    this.router.navigate(['school']);
                    // this.router.navigate(['school', resp._id]);
                  },
                );
              } else {
                this.showSchool_S7();
              }
            },
            (err) => {
              this.isWaitingForResponse = false;
              if (err['message'] === 'GraphQL error: Cannot create school with slash') {
                Swal.fire({
                  title: this.translate.instant('ADDTITLE_SZ.TITLE'),
                  text: this.translate.instant('ADDTITLE_SZ.TEXT'),
                  confirmButtonText: this.translate.instant('ADDTITLE_SZ.BUTTON'),
                  type: 'error',
                  allowOutsideClick: false,
                  footer: `<span style="margin-left: auto">ADDTITLE_SZ</span>`
                });
              } else if (err['message'] === 'GraphQL error: schoolExists') {
                this.showSwalS2();
              }
            },
          );
        }
      } else {
        this.isWaitingForResponse = false;
        Swal.fire({
          title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S9.TITLE'),
          text: this.translate.instant('SCHOOL_SWAL.SCHOOL_S9.TEXT'),
          confirmButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S9.BUTTON'),
          type: 'error',
          allowOutsideClick: false,
          footer: `<span style="margin-left: auto">SCHOOL_S9</span>`
        });
      }
    } else {
      this.isWaitingForResponse = false;
      this.markFormAsTouched();
      this.showSchool_S7();
    }
  }

  showSwalS2() {
    return Swal.fire({
      title: this.translate.instant('School_S2.TITLE'),
      text: this.translate.instant('School_S2.TEXT', { school_short: this.schoolForm.get('short_name').value}),
      confirmButtonText: this.translate.instant('School_S2.BUTTON1'),
      type: 'error',
      allowOutsideClick: false,
      footer: `<span style="margin-left: auto">School_S2</span>`
    });
  }

  markFormAsTouched() {
    this.schoolForm.markAllAsTouched();
    // this.retakeCenterControl.markAllAsTouched();
  }

  chooseFile(fileInput: Event) {
    const file = (<HTMLInputElement>fileInput.target).files[0];
    this.isUploading = true;
    if (file) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          this.isUploading = false;
          if (resp) {
            this.schoolForm.get('logo').setValue(resp.s3_file_name);
          }
        },
        (err) => {

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    } else {
      this.isUploading = false;
    }
  }

  getImgURL() {
    const logo = this.schoolForm.get('logo').value;
    const result = this.serverimgPath + logo;
    return this.sanitizer.bypassSecurityTrustUrl(result);
  }

  connectRncpTitle() {
    this.subs.sink = this.dialog
      .open(ConnectTitleDialogComponent, {
        ...this.dialogConfig,
        panelClass: 'certification-rule-pop-up',
        data: {
          schoolId: this.schoolId,
          schoolCertifier: this.schoolData.certifier_ats
         },
      })
      .afterClosed()
      .subscribe((isSuccess) => {
        if (isSuccess) {
          this.getConnectedTitleTableData();
        }
      });
  }

  editConnectedRncpTitle(element: SchoolPreparationCenterAndCertifierTable) {
    this.subs.sink = this.dialog
      .open(EditConnectedTitleDialogComponent, {
        ...this.dialogConfig,
        panelClass: 'certification-rule-pop-up',
        data: {
          schoolId: this.schoolId,
          title: element,
        },
      })
      .afterClosed()
      .subscribe((isSuccess) => {
        if (isSuccess) {
          this.getConnectedTitleTableData();
        }
      });
  }

  removeConnectedRncpTitle(element: SchoolPreparationCenterAndCertifierTable) {

    if (element) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S11.TITLE'),
        html: this.translate.instant('SCHOOL_SWAL.SCHOOL_S11.TEXT', { shortName: element.short_name }),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S11.BUTTON_CONFIRM'),
        cancelButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S11.BUTTON_CANCEL'),
        footer: `<span style="margin-left: auto">SCHOOL_S11</span>`,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S11.BUTTON_CONFIRM') + ' (' + timeDisabled + ')';
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S11.BUTTON_CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((inputValue) => {
        clearTimeout(this.timeOutVal);
        if (inputValue.value) {
          this.isWaitingForResponse = true;
          const classId = element && element.class_id && element.class_id._id ? element.class_id._id : null;
          this.subs.sink = this.schoolService
            .removeConnectedTitleFromSchool(element._id, this.schoolId, classId, element.type[0])
            .subscribe((resp: any) => {
              this.isWaitingForResponse = false;
              if (resp && resp.data && resp.data.RemoveConnectedTitleFromSchool) {
                this.getConnectedTitleTableData();
                Swal.fire({ type: 'success', title: 'Bravo!' });
              } else {
                let errMsg = 'Error';
                if (resp && resp.errors && resp.errors[0] && resp.errors[0].message) {
                  errMsg = resp.errors[0].message;
                }
                if (errMsg === 'Error: Cannot disconnect school with title as there is user or student') {
                  Swal.fire({
                    type: 'error',
                    title: 'Error',
                    text: this.translate.instant('DISCONNECT_SCHOOL.ERROR_USER_STUDENT_TEXT'),
                    confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
                  });
                } else {
                  Swal.fire({
                    type: 'error',
                    title: 'Error',
                    text: errMsg,
                    confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
                  });
                }
              }
            });
        }
      });
    }
  }

  getConnectedTitleTableData() {
    this.isResetTableProcess = true;
    this.subs.sink = this.schoolService.getSchoolPreparationCenterAndCertifier(this.schoolId).subscribe(
      (resp) => {
        this.isResetTableProcess = false;

        this.originalConnectedTitleData = _.cloneDeep(this.tableDataReducer(resp));

        if (resp && resp.certifier_ats && resp.certifier_ats.length) {
          this.hasCertifier = true;
        } else {
          this.hasCertifier = false;
        }

        // only show data of title that owned by current logged in user
        if (!this.permissions.getPermission('ADMTC Admin') && !this.permissions.getPermission('ADMTC Director')) {
          this.rncpTitleService.getTitlesOfCurrentUser(this.schoolId).subscribe((titlesRes) => {


            let titles = _.cloneDeep(titlesRes);


            // *************** If user is chief group academic, they should be able to see all the title for the school.
            // however the user with chief group academic does not have title in the entity, so it should not filtering its title
            if (!this.permissions.getPermission('Chief Group Academic')) {
              this.originalConnectedTitleData = this.originalConnectedTitleData.filter((row) => {
                let isTitleExist = false;
                titles.forEach((title) => {
                  if (title.short_name === row.short_name) {
                    isTitleExist = true;
                  }
                });
                return isTitleExist;
              });
            }
            this.dataSource.data = this.originalConnectedTitleData;
            this.setFilterAndTableData();
            this.shortNameFilter.setValue('');
            this.longNameFilter.setValue('');
          });
        } else {
          this.dataSource.data = this.originalConnectedTitleData;
          this.setFilterAndTableData();
          this.shortNameFilter.setValue('');
          this.longNameFilter.setValue('');
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      },
      (error) => {
        this.isResetTableProcess = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: error && error['message'] ? error['message'] : error,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  setFilterAndTableData(longName?, shortName?) {
    let titleData;
    // let titleLongName;
    // let titleShortName;



    if ((shortName && shortName !== '') || (shortName && shortName !== '' && longName && longName !== '')) {
      titleData = this.originalConnectedTitleData.filter((data) => data.short_name.trim().includes(shortName.trim()));
    } else if (!shortName && longName) {
      titleData = this.originalConnectedTitleData.filter((data) => data.long_name.trim().includes(longName.trim()));
    } else {
      titleData = this.originalConnectedTitleData;
    }
    const titleDataClone = _.cloneDeep(titleData);

    this.uniqOriginalConnectedTitleDataShort = titleDataClone.filter(
      (data, index, self) => self.findIndex((title) => title.short_name.trim() === data.short_name.trim()) === index,
    );
    this.originalConnectedTitleDataLong = titleDataClone.filter(
      (title1, index, self) => self.findIndex((title2) => title2.long_name.trim() === title1.long_name.trim()) === index,
    );



    const getClasses = titleDataClone.map((titleData) => {
      if (titleData && titleData.class_id) {
        return titleData.class_id;
      }
    });

    const tempClasses = getClasses
      .filter((classData) => classData && classData.name)
      .sort((firstClass, secondClass) => {
        if (
          firstClass &&
          firstClass.name &&
          this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstClass.name)).toLowerCase() <
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondClass.name)).toLowerCase()
        ) {
          return -1;
        } else if (
          this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstClass.name)).toLowerCase() >
          this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondClass.name)).toLowerCase()
        ) {
          return 1;
        } else {
          return 0;
        }
      });



    this.uniqOriginalConnectedTitleDataLong = _.cloneDeep(this.originalConnectedTitleDataLong);
    this.originalClass = _.uniqBy(tempClasses, '_id');
    this.filteredClass = _.cloneDeep(this.originalClass);
    this.originalLongName = _.uniqBy(this.uniqOriginalConnectedTitleDataLong, 'long_name');
    this.filteredLongName = _.cloneDeep(this.originalLongName);
    this.dataSource.data = _.cloneDeep(this.originalConnectedTitleData);
    this.originalShortName = _.uniqBy(this.uniqOriginalConnectedTitleDataShort, 'short_name');
    this.filteredShortName = _.cloneDeep(this.originalShortName);
    this.initConnectedTitleFilter();
    this.dataSource.paginator = this.paginator;
  }

  /*
   * @param data: come from getSchoolPreparationCenterAndCertifier in school service
   * description: reshape the data to make it match SchoolPreparationCenterAndCertifierTable array
   */
  tableDataReducer(tempData): SchoolPreparationCenterAndCertifierTable[] {
    const tableData: SchoolPreparationCenterAndCertifierTable[] = [];
    const data = _.cloneDeep(tempData);

    // data.preparation_center_ats = _.uniqBy(data.preparation_center_ats, 'rncp_title_id');
    data.preparation_center_ats = _.uniqBy(data.preparation_center_ats, (item) => JSON.stringify([item.class_id, item.rncp_title_id]));

    // add certifier_ats to the tableData array
    // if (data.certifier_ats && data.certifier_ats.length) {
    //   let titleData: SchoolPreparationCenterAndCertifierTable;
    //   data.certifier_ats.forEach((title) => {
    //     titleData = {
    //       ...title,
    //       type: ['certifier'],
    //     };
    //     tableData.push(titleData);
    //     titleData = null;
    //   });
    // }

    // add preparation_center_ats to the tableData array
    if (data.preparation_center_ats && data.preparation_center_ats.length) {
      let titleData: SchoolPreparationCenterAndCertifierTable;
      data.preparation_center_ats.forEach((title) => {
        if (title.rncp_title_id) {
          // Check if there is a CR for same PC first
          const foundIndex = tableData.findIndex(
            (tableTitle) =>
              tableTitle &&
              title &&
              title.rncp_title_id &&
              title.class_id &&
              tableTitle.class_id &&
              tableTitle._id &&
              tableTitle._id === title.rncp_title_id._id &&
              tableTitle.class_id._id === title.class_id._id,
          );

          if (tableData[foundIndex]) {

            tableData[foundIndex].type.push('preparation_center');
            tableData[foundIndex].type = _.uniq(tableData[foundIndex].type);
            if (title.selected_specializations && title.selected_specializations.length) {
              title.selected_specializations.forEach((spec) => {
                tableData[foundIndex].specializations.push(spec);
              });
            }
            titleData = null;
          } else {
            // If not then push new entry

            titleData = {
              ...title.rncp_title_id,
              type: ['preparation_center'],
              specializations: [],
              class_id: title.class_id,
            };
            if (title.selected_specializations && title.selected_specializations.length) {
              title.selected_specializations.forEach((spec) => {
                titleData.specializations.push(spec);
              });
            }
            tableData.push(titleData);
            titleData = null;
          }
        }
      });
    }

    return tableData;
  }

  resetFilter() {
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sort.direction = '';
    this.sort.active = '';
    this.shortNameFilter.setValue('');
    this.longNameFilter.setValue('');
    this.classFilter.setValue('');
    this.specializationFilter.setValue('');
    this.connectedAsFilter.setValue('');
    this.filteredValues = {
      shortName: '',
      longName: '',
      specialization: '',
      connectedAs: '',
      className: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.getConnectedTitleTableData();
  }

  initConnectedTitleFilter() {
    this.subs.sink = this.shortNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((name) => {
      this.filteredShortName = this.uniqOriginalConnectedTitleDataShort
        .filter((title) =>
          this.utilService
            .simpleDiacriticSensitiveRegex(title.short_name)
            .trim()
            .toLowerCase()
            .includes(this.utilService.simpleDiacriticSensitiveRegex(name).trim().toLowerCase()),
        )
        .sort((firstTitle, secondTitle) => {
          if (
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
          ) {
            return -1;
          } else if (
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
          ) {
            return 1;
          } else {
            return 0;
          }
        });

      // this.filteredValues.shortName = name;
      // this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.longNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((name) => {



      this.filteredLongName = this.uniqOriginalConnectedTitleDataLong
        .filter(
          (title) =>
            title &&
            this.utilService
              .simpleDiacriticSensitiveRegex(title.long_name)
              .trim()
              .toLowerCase()
              .includes(this.utilService.simpleDiacriticSensitiveRegex(name).trim().toLowerCase()),
        )
        .sort((firstTitle, secondTitle) => {
          if (
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.long_name)).toLowerCase() <
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.long_name)).toLowerCase()
          ) {
            return -1;
          } else if (
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.long_name)).toLowerCase() >
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.long_name)).toLowerCase()
          ) {
            return 1;
          } else {
            return 0;
          }
        });
      // this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.classFilter.valueChanges.pipe(debounceTime(400)).subscribe((name) => {



      this.filteredClass = this.originalClass.filter(
        (classData) =>
          classData &&
          this.utilService
            .simpleDiacriticSensitiveRegex(classData.name)
            .trim()
            .toLowerCase()
            .includes(this.utilService.simpleDiacriticSensitiveRegex(name).trim().toLowerCase()),
      );

      // this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.specializationFilter.valueChanges.subscribe((spec) => {
      this.filteredValues.specialization = spec;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.connectedAsFilter.valueChanges.subscribe((conn) => {
      this.filteredValues.connectedAs = conn;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    // this.shortNameFilter.setValue(' ');
    // this.longNameFilter.setValue('');
    this.dataSource.filterPredicate = this.customFilterPredicate();
    this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
  }

  setShortNameFilter(name: string) {
    if (name === '') {
      this.longNameFilter.setValue('');
      this.classFilter.setValue('');
      this.filteredValues.longName = '';
      this.filteredValues.className = '';
    }
    this.filteredValues.shortName = name;

    this.dataSource.filter = JSON.stringify(this.filteredValues);

    this.setFilterAndTableData(this.filteredValues.longName, this.filteredValues.shortName);
  }

  setLongNameFilter(name: string) {
    const shortName = this.filteredValues.shortName;
    this.filteredValues.longName = name;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.setFilterAndTableData(name, shortName);
  }

  setClassFilter(name: string) {
    this.filteredValues.className = name;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  customFilterPredicate() {
    return function (data: SchoolPreparationCenterAndCertifierTable, filter: string): boolean {
      const searchString: Filter = JSON.parse(filter);

      const shortNameFound = data.short_name
        ? data.short_name.toString().trim().toLowerCase().indexOf(searchString.shortName.trim().toLowerCase()) !== -1
        : // dont show this row when user type in shortName filter but the rncp title has no short_name
        searchString.shortName.length
        ? false
        : true;

      const longnameFound = data.long_name
        ? data.long_name.toString().trim().toLowerCase().indexOf(searchString.longName.trim().toLowerCase()) !== -1
        : // dont show this row when user type in longName filter but the rncp title has no long_name
        searchString.longName.length
        ? false
        : true;

      const classFound =
        data && data.class_id && data.class_id.name
          ? data.class_id.name.toString().trim().toLowerCase().indexOf(searchString.className.trim().toLowerCase()) !== -1
          : // dont show this row when user type in longName filter but the rncp title has no className
          searchString.className.length
          ? false
          : true;

      const specializationFound =
        data.specializations && data.specializations.length
          ? data.specializations.find((spec) => spec.name.toLowerCase().indexOf(searchString.specialization.toLowerCase()) !== -1)
            ? true
            : false
          : // dont show this row when user type in specialization filter but the rncp title has no specializations
          searchString.specialization.length
          ? false
          : true;

      const connectedAsFound =
        searchString.connectedAs.toLowerCase() !== 'all'
          ? data.type.find((type) => type.toLowerCase().indexOf(searchString.connectedAs.toLowerCase()) !== -1)
            ? true
            : false
          : true;

      return shortNameFound && longnameFound && specializationFound && connectedAsFound && classFound;
    };
  }

  sortConnectedTitle(sort: Sort) {

    const connectedTitle = _.cloneDeep(this.originalConnectedTitleData);
    if (!sort.active || sort.direction === '') {
      this.getConnectedTitleTableData();
      return;
    }
    const tempData = connectedTitle.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'short_name':
          return compare(
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(a.short_name)),
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(b.short_name)),
            isAsc,
          );
        case 'long_name':
          return compare(
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(a.long_name)),
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(b.long_name)),
            isAsc,
          );
        case 'class':
          return compare(
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(a && a.class_id ? a.class_id.name : '')),
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(b && b.class_id ? b.class_id.name : '')),
            isAsc,
          );
        default:
          return 0;
      }
    });

    // this.dataSource.data = [];
    this.dataSource.data = tempData;
    this.table.renderRows();
    // this.dataSource.connect().next(tempData);


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
  // *************** Function to check main address
  checkingMainAddress(event: MatSlideToggleChange) {
    if (event && event.checked) {
      this.isMainAddressSelectedd = true;
    } else {
      this.isMainAddressSelectedd = false;
    }
  }

  userTypeChecking() {
    const entityData = _.filter(this.CurUser.entities, function (entity) {
      return (
        entity.type.name === 'Academic Director' ||
        entity.type.name === 'Academic Admin' ||
        entity.type.name === 'PC School Director' ||
        entity.type.name === 'Certifier Admin' ||
        entity.type.name === 'CR School Director' ||
        entity.type.name === 'Chief Group Academic'
      );
    });

    if (entityData && entityData.length) {
      this.isEditable = false;
    } else {
      this.isEditable = true;
    }
  }

  saveButtonValidation() {
    let result = false;
    if (this.loadSchoolForm && this.schoolForm && !_.isEqual(this.loadSchoolForm, this.schoolForm.value)) {

      result = true;
      return result;
    }
    return result;
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

  // SWAL for School
  showSchool_S7() {
    return Swal.fire({
      type: 'error',
      title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S7.TITLE'),
      text: this.translate.instant('SCHOOL_SWAL.SCHOOL_S7.TEXT'),
      confirmButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S7.BUTTON'),
      footer: `<span style="margin-left: auto">SCHOOL_S7</span>`,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
  }

  getValueRetake() {
    const data = this.retakeCenterControl.value;
    if (data && data.length && !data.replace(/\s/g, '').length) {
      this.retakeCenterControl.setValue('');
    }
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

  deleteLogo() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DELETE_LOGO.TITLE'),
      text: this.translate.instant('DELETE_LOGO.TEXT'),
      type: 'warning',
      footer: `<span style="margin-left: auto">DELETE_LOGO</span>`,
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
        this.schoolForm.get('logo').setValue('');
        Swal.fire({ type: 'success', title: 'Bravo!' });
      }
    });
  }

  tooltipSpecialization(data) {
    if (data && data.length) {
      const specName = data.map(data => data.name);
      return specName ? specName.join(',') : null;
    }
  }

  showSaveButton() {
    return this.permissionService.showBtnSaveAddSchoolPerm();
  }

  showAddAddressButton() {
    return this.permissionService.showBtnAddAddressAddSchoolPerm();
  }

  showAddButtonLogo() {
    return this.permissionService.showBtnAddLogoAddSchoolPerm();
  }

  ngOnDestroy() {
    clearInterval(this.intVal);
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}

// if returns greater than 0, sort b to an index lower than a
function compare(a: string, b: string, isAsc: boolean) {
  return (a.toLowerCase() < b.toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
}
