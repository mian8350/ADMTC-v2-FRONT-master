import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  NgModel,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { CoreService } from 'app/service/core/core.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { SchoolService } from 'app/service/schools/school.service';
import { map, startWith, tap } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';

interface TableDateList {
  school_id: School;
  school_issuance_date: any;
  school_issuance_date_retake: any;
  _id: string;
}

interface School {
  short_name: string;
  _id: string;
}

@Component({
  selector: 'ms-certificate-details-parameters',
  templateUrl: './certificate-details-parameters.component.html',
  styleUrls: ['./certificate-details-parameters.component.scss'],
  providers: [ParseStringDatePipe],
})
export class CertificateDetailsParametersComponent implements OnInit, OnDestroy, AfterViewInit {
  temporaryCondition = true;
  validateContinueButton = false;
  certificateTypeForm: UntypedFormGroup;
  secondForm: any;
  private subs = new SubSink();
  statusCertiDegree = 'initial';
  currentProcessId: string;
  isWaitingForResponse: boolean;
  isLoadingDate = false;

  isTableLoading = false;
  dataLoaded = false;
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatTable, { static: false }) table: MatTable<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('f', { static: false }) form: any;

  displayedColumns: string[] = ['school', 'datePass', 'dateRetake'];
  filterColumns: string[] = ['schoolFilter', 'datePassFilter', 'dateRetakeFilter'];
  dataCount: any;
  sortValue: { [x: string]: 'asc' | 'desc' };

  selection = new SelectionModel<any>(true, []);
  isCheckedAll = false;
  schoolSelected = [];
  schoolSelectedId = [];
  isReset = false;
  noData: any;
  selectType: any;

  schoolFilter = new UntypedFormControl('');
  filteredSchools: Observable<any[]>;
  schoolList = [];

  filteredValues = {
    school: '',
  };

  currentRncpId: any;

  tableDateList: TableDateList[] = [];

  datePass = new UntypedFormControl(null);
  dateRetake = new UntypedFormControl(null);
  dataDateSchool;
  dataDateSchoolOrigin;

  constructor(
    private certiDegreeService: CertidegreeService,
    private parseStringDatePipe: ParseStringDatePipe,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public coreService: CoreService,
    private schoolService: SchoolService,
    private utilService: UtilityService,
    public translate: TranslateService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.isWaitingForResponse = true;
    this.isTableLoading = true;
    this.initCertificateTypeForm();
    this.route.paramMap.subscribe((param) => {
      this.currentProcessId = param.get('id');
      // if data stashed in service, return that data, else refetch from be;
      // this.certiDegreeService.processData ? this.getExistingProcessData() : this.fetchProcessData();
      this.fetchProcessData();
    });

    // this.subs.sink = this.certiDegreeService.getStatusCertiDegreet$.subscribe((resp) => {
    //   if (resp) {
    //     this.statusCertiDegree = resp;
    //     this.checkCurrentTab(resp);
    //   }
    // });
  }

  ngAfterViewInit() {

    // this.subs.sink = this.paginator.page
    //   .pipe(
    //     startWith(null),
    //     tap(() => {
    //       if (!this.isReset && this.dataLoaded) {
    //         this.fetchTableData();
    //       }
    //     }),
    //   )
    //   .subscribe();
  }

  ngAfterViewChecked() {
    for (const element in this.form.form.controls) {
      this.form.form.controls[element].markAsTouched();
    }
  }

  initCertificateTypeForm() {
    this.certificateTypeForm = this.fb.group({
      certificate_type: this.fb.group({
        parchemin: this.fb.group({
          for_pass_student: [true],
          for_retake_student: [false],
          for_fail_student: [false],
        }),
        supplement_certificate: this.fb.group({
          is_enabled: [false],
          for_pass_student: [false],
          for_retake_student: [false],
          for_fail_student: [false],
        }),
        block_certificate: this.fb.group({
          is_enabled: [false],
          for_pass_student: [false],
          for_retake_student: [false],
          for_fail_student: [false],
        }),
      }),
    });
    this.secondForm = _.cloneDeep(this.certificateTypeForm.value);
    // trigger validation checkBoxValidator if checbox is checked or toggle is changed
  }

  shouldFormDisable() {
    return (
      this.isWaitingForResponse || this.isFormSame() || this.areFormsInvalid() || this.emptyCheckBoxesExist() || this.checkIsDateFill()
    );
  }

  shouldContinueDisable() {
    return (
      this.isTableLoading ||
      this.isWaitingForResponse ||
      this.areFormsInvalid() ||
      this.emptyCheckBoxesExist() ||
      this.checkIsDateFill() ||
      !this.isFormSame()
    );
  }

  areFormsInvalid() {
    return !this.certificateTypeForm.valid;
  }

  anyEmptyCheckboxesInGroup(control: AbstractControl): boolean {
    if (!control || !control.parent) {
      return null;
    }
    const childrenControls = Object.values((<UntypedFormGroup>control).value)
      .map((values) => values)
      .slice(1, 4);
    // check if at least one is ticked, if at least one is ticked then return false
    return childrenControls.some((element) => element === true) ? false : true;
  }

  emptyCheckBoxesExist() {
    let isAnySupplementEmpty = false;
    let isAnyBlockEmpty = false;
    if (this.getSupplementCertificateGroup().get('is_enabled').value) {
      isAnySupplementEmpty = this.anyEmptyCheckboxesInGroup(this.getSupplementCertificateGroup());
    }
    if (this.getBlockCertificateGroup().get('is_enabled').value) {
      isAnyBlockEmpty = this.anyEmptyCheckboxesInGroup(this.getBlockCertificateGroup());
    }
    // if both are false return false, if one is true return true to disable
    return isAnyBlockEmpty || isAnySupplementEmpty;
  }

  getCertificateTypeGroup() {
    return this.certificateTypeForm.get('certificate_type');
  }

  getParcheminCertificateGroup() {
    return this.certificateTypeForm.get(['certificate_type', 'parchemin']);
  }

  getSupplementCertificateGroup() {
    return this.certificateTypeForm.get(['certificate_type', 'supplement_certificate']);
  }

  getBlockCertificateGroup() {
    return this.certificateTypeForm.get(['certificate_type', 'block_certificate']);
  }

  fetchProcessData() {
    this.certiDegreeService.getOneCertificateIssuanceProcess(this.currentProcessId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        this.statusCertiDegree = resp && resp.current_tab ? resp.current_tab : null;
        this.currentRncpId = resp.rncp_id._id;
        this.checkCurrentTab(this.statusCertiDegree);
        this.certiDegreeService.processData = resp;
        if (!resp) {
          return;
        }
        this.patchFormValue(resp);
        this.afterFetchingProcessCheck();
        this.fetchTableData();
      },
      (error) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  // make sure that the first checkbox for pass student is checked automatically
  afterFetchingProcessCheck() {
    this.getParcheminCertificateGroup().patchValue({ for_pass_student: true });
  }

  // getExistingProcessData() {
  //   this.patchFormValue(this.certiDegreeService.processData);
  //   this.isWaitingForResponse = false;
  // }

  patchFormValue(resp) {
    // this.certificateTypeForm.patchValue({certificate_type: resp.certificate_type});
    this.certificateTypeForm.patchValue(resp);
    this.secondForm = _.cloneDeep(this.certificateTypeForm.value);
  }

  nextStep() {
    if (!this.validateContinueButton) {
      this.isWaitingForResponse = true;
      const mergedPayload = this.certificateTypeForm.value;
      if (this.statusCertiDegree === 'first') {
        mergedPayload.current_tab = 'second';
      }
      this.subs.sink = this.certiDegreeService.updateCertificateIssuanceProcess(this.currentProcessId, mergedPayload).subscribe(
        (resp) => {
          this.secondForm = _.cloneDeep(this.certificateTypeForm.value);
          this.isWaitingForResponse = false;
          // TO DO: Show Swal on Save Success Here
          this.fetchProcessData();
          if (this.statusCertiDegree === 'first') {
            this.certiDegreeService.setStatusCertiDegree('second');
          }
          this.certiDegreeService.setCurrentTabDetail('second');
        },
        (error) => {
          this.isWaitingForResponse = false;
        },
      );
    } else {
      this.certiDegreeService.setCurrentTabDetail('second');
    }
  }

  saveStep() {
    this.saveAndUpdateTypeAndParameter();
  }

  saveAndUpdateTypeAndParameter() {
    this.isWaitingForResponse = true;
    const mergedPayload = this.certificateTypeForm.value;


    if (this.statusCertiDegree === 'first') {
      mergedPayload.current_tab = 'second';
    }
    this.subs.sink = this.certiDegreeService.updateCertificateIssuanceProcess(this.currentProcessId, mergedPayload).subscribe(
      (resp) => {
        this.secondForm = _.cloneDeep(this.certificateTypeForm.value);
        this.isWaitingForResponse = false;
        // TO DO: Show Swal on Save Success Here
        this.fetchProcessData();
        if (this.statusCertiDegree === 'first') {
          this.certiDegreeService.setStatusCertiDegree('second');
        }
        Swal.fire({
          type: 'success',
          title: 'Bravo',
        });
      },
      (error) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  checkCurrentTab(status) {
    if (status !== 'first') {
      this.validateContinueButton = true;
    }
  }

  leaveDetails() {
    this.router.navigate(['certidegree']);
  }

  onSlideToggle(type: string, state: boolean) {
    // set all the checkboxes value for the specific type to false when mat-slide-toggle is turned off
    if (!state) {
      switch (type) {
        case 'block':
          const newBlockEntry = { ...this.getBlockCertificateGroup().value };
          for (const [key, value] of Object.entries(newBlockEntry)) {
            newBlockEntry[key] = false;
          }
          this.getBlockCertificateGroup().patchValue(newBlockEntry);
          break;
        case 'supplement':
          const newSupplementEntry = { ...this.getSupplementCertificateGroup().value };
          for (const [key, value] of Object.entries(newSupplementEntry)) {
            newSupplementEntry[key] = false;
          }
          this.getSupplementCertificateGroup().patchValue(newSupplementEntry);
          break;
      }
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  isFormSame() {
    const secondForm = JSON.stringify(this.secondForm);
    const formType = JSON.stringify(this.certificateTypeForm.value);
    if (secondForm === formType) {
      this.certiDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certiDegreeService.childrenFormValidationStatus = false;
      return false;
    }
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {

      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key]) {
        if (key === 'school') {
          filterQuery = filterQuery + `${key}:"${filterData[key]}"`;
        } else {
          filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
        }
      }

    });
    return 'filter: {' + filterQuery + '}';
  }

  fetchTableData() {
    this.isTableLoading = true;
    if (this.currentProcessId) {
      // const filter = this.cleanFilterData();
      // const pagination = {
      //   limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      //   page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
      // };
      this.subs.sink = this.certiDegreeService.getAllSchoolsCertidegree(this.currentProcessId).subscribe(
        (resp) => {

          const tempData = _.cloneDeep(resp);
          this.generateForm(tempData);
          this.dataSource.data = _.cloneDeep(tempData);
          this.dataSource.filter = JSON.stringify(this.filteredValues);
          this.dataSource.filterPredicate = this.customFilterPredicate();
          this.dataSource.paginator = this.paginator;
          this.paginator.length = resp.length;
          this.dataCount = resp.length;
          this.dataSource.sort = this.sort;
          this.dataSource.sortingDataAccessor = (items, property) => {
            switch (property) {
              case 'short_name':
                return items.school_id.short_name ? items.school_id.short_name : null;
              default:
                return items[property];
            }
          };
          this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
          this.dataLoaded = true;
          this.isReset = false;
          this.isTableLoading = false;
          this.getAllSchoolsDropdown();
        },
        (err) => {
          this.isTableLoading = false;
          this.authService.postErrorLog(err);

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    }
  }

  generateForm(tempData) {
    if (tempData && tempData.length) {
      this.tableDateList = [];
      tempData.forEach((dateList) => {
        if (dateList['school_issuance_date']) {
          dateList['school_issuance_date'] = this.parseStringDatePipe.transformStringToDate(dateList['school_issuance_date']);
        }
        if (dateList['school_issuance_date_retake']) {
          dateList['school_issuance_date_retake'] = this.parseStringDatePipe.transformStringToDate(dateList['school_issuance_date_retake']);
        }
        // this.tableDateList = _.cloneDeep(tempData);
        this.tableDateList.push(_.cloneDeep(dateList));
      });
    }
    this.dataDateSchool = _.cloneDeep(this.tableDateList);
    this.dataDateSchoolOrigin = _.cloneDeep(this.tableDateList);

  }

  customFilterPredicate() {
    return function (data, filter: string) {
      const searchString = JSON.parse(filter);

      const schoolId = searchString.school ? data.school_id.short_name.indexOf(searchString.school) !== -1 : true;

      return schoolId;
    };
  }

  getAllSchoolsDropdown() {
    this.isTableLoading = true;
    if (this.currentRncpId) {
      this.subs.sink = this.schoolService.getSchoolsByTitle(this.currentRncpId).subscribe(
        (resp) => {

          this.schoolList = _.cloneDeep(resp.preparation_centers.filter((pc) => pc !== null));
          this.setUpFiltersChangeListeners();
          this.isTableLoading = false;
        },
        (err) => {
          this.authService.postErrorLog(err);
          this.isTableLoading = false;
        },
      );
    }
  }

  setUpFiltersChangeListeners() {
    this.filteredSchools = this.schoolFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.schoolList
          .filter((option) => option && option.short_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : ''))
          .sort((firstData, secondData) => {
            if (
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() <
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
            ) {
              return -1;
            } else if (
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() >
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
            ) {
              return 1;
            } else {
              return 0;
            }
          }),
      ),
    );
  }

  sortData(sort: Sort) {
    if (sort) {
      if (sort.direction === 'asc') {
        const result = this.dataDateSchool.sort((firstData, secondData) => {
          if (
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.school_id.short_name)).toLowerCase() <
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.school_id.short_name)).toLowerCase()
          ) {
            return -1;
          } else if (
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.school_id.short_name)).toLowerCase() >
            this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.school_id.short_name)).toLowerCase()
          ) {
            return 1;
          } else {
            return 0;
          }
        });
        this.renderTableForm(result);
      } else if (sort.direction === 'desc') {
        const result = this.dataDateSchool
          .sort((firstData, secondData) => {
            if (
              this.utilService
                .simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.school_id.short_name))
                .toLowerCase() <
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.school_id.short_name)).toLowerCase()
            ) {
              return -1;
            } else if (
              this.utilService
                .simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.school_id.short_name))
                .toLowerCase() >
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.school_id.short_name)).toLowerCase()
            ) {
              return 1;
            } else {
              return 0;
            }
          })
          .reverse();
        this.renderTableForm(result);
      } else {
        this.dataDateSchool = _.cloneDeep(this.dataDateSchoolOrigin);
        this.renderTableForm(this.dataDateSchool);
      }
    }
  }

  renderTableForm(tempData) {
    if (tempData && tempData.length) {
      this.tableDateList = [];
      tempData.forEach((dateList) => {
        this.tableDateList.push(_.cloneDeep(dateList));
      });
    }
  }

  setSchoolFilter(value) {
    this.filteredValues['school'] = value;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  resetFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      school: '',
    };
    this.schoolFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.datePass.setValue(null, { emitEvent: false });
    this.dateRetake.setValue(null, { emitEvent: false });
    this.fetchTableData();
  }

  fillDatePass($event) {
    if ($event) {
      let school_issuance_date = moment($event.value).format('DD/MM/YYYY');
      this.tableDateList.forEach((element, index) => {

        if (!this.tableDateList[index].school_issuance_date || this.tableDateList[index].school_issuance_date) {
          if ($event.value) {
            if (!this.tableDateList[index].school_issuance_date) {
              element.school_issuance_date = $event.value;
              // this.updateDatePass($event, element);
            }
          }
        }
      });
      this.isLoadingDate = true;
      this.subs.sink = this.certiDegreeService
        .updateCertificateIssuanceProcessSchools(this.currentProcessId, school_issuance_date, '')
        .subscribe(
          (resp) => {
            if (resp) {
              this.isLoadingDate = false;

            }
          },
          (err) => {

            this.authService.postErrorLog(err);
            this.isLoadingDate = false;
          },
        );
    }
  }

  fillDateRetake($event) {
    if ($event) {
      let school_issuance_date_retake = moment($event.value).format('DD/MM/YYYY');
      this.tableDateList.forEach((element, index) => {

        if (!this.tableDateList[index].school_issuance_date_retake || this.tableDateList[index].school_issuance_date_retake) {
          if ($event.value) {
            if (!this.tableDateList[index].school_issuance_date_retake) {
              element.school_issuance_date_retake = $event.value;
              // this.updateDateRetake($event, element);
            }
          }
        }
      });
      this.isLoadingDate = true;
      this.subs.sink = this.certiDegreeService
        .updateCertificateIssuanceProcessSchools(this.currentProcessId, '', school_issuance_date_retake)
        .subscribe(
          (resp) => {
            if (resp) {
              this.isLoadingDate = false;

            }
          },
          (err) => {
            this.isLoadingDate = false;
            this.authService.postErrorLog(err);

          },
        );
    }
  }

  convertUTCToLocalDate(data) {
    const date = moment(data).format('DD/MM/YYYY');

    const dateTimeInLocal = moment(date, 'DD/MM/YYYY');
    return dateTimeInLocal.toISOString();
  }

  convertStringToLocalDate(data) {
    const date = moment(data).format('DD/MM/YYYY');

    const dateTimeInLocal = moment(date, 'DD/MM/YYYY');
    return dateTimeInLocal;
  }

  updateDatePass($event: any, element) {
    let data = _.cloneDeep(element);
    if (data) {
      const payload = {
        school_id: data.school_id._id,
        school_issuance_date: moment($event.value).format('DD/MM/YYYY'),
      };


      if (payload) {
        this.isLoadingDate = true;
        this.subs.sink = this.certiDegreeService.updateCertificateIssuanceProcessSchool(this.currentProcessId, data._id, payload).subscribe(
          (resp) => {
            if (resp) {
              this.isLoadingDate = false;

            }
          },
          (err) => {
            this.isLoadingDate = false;
            this.authService.postErrorLog(err);

          },
        );
      }
    }
  }

  updateDateRetake($event: any, element) {
    let data = _.cloneDeep(element);
    if (data) {
      const payload = {
        school_id: data.school_id._id,
        school_issuance_date_retake: moment($event.value).format('DD/MM/YYYY'),
      };


      if (payload) {
        this.isLoadingDate = true;
        this.subs.sink = this.certiDegreeService.updateCertificateIssuanceProcessSchool(this.currentProcessId, data._id, payload).subscribe(
          (resp) => {
            if (resp) {
              this.isLoadingDate = false;

            }
          },
          (err) => {
            this.isLoadingDate = false;
            this.authService.postErrorLog(err);

          },
        );
      }
    }
  }

  checkIsDateFill() {
    let isDateFilled = false;
    if (this.tableDateList && this.tableDateList.length) {
      const dataNull = this.tableDateList.filter((data) => !data.school_issuance_date || !data.school_issuance_date_retake);
      if (dataNull && dataNull.length) {
        isDateFilled = true;
      } else {
        isDateFilled = false;
      }
    }
    return isDateFilled;
  }
}
