import { AfterViewChecked, AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CompanyService } from 'app/service/company/company.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-add-company-dialog',
  templateUrl: './add-company-dialog.component.html',
  styleUrls: ['./add-company-dialog.component.scss'],
})
export class AddCompanyDialogComponent implements OnInit, OnDestroy {
  @ViewChild('siretNumber', { static: false }) siretInput: ElementRef;
  private subs = new SubSink();
  isWaitingForResponse = false;
  countries = [];
  countriesList = [];
  addCompanyFrance: UntypedFormGroup;
  addCompanyNotFrance: UntypedFormGroup;
  companyClicked: boolean = false;
  selectedCountry = 'France';
  isUserAcadir;
  isUserAcadAdmin;
  isUserAdmtc;
  CurUser;
  entityData;
  caseMessage;

  timeInterval;
  timeOut;

  companyBySiretData;

  companyNonFranceData;

  constructor(
    private fb: UntypedFormBuilder,
    private companyService: CompanyService,
    private permission: NgxPermissionsService,
    private CurUserService: AuthService,
    private dialogRef: MatDialogRef<AddCompanyDialogComponent>,
    private translate: TranslateService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.initCompanyFranceForm();
    this.subs.sink = this.companyService.getCountry().subscribe((list: any[]) => {
      this.countries = list;
      this.countriesList = list;
    });
    this.addCompanyFrance.get('country').patchValue('France');

    // *************** Cek User Type & Permission Access User to Company Data
    this.isUserAcadir = !!this.permission.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permission.getPermission('Academic Admin');
    this.isUserAdmtc = !!this.permission.getPermission('ADMTC Admin') || !!this.permission.getPermission('ADMTC Director');
    this.CurUser = this.CurUserService.getLocalStorageUser();
    if (this.isUserAcadir) {
      this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');
    } else if (this.isUserAcadAdmin) {
      this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Admin');
    }
  }

  initCompanyFranceForm() {
    this.addCompanyFrance = this.fb.group({
      country: ['', Validators.required],
      no_RC: ['', Validators.required],
      company_name: [''],
      postal_code: [''],
      activity: [''],
      address: [''],
    });
  }

  initCompanyNonFranceForm() {
    this.addCompanyNotFrance = this.fb.group({
      country: ['', Validators.required],
      no_RC: ['', Validators.required],
      zip_code: ['', Validators.required],
      company_name: ['', Validators.required],
      type_of_company: ['', Validators.required],
      activity: ['', Validators.required],
      no_of_employee_in_france: ['', Validators.required],
    });
  }

