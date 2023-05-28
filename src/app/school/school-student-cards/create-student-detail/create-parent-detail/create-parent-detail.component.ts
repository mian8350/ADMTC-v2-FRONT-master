import { Component, OnInit, Input, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { StudentsService } from 'app/service/students/students.service';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { CustomValidators } from 'ng2-validation';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'apollo-link';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-create-parent-detail',
  templateUrl: './create-parent-detail.component.html',
  styleUrls: ['./create-parent-detail.component.scss'],
})
export class CreateParentDetailComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() schoolId: string;
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Output() continue = new EventEmitter<boolean>();
  @Output() back = new EventEmitter<boolean>();
  parentsForm: UntypedFormGroup;
  studentId: string;
  timeOutVar: any;
  private intVal: any;

  isMainAddressSelected = [false, false];

  countries: string[] = [];
  filteredCountry = [];
  cities = [];
  filteredCities = [];
  isWaitingForResponse = false;
  isSameAddress = [false, false];
  departments = []; // in API, this field called "academy"
  filteredDepartments = [];
  regions = []; // in API, this field called "province"
  filteredRegions = [];

  relationList = ['father', 'mother', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other'];

  isMainAddress = [];
  studentAddress: any = [];
  dataStudent: any;
  dataStudentParent: any;
  private timeOutVal: any;
  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.studentId = this.schoolService.getCurrentStudentId();
    this.subs.sink = this.schoolService.selectedDataStudent$.subscribe((resp) => (this.dataStudent = resp));
    this.subs.sink = this.schoolService.selectedDataStudentParents$.subscribe((resp) => (this.dataStudentParent = resp));
    this.studentAddress = this.schoolService.getCurrentStudentAddress();
    this.getParentData();
  }

  ngOnChanges() {
    this.reset();
    this.countries = this.schoolService.getCountries();
    this.studentId = this.schoolService.getCurrentStudentId();
    this.initForm();
    this.getParentData();
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVar);
    this.subs.unsubscribe();
  }

  reset() {
    this.isMainAddressSelected = [false, false];
  }

  initForm() {
    this.parentsForm = this.fb.group({
      parents: this.fb.array([this.initParentForm(true)]),
    });
  }

  initParentForm(init?: boolean) {
    if (init) {
      this.filteredCountry.push([]);
      this.cities.push([]);
      this.filteredCities.push([]);
      this.regions.push([]);
      this.filteredRegions.push([]);
      this.departments.push([]);
      this.filteredDepartments.push([]);
    }
    return this.fb.group({
      relation: ['', Validators.required],
      family_name: ['', [Validators.required, removeSpaces]],
      name: ['', [Validators.required, removeSpaces]],
      civility: [null, [Validators.required]],
      tele_phone: ['', [Validators.pattern('^[0-9]+$'), Validators.required, removeSpaces]],
      email: ['', [CustomValidators.email, Validators.required]],
      is_same_address: [false],
      parent_address: this.fb.array([this.initParentAddress(true)]),
    });
  }

  initParentAddress(init?: boolean) {
    if (init) {
      this.filteredCountry[0].push(this.countries);
      this.cities[0].push([]);
      this.filteredCities[0].push([]);
      this.regions[0].push([]);
      this.filteredRegions[0].push([]);
      this.departments[0].push([]);
      this.filteredDepartments[0].push([]);
    }
    return this.fb.group({
      address: ['', [Validators.required, removeSpaces]],
      postal_code: ['', [Validators.maxLength(5), Validators.pattern('^[0-9]+$')]],
      country: ['France', [Validators.required, removeSpaces]],
      city: ['', [Validators.required, removeSpaces]],
      region: ['', [Validators.required, removeSpaces]],
      department: ['', [Validators.required, removeSpaces]],
      is_main_address: [false],
    });
  }

  getParentData() {
    if (this.dataStudentParent) {
      this.isWaitingForResponse = true;

      this.dataStudentParent.parents.forEach((parent, index) => {
        if (index > 0) {
          this.addParent();
        }
        if (parent.is_same_address) {
          this.isSameAddress[index] = true;
        }
        parent.parent_address.forEach((address, indexx) => {
          if (indexx > 0) {
            this.addParentAddress(index);
          }
          // get country, city, region, and department dropdown data
          this.filteredCountry[index][indexx] = this.countries
          if (address.postal_code && address.country && address.country.toLowerCase() === 'france') {
            this.subs.sink = this.rncpTitleService.getFilteredZipCode(address.postal_code, address.country).subscribe((addresData) => {
              this.setAddressDropdown(addresData, index, indexx);
            });
          }

          // check for main address
          if (address.is_main_address) {
            this.isMainAddressSelected[indexx] = true;
          }
        });
      });
      this.parentsForm.patchValue(this.dataStudentParent);
      this.isWaitingForResponse = false;
    }
  }

  get parentsArrayForm() {
    return this.parentsForm.get('parents') as UntypedFormArray;
  }

  addParent() {
    this.parentsArrayForm.push(this.initParentForm());
    this.filteredCountry.push([]);
    this.cities.push([]);
    this.filteredCities.push([]);
    this.regions.push([]);
    this.filteredRegions.push([]);
    this.departments.push([]);
    this.filteredDepartments.push([]);

    const tempAnchor = document.getElementById('parent1');
    this.timeOutVar = setTimeout(() => {
      tempAnchor.scrollIntoView({ behavior: 'smooth' });
    }, 200);
    clearTimeout(this.timeOutVar);
  }

  removeParent(parentIndex: number) {
    const emptyParentForm = JSON.stringify(this.initParentForm().value);
    const selectedParentForm = JSON.stringify(this.parentsArrayForm.at(parentIndex).value);

    if (emptyParentForm !== selectedParentForm) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DELETE_PARENT'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.parentsArrayForm.removeAt(parentIndex);
          this.filteredCountry.splice(parentIndex, 1);
          this.cities.splice(parentIndex, 1);
          this.filteredCities.splice(parentIndex, 1);
          this.regions.splice(parentIndex, 1);
          this.filteredRegions.splice(parentIndex, 1);
          this.departments.splice(parentIndex, 1);
          this.filteredDepartments.splice(parentIndex, 1);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('PARENT_DELETED'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.parentsArrayForm.removeAt(parentIndex);
      this.filteredCountry.splice(parentIndex, 1);
      this.cities.splice(parentIndex, 1);
      this.filteredCities.splice(parentIndex, 1);
      this.regions.splice(parentIndex, 1);
      this.filteredRegions.splice(parentIndex, 1);
      this.departments.splice(parentIndex, 1);
      this.filteredDepartments.splice(parentIndex, 1);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('PARENT_DELETED'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  parentAddressArrayForm(parentIndex: number) {
    return this.parentsArrayForm.at(parentIndex).get('parent_address') as UntypedFormArray;
  }

  addParentAddress(parentIndex: number) {
    this.parentAddressArrayForm(parentIndex).push(this.initParentAddress());
    this.filteredCountry[parentIndex].push(this.countries);
    this.cities[parentIndex].push([]);
    this.filteredCities[parentIndex].push([]);
    this.regions[parentIndex].push([]);
    this.filteredRegions[parentIndex].push([]);
    this.departments[parentIndex].push([]);
    this.filteredDepartments[parentIndex].push([]);
  }

  removeParentAddress(parentIndex: number, addressIndex: number, mainAddressSelected: boolean, valid: boolean) {
    const emptyAddress = JSON.stringify(this.initParentAddress().value);
    const selectedAddress = JSON.stringify(this.parentsArrayForm.at(parentIndex).get('parent_address').get(addressIndex.toString()).value);

    if (emptyAddress !== selectedAddress) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DELETE_PARENT_ADDRESS'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.parentAddressArrayForm(parentIndex).removeAt(addressIndex);
          this.filteredCountry[parentIndex].splice(addressIndex, 1);
          this.cities[parentIndex].splice(addressIndex, 1);
          this.filteredCities[parentIndex].splice(addressIndex, 1);
          this.regions[parentIndex].splice(addressIndex, 1);
          this.filteredRegions[parentIndex].splice(addressIndex, 1);
          this.departments[parentIndex].splice(addressIndex, 1);
          this.filteredDepartments[parentIndex].splice(addressIndex, 1);
          if (mainAddressSelected) {
            if (valid) {
              this.isMainAddressSelected[parentIndex] = false;
            } else {
              this.isMainAddressSelected[parentIndex] = true;
            }
          }
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('CARDDETAIL.parent address deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.parentAddressArrayForm(parentIndex).removeAt(addressIndex);
      this.filteredCountry[parentIndex].splice(addressIndex, 1);
      this.cities[parentIndex].splice(addressIndex, 1);
      this.filteredCities[parentIndex].splice(addressIndex, 1);
      this.regions[parentIndex].splice(addressIndex, 1);
      this.filteredRegions[parentIndex].splice(addressIndex, 1);
      this.departments[parentIndex].splice(addressIndex, 1);
      this.filteredDepartments[parentIndex].splice(addressIndex, 1);
      if (mainAddressSelected) {
        if (valid) {
          this.isMainAddressSelected[parentIndex] = false;
        } else {
          this.isMainAddressSelected[parentIndex] = true;
        }
      }
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('CARDDETAIL.parent address deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  getPostcodeData(parentIndex: number, addressIndex: number) {
    const country = this.parentAddressArrayForm(parentIndex).at(addressIndex).get('country').value;
    const postCode = this.parentAddressArrayForm(parentIndex).at(addressIndex).get('postal_code').value;
    if (postCode && postCode.length > 3 && country && country.toLowerCase() === 'france') {
      this.subs.sink = this.rncpTitleService.getFilteredZipCode(postCode, country).subscribe((resp) => {
        if (resp && resp.length) {
          this.setAddressDropdown(resp, parentIndex, addressIndex);

          this.parentAddressArrayForm(parentIndex).at(addressIndex).get('city').setValue(this.cities[parentIndex][addressIndex][0]);
          this.parentAddressArrayForm(parentIndex)
            .at(addressIndex)
            .get('department')
            .setValue(this.departments[parentIndex][addressIndex][0]);
          this.parentAddressArrayForm(parentIndex).at(addressIndex).get('region').setValue(this.regions[parentIndex][addressIndex][0]);
        }
      });
    }
  }

  setAddressDropdown(resp: any, parentIndex: number, addressIndex: number) {
    const tempCities = [];
    const tempDepartments = [];
    const tempRegions = [];

    if (resp && resp.length) {
      resp.forEach((address) => {
        tempCities.push(address.city);
        tempDepartments.push(address.department);
        tempRegions.push(address.province);
      });

      this.cities[parentIndex][addressIndex] = _.uniq(tempCities);
      this.departments[parentIndex][addressIndex] = _.uniq(tempDepartments);
      this.regions[parentIndex][addressIndex] = _.uniq(tempRegions);

      this.filteredCities[parentIndex][addressIndex] = this.cities[parentIndex][addressIndex];
      this.filteredDepartments[parentIndex][addressIndex] = this.departments[parentIndex][addressIndex];
      this.filteredRegions[parentIndex][addressIndex] = this.regions[parentIndex][addressIndex];
    }
  }

  filterCountry(parentIndex: number, addressIndex: number) {
    const searchString = this.parentAddressArrayForm(parentIndex).at(addressIndex).get('country').value.toLowerCase().trim();
    this.filteredCountry[parentIndex][addressIndex] = this.countries.filter((country) =>
    country ? country.toLowerCase().trim().includes(searchString) : '',
    );
  }

  filterCity(parentIndex: number, addressIndex: number) {
    if (this.cities[parentIndex][addressIndex] && this.cities[parentIndex][addressIndex].length) {
      const searchString = this.parentAddressArrayForm(parentIndex).at(addressIndex).get('city').value.toLowerCase().trim();
      this.filteredCities[parentIndex][addressIndex] = this.cities[parentIndex][addressIndex].filter((city) =>
        city.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterDepartment(parentIndex: number, addressIndex: number) {
    if (this.departments[parentIndex][addressIndex] && this.departments[parentIndex][addressIndex].length) {
      const searchString = this.parentAddressArrayForm(parentIndex).at(addressIndex).get('department').value.toLowerCase().trim();
      this.filteredDepartments[parentIndex][addressIndex] = this.departments[parentIndex][addressIndex].filter((department) =>
        department.toLowerCase().trim().includes(searchString),
      );
    }
  }

  filterRegion(parentIndex: number, addressIndex: number) {
    if (this.regions[parentIndex][addressIndex] && this.regions[parentIndex][addressIndex].length) {
      const searchString = this.parentAddressArrayForm(parentIndex).at(addressIndex).get('region').value.toLowerCase().trim();
      this.filteredRegions[parentIndex][addressIndex] = this.regions[parentIndex][addressIndex].filter((region) =>
        region.toLowerCase().trim().includes(searchString),
      );
    }
  }

  checkMainAddress(event: MatSlideToggleChange, parentIndex: number) {
    if (event && event.checked) {
      this.isMainAddressSelected[parentIndex] = true;
    } else {
      this.isMainAddressSelected[parentIndex] = false;
    }
  }

  duplicateStudentAddress(event: MatSlideToggleChange, parentIndex: number) {
    if (event && event.checked) {
      // remove old formarray first
      const temp = _.cloneDeep(this.parentAddressArrayForm(parentIndex).value);
      if (temp && temp.length) {
        temp.forEach((oldAddress, oldIndex) => {
          // this.removeParentAddress(parentIndex, oldIndex, true, true);
          let timeDisabled = 5;
          Swal.fire({
            title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
            html: this.translate.instant('CARDDETAIL.Are you sure you want to use the student address in the parent address?'),
            type: 'warning',
            allowEscapeKey: true,
            showCancelButton: true,
            confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
            cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
            allowOutsideClick: false,
            allowEnterKey: false,
            onOpen: () => {
              Swal.disableConfirmButton();
              const confirmBtnRef = Swal.getConfirmButton();
              const intVal = setInterval(() => {
                timeDisabled -= 1;
                confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
              }, 1000);

              this.timeOutVal = setTimeout(() => {
                confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
                Swal.enableConfirmButton();
                clearInterval(intVal);
                clearTimeout(this.timeOutVal);
              }, timeDisabled * 1000);
            },
          }).then((res) => {
            clearTimeout(this.timeOutVal);
            if (res.value) {
              this.isSameAddress[parentIndex] = true;
              // this.parentAddressArrayForm(parentIndex).clear();

              // Add new formArray

              if (this.studentAddress && this.studentAddress.length) {
                this.studentAddress.forEach((address, addressIndex) => {
                  if (addressIndex > 0) {
                    this.addParentAddress(parentIndex);
                  }
                  if (address && address.is_main_address) {
                    this.isMainAddressSelected[parentIndex] = true;
                  }
                  if (address.postal_code && address.country && address.country.toLowerCase() === 'france') {
                    this.subs.sink = this.rncpTitleService
                      .getFilteredZipCode(address.postal_code, address.country)
                      .subscribe((addresData) => {
                        this.setAddressDropdown(addresData, parentIndex, addressIndex);
                      });
                  }
                });
                this.parentAddressArrayForm(parentIndex).patchValue(this.studentAddress);
              }
              Swal.fire({
                type: 'success',
                title: this.translate.instant('EVENT_S1.TITLE'),
                html: this.translate.instant('CARDDETAIL.The address is same'),
                confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
              });
            } else {

              this.parentsArrayForm.at(parentIndex).get('is_same_address').setValue(false);
            }
          });
        });
      }
    } else {
      this.isSameAddress[parentIndex] = false;
    }
  }

  isParentMainAddressSelected(parentIndex: number): boolean {
    if (parentIndex) {
      const data = this.parentsArrayForm.at(parentIndex).value;
      if (data.parent_address && data.parent_address.length) {
        for (const address of data.parent_address) {
          if (address.is_main_address) {
            return true;
          }
        }
      }
    }
    return false;
  }

  updateStudentParents(type: string) {
    this.isWaitingForResponse = true;
    const temp = this.parentsForm.value;
    // validation for main address
    const lang = this.translate.currentLang.toLowerCase();
    if (temp && temp.parents && temp.parents.length) {
      temp.parents.forEach((parent, parentIndex) => {
        if (parent && parent.parent_address && parent.parent_address.length) {
          this.parentAddressArrayForm(parentIndex).at(0).get('is_main_address').patchValue(true);
        }
      });
    }
    this.schoolService.setDataStudentParents(this.parentsForm.value);
    this.subs.sink = this.schoolService.updateStudent(this.studentId, this.parentsForm.value, lang).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
          }).then(() => {
            if (type === 'continue') {
              this.continue.emit(true)
            } else if (type === 'submit') {
              this.goBackToStudentCards();
            }
          });
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        // let index = err.indexOf("");
        const text = new String(err);
        let index = text.indexOf('/');
        let message = text.slice(21, index - 1);
        let pattern = text.slice(index);
        let str = '';

        if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ ]*$/') {
          str = 'must be letters';
        } else if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ -]*$/') {
          str = 'must be letters and "-"';
        } else if (pattern === '/^[0-9]+$/') {
          str = 'must be numbers';
        } else if (pattern === '/^[a-fA-F0-9]{24}$/') {
          str = 'must be Id';
        } else if (pattern === '/^[a-zA-Z0-9À-ÖØ-öø-ÿ -]*$/') {
          str = 'must be letters, numbers, and "-"';
        }
        let alert = message + ' ' + str;

        if (
          err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
          err['message'] === 'GraphQL error: Error: Email Registered As User'
        ) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
            html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
            footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
            confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error !',
            text: alert,
          });
        }
      },
    );
  }

  onCancelAdd() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TITLE'),
      html: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TEXT2'),
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.DECBTN'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.schoolService.setDataStudent(null);
        this.schoolService.setCurrentStudentId(null);
        this.schoolService.setDataStudentIdentity(null);
        this.schoolService.setDataStudentParents(null);
        this.schoolService.setDataStudentCompany(null);
        this.schoolService.setAddStudent(false);
      }
    });
  }

  previousTab() {
    this.canDeactivate();
  }

  isTestDataNotchanged(): boolean {
    let formData = null;
    this.subs.sink = this.schoolService.selectedDataStudentParents$.subscribe(resp => (formData = resp));

    const apiData = _.cloneDeep(this.parentsForm.value);

    return _.isEqual(formData, apiData);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;

    // The actual validation, by comparing data saved and current data in the form
    if (!this.parentsForm.touched || this.isTestDataNotchanged()) {
      validation = true;
    } else {
      validation = false;
    }

    // Passing the validation into the canExitService, if we return true, meaning user are allowed to go, otherwise user will stay
    if (!validation) {
      return new Promise((resolve, reject) => {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
            this.back.emit(false);
          } else {
            this.back.emit(true);
          }
        });
      });
    } else {
      this.back.emit(true);
    }
  }

  nextTab() {
    this.updateStudentParents('continue');
  }

  submit() {
    this.updateStudentParents('submit');
  }

  goBackToStudentCards() {
    this.schoolService.setDataStudent(null);
    this.schoolService.setCurrentStudentId(null);
    this.schoolService.setDataStudentIdentity(null);
    this.schoolService.setDataStudentCompany(null);
    this.schoolService.setDataStudentParents(null);
    this.schoolService.setAddStudent(false);
  }
}
