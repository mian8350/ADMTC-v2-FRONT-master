import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule, UntypedFormArray } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { CompanyService } from 'app/service/company/company.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-branch-identity-form',
  templateUrl: './branch-identity-form.component.html',
  styleUrls: ['./branch-identity-form.component.scss'],
})
export class BranchIdentityFormComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() company;
  @Input() branchId;
  @Output() saveFormNonFrance = new EventEmitter<boolean>();
  editBranchCompany: UntypedFormGroup;
  isWaitingForResponse = false;
  initialForm: any;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isUserAdmtc = false;
  isLoading = false;
  CurUser: any;
  entityData: any;
  countries = [];
  countriesList: any[];
  schoolId;

  constructor(
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private companyService: CompanyService,
    private permission: NgxPermissionsService,
    private utilService: UtilityService,
    private CurUserService: AuthService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.patchFormValue();
    this.getListCountries();

    // *************** Function to get data current user
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.schoolId =
      this.CurUser.entities && this.CurUser.entities[0].school && this.CurUser.entities[0].school._id
        ? this.CurUser.entities[0].school._id
        : null;

    this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');


    // *************** Cek User Type & Permission Access User to Company Data
    this.isUserAcadir = !!this.permission.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permission.getPermission('Academic Admin');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
  }

  getListCountries() {
    this.subs.sink = this.companyService.getCountry().subscribe((list: any[]) => {
      const mapCountries = list.filter((country) => {
        return country.name !== 'France';
      });
      this.countries = mapCountries;
      this.countriesList = mapCountries;
    });
  }

  initForm() {
    this.editBranchCompany = this.fb.group({
      company_name: ['', Validators.required],
      no_RC: ['', Validators.required],
      nic: [''],
      type_of_company: ['', Validators.required],
      company_addresses: this.fb.array([this.initAddressForm()]),
      activity: ['', Validators.required],
      no_of_employee_in_france: ['', Validators.required],
    });
  }

  initAddressForm() {
    return this.fb.group({
      address: [''],
      city: [''],
      country: ['', Validators.required],
      department: [''],
      is_main_address: [true],
      postal_code: ['', Validators.required],
      region: [''],
    });
  }

  get companyAddressFormArray() {
    return this.editBranchCompany.get('company_addresses') as UntypedFormArray;
  }

  patchFormValue() {
    const patchArray = [this.company.company_addresses.country, this.company.company_addresses.country];
    if (this.company) {
      this.editBranchCompany.patchValue(this.company);
      this.initialForm = _.cloneDeep(this.editBranchCompany.value);
    }
    this.subs.sink = this.editBranchCompany.valueChanges.subscribe(() => {
      this.isFormChanged();
    });
  }

  isFormChanged() {
    const secondForm = JSON.stringify(this.initialForm);
    const firstForm = JSON.stringify(this.editBranchCompany.value);

    if (firstForm === secondForm) {
      this.companyService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.companyService.childrenFormValidationStatus = false;
      return false;
    }
  }

  onSave() {
    if (this.editBranchCompany.valid) {
      this.saveUpdate();
    } else {
      this.editBranchCompany.markAllAsTouched();
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
    }
  }

  saveUpdate() {
    const payload = this.editBranchCompany.value;
    const updateCompanyByAcadir = this.isUserAcadir || this.isUserAcadAdmin;

    if (this.isUserAcadir || this.isUserAcadAdmin) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.companyService.updateCompanyByAcadir(this.branchId, payload, updateCompanyByAcadir, this.schoolId).subscribe(
        (resp) => {
          this.swalSuccess(payload);
        },
        (err) => {
          this.swalError(err);
        },
      );
    } else if (this.isUserAdmtc) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.companyService.updateCompany(this.branchId, payload).subscribe(
        (resp) => {
          this.swalSuccess(payload);
        },
        (err) => {
          this.swalError(err);
        },
      );
    }
  }

  swalSuccess(payload) {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('COMPANY.UPDATEMSG', {
        shortName: payload.company_name,
      }),
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    }).then(() => {
      this.saveFormNonFrance.emit(true);
      this.companyService.childrenFormValidationStatus = true;
      this.companyService.setRefreshEditCompany(true);
    });
  }

  swalError(err) {
    this.editBranchCompany.markAllAsTouched();
    this.CurUserService.postErrorLog(err);
    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
