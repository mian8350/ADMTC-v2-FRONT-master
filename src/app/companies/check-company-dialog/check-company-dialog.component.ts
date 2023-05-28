import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import { CompanyService } from 'app/service/company/company.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { PermissionService } from 'app/service/permission/permission.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from 'app/service/auth-service/auth.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'ms-check-company-dialog',
  templateUrl: './check-company-dialog.component.html',
  styleUrls: ['./check-company-dialog.component.scss'],
})
export class CheckCompanyDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  companyCreation;
  addCompanySubForm: UntypedFormGroup;
  companyData: any;
  companyName = '';
  zip_code = '';
  country = '';
  isUserAdmtc = false;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isWaitingForResponse = false;
  countries: any;
  countriesList: any;
  CurUser: any;
  entityData: any;
  buttonDisabled = true;
  constructor(
    private matDialogRef: MatDialogRef<CheckCompanyDialogComponent>,
    private fb: UntypedFormBuilder,
    private companyService: CompanyService,
    private translate: TranslateService,
    private utilService: UtilityService,
    private permission: NgxPermissionsService,
    private CurUserService: AuthService,
  ) {}

  ngOnInit() {
    this.initForm();
    // *************** Function to get data country
    this.subs.sink = this.companyService.getCountry().subscribe((list: any) => {
      this.countries = list;
      this.countriesList = list;
    });
    // this.countries = this.companyService.getCountries();
    // this.countriesList = this.companyService.getCountries();

    // *************** Cek User Type & Permission Access User to Company Data
    this.isUserAcadir = !!this.permission.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permission.getPermission('Academic Admin');
    this.isUserAdmtc = !!this.permission.getPermission('ADMTC Admin');
    this.CurUser = this.CurUserService.getLocalStorageUser();
    if (this.isUserAcadir) {
      this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');
    } else if (this.isUserAcadAdmin) {
      this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Admin');
    }
    if (this.addCompanySubForm.get('country').value) {
      this.countrySelected();
    }
    this.postalKeyup();
  }

  // *************** Function to close dialog
  onClose() {
    this.matDialogRef.close(this.companyCreation);
  }

  // *************** Function to initialize form field
  initForm() {
    this.addCompanySubForm = this.fb.group({
      company_name: [null, [Validators.required, removeSpaces]],
      zip_code: [null, Validators.required],
      country: ['France', [Validators.required, removeSpaces]],
    });
  }

  // *************** Function to check and validate company data
  onCloseCreation() {
    this.isWaitingForResponse = true;
    this.companyName = this.addCompanySubForm.get('company_name').value;
    this.zip_code = this.addCompanySubForm.get('zip_code').value;
    this.country = this.addCompanySubForm.get('country').value;
    this.subs.sink = this.companyService.validateCompany(this.companyName, this.zip_code.toString(), this.country).subscribe(
      (resp: any) => {
        if (resp) {
          this.companyData = resp.companies;
          this.isWaitingForResponse = false;
          if (resp.message === 'case 1') {
            if (this.isUserAcadir || this.isUserAcadAdmin) {
              this.swalComp3();
            } else if (this.isUserAdmtc) {
              this.swalComp1();
            }
          } else if (resp.message === 'case 2') {
            const dataPass = {
              company_name: this.companyName,
              zip_code: this.zip_code,
              country: this.country,
            };
            const companyResponse = {
              createCompany: true,
              connectCompany: false,
              companyId: null,
              dataAdd: dataPass,
              createSelected: false,
            };
            this.matDialogRef.close(companyResponse);
          } else if (resp.message === 'case 3') {
            this.swalComp2();
          }
        }
      },
      (err) => {

        this.CurUserService.postErrorLog(err);
      },
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  // *************** Function to open sweat alert based on case company creation
  swalComp1() {
    const companyName = this.companyName;
    const zipCode = this.zip_code;
    let compId = '';
    this.companyData.forEach((element) => {
      compId = element._id;
    });
    Swal.fire({
      title: this.translate.instant('NEW_COMP_S1.TITLE'),
      html: this.translate.instant('NEW_COMP_S1.TEXT', {
        CompanyName: companyName,
        zipcode: zipCode,
      }),
      footer: `<span style="margin-left: auto">NEW_COMP_S1</span>`,
      type: 'error',
      confirmButtonText: this.translate.instant('NEW_COMP_S1.BUTTON'),
      allowOutsideClick: false,
    }).then((result) => {
      let companyResponse = {};
      if (result.value) {
        companyResponse = {
          createCompany: false,
          connectCompany: false,
          companyId: compId,
          dataAdd: null,
          createSelected: false,
        };
        this.companyService.setCompanyId(compId);
        this.matDialogRef.close(companyResponse);
      }
    });
  }

  swalComp2() {
    const companyName = this.companyName;
    const zipCode = this.zip_code;
    const lodash = _.chain(this.companyData).keyBy('_id').mapValues('company_name').value();
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
        Swal.getInput().addEventListener('click', function (e) {
          if (e.target) {
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
          }
        });
        // Swal.getContent().addEventListener('click', function (e) {
        //   Swal.enableConfirmButton();
        // });
      },
    }).then((result) => {
      let companyResponse = {};

      if (result.value) {
        this.getData(result.value);
      } else {
        const dataPass = {
          company_name: this.companyName,
          zip_code: this.zip_code,
          country: this.country,
        };
        companyResponse = {
          createCompany: true,
          connectCompany: false,
          companyId: null,
          dataAdd: dataPass,
          createSelected: false,
        };
        this.matDialogRef.close(companyResponse);
      }
    });
  }
  swalComp3() {
    const companyName = this.companyName;
    const zipCode = this.zip_code;
    let timeDisabled = 5;
    let compId = '';
    this.companyData.forEach((element) => {
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
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('NEW_COMP_S3.BUTTON1') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('NEW_COMP_S3.BUTTON1');
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      let companyResponse = {};
      if (result.value) {
        companyResponse = {
          createCompany: false,
          connectCompany: true,
          dataAdd: null,
          companyId: compId,
          createSelected: false,
        };
        this.matDialogRef.close(companyResponse);
      } else {
        this.matDialogRef.close();
      }
    });
  }
  // *************** End of Function to open sweat alert based on case company creation

  // *************** Function to get data company from check company
  getData(companyId) {
    let companyResponse = {};
    let dataCompany = [];

    this.isWaitingForResponse = true;
    if (this.isUserAcadir || this.isUserAcadAdmin) {
      this.subs.sink = this.companyService.getAllCompanyForCheck(this.entityData.school._id).subscribe((respp) => {
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
          companyResponse = {
            createCompany: false,
            connectCompany: false,
            companyId: companyId,
            dataAdd: null,
            createSelected: false,
          };
          this.companyService.setCompanyId(companyId);
          this.matDialogRef.close(companyResponse);
        }
      });
    } else {
      this.isWaitingForResponse = false;
      companyResponse = {
        createCompany: false,
        connectCompany: false,
        companyId: companyId,
        dataAdd: null,
        createSelected: false,
      };
      this.companyService.setCompanyId(companyId);
      this.matDialogRef.close(companyResponse);
    }
  }

  // *************** Function to connecting school to company
  connectingCompany(companyId) {
    let companyResponse = {};

    const schoolId = [this.entityData.school._id];
    // const schoolId = [
    //   {
    //     school_id: this.entityData.school._id,
    //   },
    // ];
    this.subs.sink = this.companyService.connectSchoolToCompany(companyId, schoolId).subscribe(
      (resp) => {

        companyResponse = {
          createCompany: false,
          connectCompany: false,
          companyId: companyId,
          dataAdd: null,
          createSelected: true,
        };
        this.companyService.setCompanyId(companyId);
        this.matDialogRef.close(companyResponse);
      },
      (err) => {

      },
    );
  }

  // *************** Function to filter data country
  filterCountry() {
    this.buttonDisabled = true;
    const searchString = this.addCompanySubForm.get('country').value
      ? this.addCompanySubForm.get('country').value.toLowerCase().trim()
      : '';
    this.countriesList = this.countries.filter((country) =>
      country && country.name ? country.name.toLowerCase().trim().includes(searchString) : '',
    );
  }
  postalKeyup() {
    const decimal = /^[0-9]*$/;
    if (this.addCompanySubForm.get('zip_code').value && !this.addCompanySubForm.get('zip_code').value.toString().match(decimal)) {
      this.addCompanySubForm.get('zip_code').setValue('');
    }
    this.subs.sink = this.addCompanySubForm
      .get('zip_code')
      .valueChanges.pipe(debounceTime(100))
      .subscribe((key) => {
        const temp = key;
        if (temp && !temp.toString().match(decimal)) {
          this.addCompanySubForm.get('zip_code').setValue('');
        } else if (key < 0) {
          this.addCompanySubForm.get('zip_code').setValue('');
        } else if (temp && temp.toString().length > 5) {
          this.addCompanySubForm.get('zip_code').setValue('');
        } else {
          this.addCompanySubForm.get('zip_code').setValue(key);
        }
      });
  }
  countrySelected() {
    this.buttonDisabled = false;
  }
}
