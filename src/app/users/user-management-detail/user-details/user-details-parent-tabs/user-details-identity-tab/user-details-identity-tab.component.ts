import { NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from './../../../../../service/auth-service/auth.service';
import { UserService } from 'app/service/user/user.service';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { StudentsService } from 'app/service/students/students.service';
import * as moment from 'moment';
import { CustomValidators } from 'ng2-validation';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { ApplicationUrls } from 'app/shared/settings';
import { UtilityService } from 'app/service/utility/utility.service';
import { CoreService } from 'app/service/core/core.service';
import { FlexAlignStyleBuilder } from '@angular/flex-layout';
import { debounceTime } from 'rxjs/operators';
import { CompanyService } from 'app/service/company/company.service';
import { interval, PartialObserver, Subject, Observable } from 'rxjs';

@Component({
  selector: 'ms-user-details-identity-tab',
  templateUrl: './user-details-identity-tab.component.html',
  styleUrls: ['./user-details-identity-tab.component.scss'],
})
export class UserDetailsIdentityTabComponent implements OnInit, OnChanges, OnDestroy {
  @Input() userId: string;
  @Input() status: string;
  @Output() reloadData: EventEmitter<boolean> = new EventEmitter();
  private subs = new SubSink();

  identityForm: UntypedFormGroup;
  nationalitiesList = [];
  nationalList = [];
  nationalitySelected: string;
  @ViewChild('swalMentS4Ref', { static: true }) swalMentS4Ref: any;
  @ViewChild('userphoto', { static: false }) uploadInput: any;
  @ViewChild('fileUpload', { static: false }) uploadFileInput: any;

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
  timer: Observable<number>;
  timerObserver: PartialObserver<number>;
  initialForm: UntypedFormGroup;

  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  neutralStudentIcon = '../../../../../assets/img/student_icon_neutral.png';
  private intVal: any;
  private timeOutVal: any;

  firstForm: any;
  isFileUploading: boolean = false;
  isMainAddressSelected: boolean = false;

  currentUser: any;
  user: any
  isDisplayActionBtn: boolean = true
  isDisabled = true;
  tempEmail: any;
  isSubmit = true;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isUserAdmtc = false;
  nameMentor:any;
  mentorData:any;
  isMentorDeactivated: any;
  currentCompanyName: any;
  entityData: any;
  acadDirSchoolId: string | null = null;
  currentUserTypeId: string;
  currentCompanyId: any;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private studentService: StudentsService,
    private rncpTitleService: RNCPTitlesService,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private schoolService: SchoolService,
    public permissionService: PermissionService,
    private dateAdapter: DateAdapter<Date>,
    private pageTitleService: PageTitleService,
    private userService: UserService,
    private utilService: UtilityService,
    public coreService: CoreService,
    private authService: AuthService,
    private ngxPermissionService: NgxPermissionsService,
    private companyService: CompanyService,
  ) { }

  ngOnInit() {
    this.countries = this.schoolService.getCountries();
    this.nationalitiesList = this.studentService.getNationalitiesList();
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.firstForm = null
    this.today = new Date();
    this.initForm();
    this.currentUser = this.authService.getLocalStorageUser();

    this.isUserAcadir = !!this.ngxPermissionService.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.ngxPermissionService.getPermission('Academic Admin');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();

    if(this.isUserAcadAdmin || this.isUserAcadir) {      
      this.keyupEmail();
    } else {
      this.isSubmit = false;
    }

    this.currentUserTypeId = this.currentUser.entities.find((entity) => entity.type.name === this.authService.getPermission()[0])?.type?._id;
    if (this.isUserAcadAdmin || this.isUserAcadir) {
      this.entityData = this.currentUser.entities.find(
        (entity) => entity.type.name === 'Academic Director' || entity.type.name === 'Academic Admin',
      );
      this.acadDirSchoolId = this.entityData?.school?._id;
    }
  }

  ngOnChanges() {
    this.resetData();
    this.initForm();
    this.isDisplayActionBtn = true
    this.getOneUser()
    this.nationalitiesList = this.studentService.getNationalitiesList();
  }

  displayAllActionBtn() {
    // if user type not admtc, hide action button for my own account in table so I cant delete or edit my own account
    if (
      this.userId === this.currentUser._id &&
      !this.ngxPermissionService.getPermission('ADMTC Admin') &&
      !this.ngxPermissionService.getPermission('ADMTC Director')
    ) {
      this.isDisplayActionBtn = false;
    }
    // if I am certifier admin, I cant edit or delete CR school dir
    if (this.ngxPermissionService.getPermission('Certifier Admin')) {
      const CRSchoolDirId = '5a2e1ecd53b95d22c82f954f';
      this.user.entities.forEach((entity) => {
        if (entity.type && entity.type._id && entity.type._id === CRSchoolDirId) {
          this.isDisplayActionBtn = false;
        }
      });
    }
  }


  getOneUser() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getOneUserCard(this.userId, this.status).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.user = resp
        this.displayAllActionBtn()
        this.firstForm = null

        resp.last_name = resp.last_name.toUpperCase()
        if (resp && resp.address && resp.address.length) {
          for (const add of resp.address) {
            // add address form if current number of address form is less than the user's number of addresses
            if (this.user_addresses.length < resp.address.length) {
              this.addAddress();
            }
            // check if any of the addresses is main address
            if (add.is_main_address) {
              this.isMainAddressSelected = true;
            }
          }
        } else {
          if(this.identityForm.get('address').value.length === 0){
            this.addAddress();
          }
        }
        if (resp.profile_picture) {
          this.photo = resp.profile_picture;
          this.photo_s3_path = resp.profile_picture;
          this.is_photo_in_s3 = true;
        } else {
          this.photo = '';
          this.photo_s3_path = '';
          this.is_photo_in_s3 = false;
        }
        this.identityForm.patchValue(resp);
        this.tempEmail = this.identityForm.get('email').value;
        this.firstForm = this.identityForm.value;
        this.identityForm.valueChanges.subscribe(resp => {
          setTimeout(() => {

            this.isFormSame()
          }, 300);
        })
      },
      (error) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  isFormSame() {
    const tempForm = JSON.stringify(this.firstForm);
    const identForm = JSON.stringify(this.identityForm.value);
    if (tempForm === identForm) {
      this.userService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.userService.childrenFormValidationStatus = false;
      return false;
    }
  }

  getAutomaticHeight() {
    if (this.router.url === '/my-file' || this.router.url.includes('previous-course')) {
      this.myInnerHeight = window.innerHeight - 193;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 369;
      return this.myInnerHeight;
    }
  }

  resetData() {
    this.firstForm = null
  }

  initForm() {
    this.identityForm = this.fb.group({
      civility: [null, Validators.required],
      first_name: [null, Validators.required],
      last_name: [null, Validators.required],
      office_phone: [null, [Validators.maxLength(13)]],
      portable_phone: [null, [Validators.maxLength(13)]],
      email: [null, [Validators.required, CustomValidators.email]],
      position: [null],
      profile_picture: [null],
      address: this.fb.array([]),
      curriculum_vitae: this.fb.group({
        s3_path: [''],
        file_path: [''],
        name: [''],
      }),
    });
  }

  initUserAddressFormGroup() {
    return this.fb.group({
      address: [null],
      postal_code: [null],
      country: [null],
      city: [null],
      department: [null],
      region: [null],
      is_main_address: [null],
    });
  }

  get user_addresses() {
    return this.identityForm.get('address') as UntypedFormArray;
  }

  addAddress() {
    this.user_addresses.push(this.initUserAddressFormGroup());
  }

  getPostcodeData(arrayIndex: number) {
    const arrayRef = this.user_addresses.at(arrayIndex);

    if (!arrayRef) {
      return;
    }
    const country = arrayRef.get('country').value;
    const postCode = arrayRef.get('postal_code').value;

    if (postCode && country && postCode.length > 3 && country.toLowerCase() === 'france') {
      this.subs.sink = this.rncpTitleService.getFilteredZipCode(postCode, country).subscribe((resp) => {
        if (resp && resp.length) {
          this.setAddressDropdown(resp, arrayIndex);
          arrayRef.get('city').setValue(this.cities[arrayIndex][0]);
          arrayRef.get('department').setValue(this.departments[arrayIndex][0]);
          arrayRef.get('region').setValue(this.regions[arrayIndex][0]);
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

  filterCountry(arrayIndex: number) {
    if (!this.user_addresses.at(arrayIndex).get('country').value) {
      return;
    }
    const searchString = this.user_addresses.at(arrayIndex).get('country').value.toLowerCase().trim();
    this.filteredCountry[arrayIndex] = this.countries.filter((country) => country && country.toLowerCase().trim().includes(searchString));
  }

  filterCity(arrayIndex: number) {
    if (this.cities[arrayIndex] && this.cities[arrayIndex].length && this.user_addresses.at(arrayIndex).get('city').value) {
      const searchString = this.user_addresses.at(arrayIndex).get('city').value.toLowerCase().trim();
      this.filteredCities[arrayIndex] = this.cities[arrayIndex].filter((city) => city && city.toLowerCase().trim().includes(searchString));
    }
  }

  filterDepartment(arrayIndex: number) {
    if (this.departments[arrayIndex] && this.departments[arrayIndex].length && this.user_addresses.at(arrayIndex).get('department').value) {
      const searchString = this.user_addresses.at(arrayIndex).get('department').value.toLowerCase().trim();
      this.filteredDepartments[arrayIndex] = this.departments[arrayIndex].filter(
        (department) => department && department.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterRegion(arrayIndex: number) {
    if (this.regions[arrayIndex] && this.regions[arrayIndex].length && this.user_addresses.at(arrayIndex).get('region').value) {
      const searchString = this.user_addresses.at(arrayIndex).get('region').value.toLowerCase().trim();
      this.filteredRegions[arrayIndex] = this.regions[arrayIndex].filter(
        (region) => region && region.toLowerCase().trim().includes(searchString),
      );
    }
  }

  openUploadWindow() {
    this.uploadInput.nativeElement.click();
  }

  handleFileInputChange(fileInput: Event) {
    const acceptable = ['pdf'];
    if ((<HTMLInputElement>fileInput.target).files.length > 0) {
      const file = (<HTMLInputElement>fileInput.target).files[0];
      const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
      if (acceptable.includes(fileType)) {
        this.isFileUploading = true;
        this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
          (resp) => {
            this.isFileUploading = false;
            if (resp) {
              this.identityForm.get('curriculum_vitae').get('s3_path').setValue(resp.s3_file_name);
              this.identityForm.get('curriculum_vitae').get('file_path').setValue(resp.file_url);
            }
          },
          (err) => {
            this.isFileUploading = false;
            Swal.fire({
              type: 'error',
              title: 'Error !',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((res) => {

            });
          },
        );
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
          text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.pdf' }),
          footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
          allowEscapeKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
        });
      }
    }
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
            this.identityForm.get('profile_picture').setValue(resp.s3_file_name);
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

  createPayload() {
    const payload = _.cloneDeep(this.identityForm.value);
    payload.last_name = payload.last_name.toUpperCase()
    return payload;
  }

  async updateUser() {
    if (! await this.checkFormValidity()) {
      return;
    }
    this.isWaitingForResponse = true;
    const payload = this.createPayload();
    this.subs.sink = this.userService.updateUser(this.userId, payload).subscribe((res) => {
      if (res) {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo!'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((resp) => {
          if (resp.value) {
            this.getOneUser();
          }
        });
      }
    }, (err) => {
      this.isWaitingForResponse = false;
      if (err['message'] === 'GraphQL error: Email Exist') {                 
          Swal.fire({
            title: this.translate.instant('USER_S16.TITLE'),
            html: this.translate.instant('USER_S16.TEXT'),
            type: 'error',
            footer: `<span style="margin-left: auto">USER_S16</span>`,
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USER_S16.OK'),
          });         
      } else if (err['message'] === 'GraphQL error: user was already created but the status is deleted') {
        Swal.fire({
          title: this.translate.instant('USERCREATE_S1.TITLE'),
          html: this.translate.instant('USERCREATE_S1.TEXT'),
          footer: `<span style="margin-left: auto">USERCREATE_S1</span>`,
          type: 'warning',
          showConfirmButton: true,
          confirmButtonText: this.translate.instant('USERCREATE_S1.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('USERCREATE_S1.BUTTON_2'),
          width: '500px',
        }).then((isConfirm) => {
          if (isConfirm.value) {


            this.subs.sink = this.userService.registerUserExisting(payload).subscribe(
              (resp) => {
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('USER_S9.TITLE'),
                  text: this.translate.instant('USER_S9.TEXT', {
                    civility: this.translate.instant(resp.civility),
                    lastName: resp.first_name,
                    firstName: resp.last_name,
                  }),
                  footer: `<span style="margin-left: auto">USER_S9</span>`,
                  confirmButtonText: this.translate.instant('USER_S9.OK'),
                });
                this.isWaitingForResponse = false;
              }
            );
          } else {
            return 1;
          }
        });
        // this.getDataUser();
      } else if (err['message'].includes('GraphQL error: this email is not valid') || err['message'].includes('Invalid Email')) {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('usermailvalidation_S1.TITLE'),
          html: this.translate.instant('usermailvalidation_S1.Text'),
          confirmButtonText: this.translate.instant('usermailvalidation_S1.BUTTON 1'),
          footer: `<span style="margin-left: auto">usermailvalidation_S1</span>`,
        }).then(() => {
          this.getOneUser();
        });
      }
    });
  }

  async checkFormValidity(): Promise<boolean> {
    if (this.identityForm.invalid) {
      const action = await Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
        footer: `<span style="margin-left: auto">Invalid_Form_Warning</span>`,
      });
      this.markAllFieldsAsTouched(this.identityForm);
      return false;
    } else {
      return true;
    }
  }

  // make all field as touched so error can show
  markAllFieldsAsTouched(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.markAllFieldsAsTouched(control);
      } else if (control instanceof UntypedFormArray) {
        for (let childControl of control.controls) {
          childControl.markAllAsTouched();
        }
      }
    });
  }

  addAddressForm() {
    this.addAddress();
    this.filteredCountry.push(this.countries);
    this.cities.push([]);
    this.regions.push([]);
    this.departments.push([]);
  }

  removeAddressForm(addressIndex: number) {
    let timeDisabled = 3;
    Swal.fire({
      title: this.translate.instant('USERMODIFY_S1.TITLE'),
      html: this.translate.instant('DELETE_STUDENT_ADDRESS'),
      type: 'warning',
      footer: `<span style="margin-left: auto">USERMODIFY_S1</span>`,
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        const confirmBtnRef = Swal.getConfirmButton();
        confirmBtnRef.setAttribute('disabled', '');
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          confirmBtnRef.removeAttribute('disabled');
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.user_addresses.removeAt(addressIndex);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          footer: `<span style="margin-left: auto">EVENT_S1</span>`,
        });
      }
    });
  }

  checkMainAddress(event: MatSlideToggleChange) {
    if (event && event.checked) {
      this.isMainAddressSelected = true;
    } else {
      this.isMainAddressSelected = false;
    }
  }

  checkComparison() {
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.identityForm.getRawValue());
    if (firstForm === form) {
      return true;
    } else {
      return false;
    }
  }

  deleteCV() {
    this.identityForm.get('curriculum_vitae').get('s3_path').setValue(null, { emitEvent: false });
    this.identityForm.get('curriculum_vitae').get('file_path').setValue(null, { emitEvent: false });
    this.identityForm.get('curriculum_vitae').get('name').setValue(null, { emitEvent: false });
  }

  keyupEmail() {
    this.subs.sink = this.identityForm
      .get('email')
      .valueChanges.pipe(debounceTime(200))
      .subscribe((search: any) => {
        if (search && search.length >= 3) {
          this.isDisabled = false;
          if (this.tempEmail && this.tempEmail === search) {
            this.isSubmit = false;
            this.isDisabled = true;
          } else {
            this.isSubmit = true;
            this.isDisabled = false;
          }
        } else {
          this.isDisabled = true;
        }
      });
  }

  validateEmail() {
    this.isWaitingForResponse = true;
    const email = this.identityForm.get('email').value;
    this.subs.sink = this.userService.getUserByEmail(email).subscribe(resp => {
      this.isWaitingForResponse = false;
      const isMentor = resp?.entities.some(entity => entity?.type?.name === 'Mentor')
      if(isMentor) {
        const companyId = resp.entities?.find(entity => entity?.entity_name === 'company' && entity?.companies?.length)?.companies[0]?._id;
        
        this.subs.sink = this.companyService.validateEmailMentor(email, companyId, this.acadDirSchoolId).subscribe(
          (resp) => {
            if (resp?.email_message === 'email is not valid') {
              Swal.fire({
                title: this.translate.instant('usermailvalidation_S1.TITLE'),
                html: this.translate.instant('usermailvalidation_S1.Text'),
                type: 'warning',
                footer: `<span style="margin-left: auto">usermailvalidation_S1</span>`,
                confirmButtonText: this.translate.instant('usermailvalidation_S1.BUTTON 1'),
              }).then(() => this.validateMessageCase(resp));
            } else {
              this.validateMessageCase(resp);
            }
          },
          (err) => {            
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
    
          },
        );
      } else if(resp){
        Swal.fire({
          title: this.translate.instant('USER_S16.TITLE'),
          html: this.translate.instant('USER_S16.TEXT'),
          type: 'error',
          footer: `<span style="margin-left: auto">USER_S16</span>`,
          showConfirmButton: true,
          confirmButtonText: this.translate.instant('USER_S16.OK'),
        })
      } else {
        Swal.fire({
          type: 'success',
          title: 'Bravo !',            
          confirmButtonText: this.translate.instant('TUTORIAL_UPDATE.BUTTON'),
        }).then(() => {
          this.isSubmit = false;
          this.isDisabled = true;
        })
      }
    })
    
  }

  validateMessageCase(resp) {
    const msg = String(resp?.message)    

    if (resp.mentor !== null) {
      this.mentorData = _.omitBy(_.cloneDeep(resp?.mentor), _.isNil)
      this.nameMentor = [this.translate.instant(resp.mentor?.civility), resp.mentor?.first_name, resp.mentor?.last_name].filter(Boolean).join(' ')
      this.isMentorDeactivated = resp.mentor?.status === 'deleted'
      this.currentUser = _.cloneDeep(this.mentorData)
      this.currentCompanyName = this.mentorData?.entities?.find(entity => entity?.entity_name === 'company' && entity?.companies?.length)?.companies[0]?.company_name || ''
      this.currentCompanyId = this.mentorData?.entities?.find(entity => entity?.entity_name === 'company' && entity?.companies?.length)?.companies[0]?._id || ''
    }

    this.isWaitingForResponse = false;
    if (msg.includes('case 1')) {
      // Case 1: Mentor Active and already connect to the same company but in different school
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.swalMent1()
      } 
    } else if (msg.includes('case 2')) {
      // Case 2: Mentor Active and already connect to the different company
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        // new_ment_s4 uses ngx-sweetalert2
        this.subs.sink = this.timer.subscribe(this.timerObserver);
        this.swalMentS4Ref.show();
      } 
    } else if (msg.includes('case 3')) {
      // Case 3: Mentor Active and already connect to the same company + connect to the same school
      Swal.fire({
        title: this.translate.instant('USER_S16.TITLE'),
        html: this.translate.instant('USER_S16.TEXT'),
        type: 'error',
        footer: `<span style="margin-left: auto">USER_S16</span>`,
        showConfirmButton: true,
        confirmButtonText: this.translate.instant('USER_S16.OK'),
      })
    } else if (msg.includes('case 4')) {
      // Case 4: Email not registered on the platform
      Swal.fire({
        type: 'success',
        title: 'Bravo!',
        html: this.translate.instant('EMAIL_VALID'),
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        allowOutsideClick: false,
      }).then(() => {
        this.isSubmit = false;
        this.isDisabled = true;
      })
    } else if (msg.includes('case 5')) {
      // Case 5: Email of active user outside mentor but already registered on the platform as user non-mentor
      Swal.fire({
        title: this.translate.instant('USER_S16.TITLE'),
        html: this.translate.instant('USER_S16.TEXT'),
        type: 'error',
        footer: `<span style="margin-left: auto">USER_S16</span>`,
        showConfirmButton: true,
        confirmButtonText: this.translate.instant('USER_S16.OK'),
      })
    }
  }

  swalMent1() {
    this.isWaitingForResponse = false;
    Swal.fire({
      title: this.translate.instant('NEW_MENT_S1.TITLE'),
      html: this.translate.instant('NEW_MENT_S1.TEXT', {
        nameMentor: this.nameMentor,
      }),
      type: 'warning',
      footer: `<span style="margin-left: auto">NEW_MENT_S1</span>`,
      confirmButtonText: this.translate.instant('NEW_MENT_S1.BUTTON1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('NEW_MENT_S1.BUTTON2'),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.subs.sink = this.companyService.connectSchoolToCompany(this.currentCompanyId, [this.acadDirSchoolId]).subscribe((resp) => {
          if (resp) {
            this.isWaitingForResponse = true;
            this.subs.sink = this.companyService
              .connectSchoolToMentor(this.currentUserTypeId, this.mentorData?._id, this.currentCompanyId, [this.acadDirSchoolId])
              .subscribe((resp) => {
                this.isWaitingForResponse = false;
                Swal.fire({
                  type: 'success',
                  title: 'Bravo !',
                  confirmButtonText: this.translate.instant('TUTORIAL_UPDATE.BUTTON'),
                }).then(() => {
                  window.open(`./users/user-management-detail/?userId=${this.mentorData?._id}&isFromActiveUserTab=true`, 'blank');
                });
              });
          }
        });
      }
    });
  }

  swalMent4() {
    Swal.close();   
    this.subs.sink = this.companyService.connectSchoolToCompany(this.currentCompanyId, [this.acadDirSchoolId]).subscribe(resp => {
      if(resp) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.companyService.connectSchoolToMentor(this.currentUserTypeId,this.mentorData?._id,this.currentCompanyId,[this.acadDirSchoolId]).subscribe(resp => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('USER_UPDATED.TITLE'),
            text: this.translate.instant('USER_UPDATED.TEXT'),
            confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
            footer: `<span style="margin-left: auto">USER_UPDATED</span>`,
          }).then(() => {
            window.open(`./users/user-management-detail/?userId=${this.mentorData?._id}&isFromActiveUserTab=true`, '_blank');
          })
        })
      }
    })        
  }  

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
