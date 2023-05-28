import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from '@angular/forms';
import { StudentsService } from 'app/service/students/students.service';
import * as _ from 'lodash';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import Swal from 'sweetalert2';
import { CustomValidators } from 'ng2-validation';
import { PermissionService } from 'app/service/permission/permission.service';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-parents',
  templateUrl: './parents.component.html',
  styleUrls: ['./parents.component.scss'],
})
export class ParentsComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Output() continue = new EventEmitter<boolean>();
  parentsForm: UntypedFormGroup;
  parentsTemp:any = null

  isMainAddressSelected = [false, false];

  countries: string[] = [];
  filteredCountry = [];
  cities = [];
  isWaitingForResponse = false;
  filteredCities = [];
  departments = []; // in API, this field called "academy"
  filteredDepartments = [];
  regions = []; // in API, this field called "province"
  filteredRegions = [];

  relationList = ['father', 'mother', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other'];

  isMainAddress = [];
  studentAddress: any = [];
  private intVal: any;
  private timeOutVal: any;
  myInnerHeight = 1920;
  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    public permissionService: PermissionService,
    private certieDegreeService: CertidegreeService
  ) {}

  ngOnInit() {
    this.initForm();
    this.getParentData();
  }

  ngOnChanges() {
    this.reset();
    this.countries = this.schoolService.getCountries();
    this.initForm()
    this.getParentData();
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    if (this.router.url === '/my-file' || this.router.url.includes('previous-course')) {
      this.myInnerHeight = window.innerHeight - 193;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 369;
      return this.myInnerHeight;
    }
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }

  reset() {
    this.isMainAddressSelected = [false, false];
    this.parentsTemp = null
  }

  initForm() {
    this.parentsForm = this.fb.group({
      email: [null],
      parents: this.fb.array([this.initParentForm(true)]),
    });
  }

  isFormSame() {

    const secondForm = JSON.stringify(this.parentsTemp);
    const formType = JSON.stringify(this.parentsForm.value);
    if (secondForm === formType) {
      this.certieDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certieDegreeService.childrenFormValidationStatus = false;
      return false;
    }
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
      relation: [null, Validators.required],
      family_name: [null, Validators.required],
      name: [null, Validators.required],
      civility: [null, Validators.required],
      tele_phone: [null, [Validators.maxLength(10), Validators.pattern('^[0-9]+$')]],
      email: [null, [Validators.required, CustomValidators.email]],
      is_same_address: [false, Validators.required],
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
      address: [null, Validators.required],
      postal_code: [null, [Validators.required, Validators.maxLength(5), Validators.pattern('^[0-9]+$')]],
      country: ['France', Validators.required],
      city: [null, Validators.required],
      region: [null, Validators.required],
      department: [null, Validators.required],
      is_main_address: [false, Validators.required],
    });
  }

  getParentData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.getStudentsParentData(this.studentId).subscribe((response) => {
      const res = _.cloneDeep(response);
      if (res) {
        if (res.student_address && res.student_address.length) {
          this.studentAddress = res.student_address;
        }
        if (res.parents && res.parents.length) {
          res.parents.forEach((parent, parentIndex) => {
            if (parentIndex >= 1 && this.parentsArrayForm.length<res.parents.length) {
              this.addParent(false);
            }
            if (parent && parent.parent_address && parent.parent_address.length) {
              parent.parent_address.forEach((address, addressIndex) => {
                if (address && address.is_main_address) {
                  this.isMainAddressSelected[parentIndex] = true;
                }
                // if (address.postal_code && address.country && address.country.toLowerCase() === 'france') {
                //   this.subs.sink = this.rncpTitleService
                //     .getFilteredZipCode(address.postal_code, address.country)
                //     .subscribe((addresData) => {
                //       this.setAddressDropdown(addresData, parentIndex, addressIndex);
                //     });
                // }
                if (addressIndex >= 1) {
                  this.addParentAddress(parentIndex);
                }
              });
            }
          });
        }
        this.parentsForm.patchValue(res);
        this.parentsTemp = this.parentsForm.value
        this.parentsForm.valueChanges.subscribe(resp=>{
          this.isFormSame()
        })
      }
      this.isWaitingForResponse = false;
    });
  }

  get parentsArrayForm() {
    return this.parentsForm.get('parents') as UntypedFormArray;
  }

  addParent(boolean) {
    this.parentsArrayForm.push(this.initParentForm());
    this.filteredCountry.push([]);
    this.cities.push([]);
    this.filteredCities.push([]);
    this.regions.push([]);
    this.filteredRegions.push([]);
    this.departments.push([]);
    this.filteredDepartments.push([]);

    if (boolean) {
      const tempAnchor = document.getElementById('parent1');
      setTimeout(() => {
        tempAnchor.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }

  removeParent(parentIndex: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete parent !'),
      footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
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
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

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
          html: this.translate.instant('parent deleted'),
          footer: `<span style="margin-left: auto">EVENT_S1</span>`,
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
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

  removeParentAddress(parentIndex: number, addressIndex: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('DELETE_STUDENT_ADDRESS'),
      footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
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
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

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
        this.parentAddressArrayForm(parentIndex).removeAt(addressIndex);
        this.filteredCountry[parentIndex].splice(addressIndex, 1);
        this.cities[parentIndex].splice(addressIndex, 1);
        this.filteredCities[parentIndex].splice(addressIndex, 1);
        this.regions[parentIndex].splice(addressIndex, 1);
        this.filteredRegions[parentIndex].splice(addressIndex, 1);
        this.departments[parentIndex].splice(addressIndex, 1);
        this.filteredDepartments[parentIndex].splice(addressIndex, 1);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('address deleted'),
          footer: `<span style="margin-left: auto">EVENT_S1</span>`,
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
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
      country.toLowerCase().trim().includes(searchString),
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
      // const temp = _.cloneDeep(this.parentAddressArrayForm(parentIndex).value);
      // if (temp && temp.length) {
      //   temp.forEach((oldAddress, oldIndex) => {
      //     this.removeParentAddress(parentIndex, oldIndex);
      //   });
      // }
      this.parentAddressArrayForm(parentIndex).clear();

      // Add new formArray
      if (this.studentAddress && this.studentAddress.length) {
        this.studentAddress.forEach((address, addressIndex) => {
          this.addParentAddress(parentIndex);
          if (address && address.is_main_address) {
            this.isMainAddressSelected[parentIndex] = true;
          }
          // if (address.postal_code && address.country && address.country.toLowerCase() === 'france') {
          //   this.subs.sink = this.rncpTitleService.getFilteredZipCode(address.postal_code, address.country).subscribe((addresData) => {
          //     this.setAddressDropdown(addresData, parentIndex, addressIndex);
          //   });
          // }
        });
        this.parentAddressArrayForm(parentIndex).patchValue(this.studentAddress);
      }
    } else {
      this.parentAddressArrayForm(parentIndex).clear();
      this.addParentAddress(parentIndex);
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

  updateStudentParents() {
    this.isWaitingForResponse = true;
    const lang = this.translate.currentLang.toLowerCase();
    const temp = this.parentsForm.value;
    this.parentsTemp = this.parentsForm.value
    if(this.parentsForm.invalid){
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
      this.parentsForm.markAllAsTouched();
      this.isWaitingForResponse = false
      return;
    }
    // validation for main address
    if (temp && temp.parents && temp.parents.length) {
      temp.parents.forEach((parent, parentIndex) => {
        if (parent && parent.parent_address && parent.parent_address.length) {
          this.parentAddressArrayForm(parentIndex).at(0).get('is_main_address').patchValue(true);
        }
      });
    }
    if (this.parentsForm.valid) {
      this.subs.sink = this.schoolService.updateStudent(this.studentId, this.parentsForm.value, lang).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
            }).then(() => this.studentService.updateStudentCard(true));
          }
        },
        (err) => {
          const text = new String(err);
          this.isWaitingForResponse = false
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
    } else {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: 'Error !',
      }).then((res) => {
        this.parentsForm.markAllAsTouched();

      });
    }
  }
}