  countrySelected(event) {
    if (event.value !== 'France') {
      if (this.addCompanyFrance) {
        this.addCompanyFrance.reset();
      }
      this.initCompanyNonFranceForm();
      this.addCompanyNotFrance.get('country').patchValue(event.value);
      this.selectedCountry = event.value;
      this.caseMessage = '';
    } else {
      if (this.addCompanyNotFrance) {
        this.addCompanyNotFrance.reset();
        this.addCompanyNotFrance.clearValidators();
        this.addCompanyNotFrance.updateValueAndValidity();
      }
      this.initCompanyFranceForm();
      this.addCompanyFrance.get('country').patchValue('France');
      this.companyClicked = false;
      this.selectedCountry = 'France';
      this.caseMessage = '';
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  getCompany() {
    const country = this.addCompanyFrance.get('country').value;
    let siretNumber = this.addCompanyFrance.get('no_RC').value;

    if (!country || !siretNumber || this.addCompanyFrance.get('no_RC').invalid) {
      this.addCompanyFrance.markAllAsTouched();
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    }

    // siretNumber = siretNumber.toString();
    let schoolId;
    if (this.isUserAcadir || this.isUserAcadAdmin) {
      schoolId = this.entityData.school._id;
    } else if (this.data && this.data.schoolStudentCard && this.isUserAdmtc) {
      schoolId = this.data.schoolStudentCard;
    }
    this.isWaitingForResponse = true;
    this.companyClicked = false;
    this.subs.sink = this.companyService.GetCompanyCaseBySiret(siretNumber, country, schoolId).subscribe((resp) => {
      if (resp && resp.message !== 'case 5') {
        this.isWaitingForResponse = false;
        const res = _.cloneDeep(resp);
        const companyEntity = res.companies.find((company) => company.no_RC === siretNumber);

        if (
          companyEntity.no_of_employee_in_france &&
          companyEntity.no_of_employee_in_france_by_year &&
          companyEntity.type_of_company &&
          companyEntity.type_of_company_by_year
        ) {
          companyEntity.no_of_employee_in_france = companyEntity.no_of_employee_in_france
            ? this.translate.instant(companyEntity.no_of_employee_in_france) +
              (companyEntity.no_of_employee_in_france_by_year
                ? ' ' + this.translate.instant('in') + ' ' + companyEntity.no_of_employee_in_france_by_year
                : '')
            : null;

          companyEntity.type_of_company = companyEntity.type_of_company
            ? companyEntity.type_of_company +
              (companyEntity.type_of_company_by_year
                ? ' ' + this.translate.instant('in') + ' ' + companyEntity.type_of_company_by_year
                : '')
            : null;
        }
        if (
          companyEntity.company_addresses &&
          companyEntity.company_addresses.length &&
          companyEntity.company_addresses[0].address &&
          companyEntity.company_addresses[0].postal_code
        ) {
          companyEntity.address = companyEntity.company_addresses[0].address ? companyEntity.company_addresses[0].address : '';
          companyEntity.postal_code = companyEntity.company_addresses[0].postal_code ? companyEntity.company_addresses[0].postal_code : '';
        }
        this.addCompanyFrance.patchValue(companyEntity);
        this.companyClicked = true;
        this.companyBySiretData = resp;
        switch (resp.message) {
          case 'case 1':
            this.caseMessage = 'This company branch is already connected to your school. Do you want to use it?';
            break;
          case 'case 2':
          case 'case 3':
          case 'case 4':
            this.caseMessage = 'Are you sure want to add this company?';
            break;
          case 'case 6':
            this.caseMessage = 'This company branch already exists. Do you want to see the details ?';
        }
      } else {
        this, (this.isWaitingForResponse = false);
        this.caseMessage = 'case 5';
      }
    }, (err) => {

      this.isWaitingForResponse = false;
      if (err['message'] === 'GraphQL error: Sorry This Company is closed') {
        Swal.fire({
          allowOutsideClick: false,
          type: 'error',
          title: this.translate.instant('COMPANY_S20.TITLE'),
          html: this.translate.instant('COMPANY_S20.TEXT', {
            siret: siretNumber,
          }),
          footer: `<span style="margin-left: auto">COMPANY_S20</span>`,
          confirmButtonText: this.translate.instant('COMPANY_S20.BUTTON'),
        });
      } else if (err['message'] === 'GraphQL error: the company is non distributable.') {
        Swal.fire({
          allowOutsideClick: false,
          type: 'info',
          title: this.translate.instant('COMPANY_S21.TITLE'),
          html: this.translate.instant('COMPANY_S21.TEXT', {
            siret: siretNumber,
          }),
          footer: `<span style="margin-left: auto">COMPANY_S21</span>`,
          confirmButtonText: this.translate.instant('COMPANY_S21.BUTTON'),
        });
      } else if (err['message'] === 'GraphQL error: the siret you entered is not found on the government api. please double check the siret and try again') {
        Swal.fire({
          allowOutsideClick: false,
          type: 'warning',
          title: this.translate.instant('COMPANY_S22.TITLE'),
          html: this.translate.instant('COMPANY_S22.TEXT'),
          footer: `<span style="margin-left: auto">COMPANY_S22</span>`,
          confirmButtonText: this.translate.instant('COMPANY_S22.BUTTON'),
        });
      } else {
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      }
    });
  }

  addCompany() {
    const siretNumber = this.addCompanyFrance.get('no_RC').value;
    const companies = this.companyBySiretData.companies;
    const message = this.companyBySiretData.message;
    const companyBranch = this.companyBySiretData.companies.find((company) => company.no_RC === siretNumber);
    const companyEntity = this.companyBySiretData.companies.find((company) => company.company_type === 'entity');
    let schoolId;
    if (this.isUserAcadir || this.isUserAcadAdmin) {
      schoolId = this.entityData.school._id;
    } else if (this.data && this.data.schoolStudentCard && this.isUserAdmtc) {
      schoolId = this.data.schoolStudentCard;
    }
    if (message === 'case 1' || message === 'case 6') {
      // redirect to branch added
      if (this.data && this.data === 'company') {
        this.dialogRef.close();
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['companies/branches'], {
            queryParams: { siren: companyBranch.no_RC, siret: companyBranch.no_RC },
          });
        });
      } else if (this.data && this.data.from && this.data.from === 'studentcard') {
        this.dialogRef.close(this.companyBySiretData);
      }
    } else {
      this.isWaitingForResponse = true;
      const branchId = companyBranch ? companyBranch._id : null;
      const entityId = companyEntity ? companyEntity._id : null;
      this.subs.sink = this.companyService.CreateCompanyByCases(message, branchId, entityId, schoolId, companies).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((result) => {
            // redirect to company summary
            if (this.data && this.data === 'company') {
              this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                this.router.navigate(['companies/branches'], {
                  queryParams: { siren: companyBranch.no_RC, siret: companyBranch.no_RC },
                });
              });
              this.dialogRef.close();
            } else if (this.data && this.data.from && this.data.from === 'studentcard') {
              this.companyBySiretData.companies = this.companyBySiretData.companies.map((company) => {
                if (company && (company.no_RC === siretNumber || company.company_type === 'branch')) {
                  company._id = resp[0]._id;
                }
                return company;
              });

              this.dialogRef.close(this.companyBySiretData);
            }
          });
        }
      });
    }
  }

  onCancelAdd() {
    const currentSiret = this.addCompanyFrance.get('no_RC').value ? this.addCompanyFrance.get('no_RC').value : null;
    this.initCompanyFranceForm();
    this.addCompanyFrance.get('country').patchValue('France');
    this.addCompanyFrance.get('no_RC').patchValue(currentSiret);
    this.companyClicked = false;
    this.selectedCountry = 'France';
    this.caseMessage = '';
    this.companyBySiretData = null;
  }

  checkFormValidity(): boolean {
    if (this.addCompanyNotFrance.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
        footer: `<span style="margin-left: auto">Invalid_Form_Warning</span>`,
      });
      this.addCompanyNotFrance.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  validateCompany() {
    if (this.checkFormValidity()) {
      return;
    } else {
      const companyName = this.addCompanyNotFrance.get('company_name').value;
      const zipCode = this.addCompanyNotFrance.get('zip_code').value;
      const country = this.addCompanyNotFrance.get('country').value;
      this.isWaitingForResponse = true;
      this.subs.sink = this.companyService.validateCompanyNonFrance(companyName, zipCode).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.companyNonFranceData = resp.companies;
          if (resp.message === 'case 1') {
            this.swalComp3();
          } else if (resp.message === 'case 2') {
            // case 2 create company non france and connect to school
            this.createCompany();
          } else if (resp.message === 'case 3') {
            this.swalComp2();
          }
        }
      });
    }
  }

  swalComp2() {
    const companyName = this.addCompanyNotFrance.get('company_name').value;
    const zipCode = this.addCompanyNotFrance.get('zip_code').value;
    const lodash = _.chain(this.companyNonFranceData).keyBy('_id').mapValues('company_name').value();
    Swal.fire({
      type: 'warning',
      input: 'select',
      title: this.translate.instant('NEW_COMP_S2.TITLE'),
      html: this.translate.instant('NEW_COMP_S2.TEXT', {
        CompanyName: companyName,
        zipcode: zipCode,
      }),
      footer: `<span style="margin-left: auto">NEW_COMP_S2</span>`,
      customClass: 'swal-wide',
      inputOptions: lodash,
      inputPlaceholder: this.translate.instant('Select Company'),
      confirmButtonText: this.translate.instant('NEW_COMP_S2.BUTTON1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('NEW_COMP_S2.BUTTON2'),
      allowOutsideClick: false,
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('Import_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getInput().addEventListener('change', function (e) {
          if (e.target) {
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
          }
        });
      },
    }).then((result) => {
      if (result.value) {
        this.getData(result.value);
      } else {
        // create company non france and connect to school
        this.createCompany();
      }
    });
  }
  swalComp3() {
    const companyName = this.addCompanyNotFrance.get('company_name').value;
    const zipCode = this.addCompanyNotFrance.get('zip_code').value;
    let timeDisabled = 5;
    let compId = '';
    this.companyNonFranceData.forEach((element) => {
      compId = element._id;
    });
    Swal.fire({
      title: this.translate.instant('NEW_COMP_S3.TITLE'),
      html: this.translate.instant('NEW_COMP_S3.TEXT', {
        CompanyName: companyName,
        zipcode: zipCode,
      }),
      footer: `<span style="margin-left: auto">NEW_COMP_S3</span>`,
      type: 'error',
      customClass: 'swal-wide-1',
      confirmButtonText: this.translate.instant('NEW_COMP_S3.BUTTON1', { timer: timeDisabled }),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('NEW_COMP_S3.BUTTON2'),
      allowOutsideClick: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.timeInterval = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('NEW_COMP_S3.BUTTON1') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        this.timeOut = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('NEW_COMP_S3.BUTTON1');
          Swal.enableConfirmButton();
          clearInterval(this.timeInterval);
          clearTimeout(this.timeOut);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      clearInterval(this.timeInterval);
      clearTimeout(this.timeOut);
      if (result.value) {
        if (this.isUserAcadAdmin || this.isUserAcadir || (this.data && this.data.schoolStudentCard && this.isUserAdmtc)) {
          // connect company to school
          this.connectingCompany(compId);
        } else {
          // close dialog then redirect to company summary
          const companyName = this.companyNonFranceData[0];
          this.dialogRef.close();
          if (this.data && this.data === 'company') {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['companies/branches'], {
                queryParams: { siren: companyName.company_name, id: companyName._id },
              });
            });
          }
        }
      }
    });
  }

  getData(companyId) {
    let dataCompany = [];
    this.isWaitingForResponse = true;
    let schoolId;
    if (this.isUserAcadir || this.isUserAcadAdmin) {
      schoolId = this.entityData.school._id;
    } else if (this.data && this.data.schoolStudentCard && this.isUserAdmtc) {
      schoolId = this.data.schoolStudentCard;
    }
    if (this.isUserAcadir || this.isUserAcadAdmin || (this.data && this.data.schoolStudentCard && this.isUserAdmtc)) {
      this.subs.sink = this.companyService.getAllCompanyForCheck(schoolId).subscribe((respp) => {
        dataCompany = respp.find((company) => company._id === companyId);
        if (!dataCompany) {
          if (companyId) {
            this.subs.sink = this.companyService.getOneCompanyForPayload(companyId).subscribe(
              (resp: any) => {
                this.connectingCompany(companyId);
              },
              (err) => {
                this.isWaitingForResponse = false;
                this.CurUserService.postErrorLog(err);

              },
            );
          }
        } else {
          this.isWaitingForResponse = false;
          // close dialog then route to company summary use variable companyId
          const companyName = this.companyNonFranceData.find((company) => company._id === companyId);
          this.dialogRef.close();
          if (this.data && this.data === 'company') {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['companies/branches'], {
                queryParams: { siren: companyName.company_name, id: companyId },
              });
            });
          }
        }
      });
    } else {
      this.isWaitingForResponse = false;
      // close dialog then route to company summary use variable companyId
      const companyName = this.companyNonFranceData.find((company) => company._id === companyId);
      this.dialogRef.close();
      if (this.data && this.data === 'company') {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['companies/branches'], {
            queryParams: { siren: companyName.company_name, id: companyId },
          });
        });
      }
    }
  }

  // *************** Function to connecting school to company
  connectingCompany(companyId) {
    let schoolId;
    if (this.isUserAcadir || this.isUserAcadAdmin) {
      schoolId = [this.entityData.school._id];
    } else if (this.data && this.data.schoolStudentCard && this.isUserAdmtc) {
      schoolId = [this.data.schoolStudentCard];
    }
    this.subs.sink = this.companyService.connectSchoolToCompany(companyId, schoolId).subscribe(
      (resp) => {
        // close dialog then redirect to company summary
        this.dialogRef.close();
        if (this.data && this.data === 'company') {
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['companies/branches'], {
              queryParams: { siren: resp.company_name, id: resp._id },
            });
          });
        } else if (this.data && this.data.from && this.data.from === 'studentcard') {
          this.dialogRef.close(resp);
        }
      },
      (err) => {
        this.CurUserService.postErrorLog(err);

      },
    );
  }

  // *************** Function to create new company
  createCompany() {
    this.isWaitingForResponse = true;
    const payload = this.addCompanyNotFrance.value;
    if (this.isUserAcadir) {
      payload.school_ids = this.entityData.school._id;
    } else if (this.data && this.data.schoolStudentCard && this.isUserAdmtc) {
      payload.school_ids = this.data.schoolStudentCard;
    }
    const company_addresses = [
      {
        address: '',
        postal_code: this.addCompanyNotFrance.get('zip_code').value,
        city: '',
        region: '',
        department: '',
        country: this.addCompanyNotFrance.get('country').value,
        is_main_address: true,
      },
    ];
    payload.company_addresses = company_addresses;
    delete payload.country;
    delete payload.zip_code;
    this.subs.sink = this.companyService.createCompany(payload).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        }).then((result) => {
          if (result.value) {
            if (this.isUserAcadir || this.isUserAcadAdmin || (this.data && this.data.schoolStudentCard && this.isUserAdmtc)) {
              this.connectingCompany(resp._id);
            } else {
              // redirect to company summary
              if (this.data && this.data === 'company') {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                  this.router.navigate(['companies/branches'], {
                    queryParams: { siren: resp.company_name, id: resp._id },
                  });
                });
                this.dialogRef.close();
              } else if (this.data && this.data.from && this.data.from === 'studentcard') {
                this.dialogRef.close(resp);
              }
            }
          }
        });
      }
    });
  }

  onCancel() {
    setTimeout(() => this.siretInput.nativeElement.focus());
  }
  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
