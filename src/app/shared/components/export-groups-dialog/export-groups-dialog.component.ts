import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-export-groups-dialog',
  templateUrl: './export-groups-dialog.component.html',
  styleUrls: ['./export-groups-dialog.component.scss'],
})
export class ExportGroupsDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  exportGroupForm: UntypedFormGroup;

  titleCtrl = new UntypedFormControl(null);
  titleList: any[] = [];
  filteredTitle: Observable<any[]>;

  classCtrl = new UntypedFormControl(null);
  classList: any[] = [];
  filteredClass: Observable<any[]>;

  testCtrl = new UntypedFormControl(null);
  testList: any[] = [];
  filteredTest: Observable<any[]>;

  delimeterOptions = [
    {
      value: 'comma',
      name: 'COMMA',
    },
    {
      value: 'semicolon',
      name: 'SEMICOLON',
    },
    {
      value: 'tab',
      name: 'TAB',
    },
  ];

  selectedBar = '';

  isWaitingForResponse = false;

  isTutorialAdded = false;
  dataTutorial: any;
  isPermission: any;
  tutorialData: any;

  constructor(
    public dialogRef: MatDialogRef<ExportGroupsDialogComponent>,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private acadkitService: AcademicKitService,
    private rncpTitleService: RNCPTitlesService,
    private studentService: StudentsService,
    public coreService: CoreService,
    public tutorialService: TutorialService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.initForm();
    this.getTitleDropdown();
    this.resetFilterListener();
    this.getInAppTutorial('Export');
  }

  initForm() {
    this.exportGroupForm = this.fb.group({
      rncp_id: ['', Validators.required],
      class_id: ['', Validators.required],
      test_id: ['', Validators.required],
      file_delimeter: ['', Validators.required],
    });
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.authService.getLocalStorageUser();
    const userType = currentUser.entities[0].type.name;
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

  navTutorialClosed() {
    this.selectedBar = '';
    this.coreService.setTutorialView(null);
  }

  resetFilterListener() {
    this.subs.sink = this.titleCtrl.valueChanges.pipe().subscribe((title) => {
      if (this.exportGroupForm.get('rncp_id') && !this.isWaitingForResponse) {
        this.exportGroupForm.get('rncp_id').setValue('');
        this.classList = [];
        this.testList = [];
        this.classCtrl.setValue(null);
        this.testCtrl.setValue(null);
        this.exportGroupForm.get('class_id').setValue(null);
        this.exportGroupForm.get('test_id').setValue(null);
        this.exportGroupForm.get('file_delimeter').setValue(null);
      }
    });

    this.subs.sink = this.classCtrl.valueChanges.pipe().subscribe((classData) => {
      if (this.exportGroupForm.get('class_id') && !this.isWaitingForResponse) {
        this.exportGroupForm.get('class_id').setValue('');
        this.testList = [];
        this.testCtrl.setValue(null);
        this.exportGroupForm.get('test_id').setValue(null);
        this.exportGroupForm.get('file_delimeter').setValue(null);
      }
    });

    this.subs.sink = this.testCtrl.valueChanges.pipe().subscribe((test) => {
      if (this.exportGroupForm.get('test_id') && !this.isWaitingForResponse) {
        this.exportGroupForm.get('test_id').setValue('');
        this.exportGroupForm.get('file_delimeter').setValue(null);
      }
    });
  }

  getTitleDropdown() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.GetAllTitleDropdownList('').subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.titleList = _.cloneDeep(resp);
        this.filteredTitle = this.titleCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.titleList.filter((sch) => sch.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
          }),
        );
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  getClassDropdown(titleId: string) {
    this.exportGroupForm.get('rncp_id').setValue(titleId);
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassesByTitle(titleId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.classList = resp;
        this.filteredClass = this.classCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.classList.filter((cls) => cls.name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
          }),
        );
      },
      (err) => {
        this.swalError(err);
      },
    );

    this.classCtrl.setValue(null);
    this.testCtrl.setValue(null);
    this.exportGroupForm.get('class_id').setValue(null);
    this.exportGroupForm.get('test_id').setValue(null);
    this.exportGroupForm.get('file_delimeter').setValue(null);
  }

  getTestDropdown(classId) {
    this.exportGroupForm.get('class_id').setValue(classId);
    const titleId = this.exportGroupForm.get('rncp_id').value;
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getAllTestGroupTestDropdownList(titleId, classId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.testList = resp;
        this.filteredTest = this.testCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.testList.filter((cls) => cls.name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
          }),
        );
      },
      (err) => {
        this.swalError(err);
      },
    );

    this.testCtrl.setValue(null);
    this.exportGroupForm.get('test_id').setValue(null);
    this.exportGroupForm.get('file_delimeter').setValue(null);
  }

  getDelimeterDropdown(testId) {
    this.exportGroupForm.get('test_id').setValue(testId);
    this.exportGroupForm.get('file_delimeter').setValue(null);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  submit() {
    const payload = _.cloneDeep(this.exportGroupForm.value);
    payload['lang'] = this.translate.currentLang;


    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService
      .exportGroupCSV(payload.rncp_id, payload.class_id, payload.test_id, payload.file_delimeter, payload.lang)
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;

          if (resp) {
            // const url = `${environment.apiUrl}/fileuploads/${resp}`.replace('/graphql', '');
            // window.open(url, '_blank');

            const a = document.createElement('a');
            a.target = 'blank';
            a.href = `${environment.apiUrl}/fileuploads/${resp}?download=true`.replace('/graphql', '');
            a.download = resp;
            a.click();

            a.remove();
            this.dialogRef.close();
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
  }

  swalError(err) {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
