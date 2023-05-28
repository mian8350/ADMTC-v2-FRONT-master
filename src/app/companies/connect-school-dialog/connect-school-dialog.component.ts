import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { CompanyService } from 'app/service/company/company.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { concatMap, map } from 'rxjs/operators';
@Component({
  selector: 'ms-connect-school-dialog',
  templateUrl: './connect-school-dialog.component.html',
  styleUrls: ['./connect-school-dialog.component.scss'],
})
export class ConnectSchoolDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  connectSchoolForm: UntypedFormGroup;
  CurUser: any;
  selectedSchool: any;
  selectedSchoolList: any[] = [];
  selectedRncpTitleList: any[] = [];
  selectedClassList: any[] = [];
  selectedRncpTitle: any;
  entityData: any;
  schoolList: any[] = [];
  titleList: any[] = [];
  classList: any[] = [];
  schoolDataList: any[] = [];
  titleDataList: any[] = [];
  classDataList: any[] = [];
  isWaitingForResponse = false;
  isSchoolWrongType = false;
  isTitleWrongType = false;
  isClassWrongType = false;
  private intVal: any;
  private timeOutVal: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private matDialogRef: MatDialogRef<ConnectSchoolDialogComponent>,
    private fb: UntypedFormBuilder,
    private companyService: CompanyService,
    private utilService: UtilityService,
    private CurUserService: AuthService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.getSchoolData();
  }

  // *************** Function to initialize form field
  initForm() {
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');
    this.connectSchoolForm = this.fb.group({
      connectSchools: this.fb.array([this.initConnectSchoolsFormGroup()]),
    });
  }

  initConnectSchoolsFormGroup() {
    return this.fb.group({
      school_name: [null, [Validators.required, removeSpaces]],
    });
  }

  // *************** Function to generate entity
  addEntities() {
    this.classList = this.classDataList;
    this.schoolList = this.schoolDataList;
    this.titleList = this.titleDataList;
    this.connectSchools.push(this.initConnectSchoolsFormGroup());
  }

  // *************** Function to remove entity
  removeEntities(index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete entity !'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
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
        this.connectSchools.removeAt(index);
        Swal.fire({
          type: 'success',
          allowOutsideClick: false,
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('entity deleted'),
          footer: `<span style="margin-left: auto">EVENT_S1</span>`,
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  get connectSchools() {
    return this.connectSchoolForm.get('connectSchools') as UntypedFormArray;
  }

  // *************** Function to close dialog
  onClose() {
    this.matDialogRef.close();
  }

  // *************** Function to connecting school to company
  submitData() {
    if (this.isSchoolWrongType) {
      this.connectSchoolForm.reset();
    }

    if (this.connectSchoolForm.invalid) {
      this.connectSchoolForm.markAllAsTouched();
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
    if (this.connectSchoolForm.valid) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.companyService.connectSchoolToCompany(this.data, this.selectedSchoolList).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((result) => {
              this.matDialogRef.close(true);
            });
          } else {
            Swal.fire({
              type: 'error',
              title: 'Error !',
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((res) => {
              this.connectSchoolForm.markAllAsTouched();

            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          this.CurUserService.postErrorLog(err);
          Swal.fire({
            type: 'error',
            title: 'Error !',
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {
            this.connectSchoolForm.markAllAsTouched();

          });
        },
      );
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('CONNECT_VALIDATE'),
        allowOutsideClick: false,
        footer: `<span style="margin-left: auto">CONNECT_VALIDATE</span>`,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      }).then((res) => {
        this.connectSchoolForm.markAllAsTouched();

      });
    }
  }

  // *************** Function to populate data school
  getSchoolData() {
    this.isWaitingForResponse = true;
    const existingConnectedSchools = this.companyService.getSchoolsByCompanyId(this.data);
    const schoolDropdown = this.companyService.getAllSchoolsDropdown();
    this.subs.sink = existingConnectedSchools
      .pipe(
        concatMap((connectedSchools) =>
          schoolDropdown.pipe(
            map((schools) => {
              const existingSchoolIds = connectedSchools.map((school) => school._id); // only return schools that are not connected already to the company
              return schools.filter((school) => !existingSchoolIds.includes(school._id)); 
            }),
          ),
        ),
      )
      .subscribe(
        (schools) => {
          const schoolArray = schools.map((school) => {
            return { _id: school._id, label: school.short_name };
          });
          this.schoolList = schoolArray;
          this.schoolDataList = schoolArray;
          this.isWaitingForResponse = false;
        },
        (err) => {
          this.CurUserService.postErrorLog(err);

        },
      );
  }

  // *************** Function to get data rncp title
  getRncpTitles(event, index) {
    this.selectedSchool = event;
    this.selectedSchoolList.push(this.selectedSchool);
    this.isSchoolWrongType = false;
  }

  // *************** Function to filter data school
  filterSchool(index: number) {
    const searchString = this.connectSchools.at(index).get('school_name').value.toLowerCase().trim();
    this.schoolList = this.schoolDataList.filter((school) => school.label.toLowerCase().trim().includes(searchString));
    this.isSchoolWrongType = true;
  }

  // *************** Function to select data school
  setSelectedSchool(event, index: number) {
    const searchString = this.connectSchools.at(index).get('school_name').value.toLowerCase().trim();
    this.schoolList = this.schoolDataList.filter((school) => school.label.toLowerCase().trim().includes(searchString));
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
