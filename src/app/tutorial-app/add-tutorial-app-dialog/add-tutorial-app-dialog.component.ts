import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { SubSink } from 'subsink';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import Swal from 'sweetalert2';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import * as _ from 'lodash';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';

@Component({
  selector: 'ms-add-tutorial-app-dialog',
  templateUrl: './add-tutorial-app-dialog.component.html',
  styleUrls: ['./add-tutorial-app-dialog.component.scss'],
})
export class AddTutorialAppDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  public Editor = DecoupledEditor;
  @ViewChild('editor', { static: true }) editor: CKEditorComponent;
  public config = {
    placeholder: this.translate.instant('Item Description'),
    height: '20rem',
    toolbar: [
      'heading',
      '|',
      'fontsize',
      '|',
      'bold',
      'italic',
      'Underline',
      'strikethrough',
      'highlight',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      '|',
    ],
  };
  form: UntypedFormGroup;
  modifyTutorial = false;
  originalUserType;
  userTypeList: any;
  userTypes = [];
  userList = [];
  displayInOption = [];
  moduleList = [
    'Candidate Follow Up',
    'Admission Member',
    'Finance Follow Up',
    'Financial Member',
    'History Finance',
    'Reconciliation & Lettrage',
    'Cheques'
  ]

  constructor(
    public dialogRef: MatDialogRef<AddTutorialAppDialogComponent>,
    private tutorialService: TutorialService,
    private fb: UntypedFormBuilder,
    public translate: TranslateService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private userService: UserService,
    private utilService: UtilityService,
    private testService: TestCreationService,
  ) {}

  ngOnInit() {
    this.initTutorialForm();

    this.displayOptionModule();
    if (this.data.data) {
      this.modifyTutorial = true;
      this.getTutorialForm();
    }
  }

  getTutorialForm() {
    if (this.data.data && this.data.data.items && this.data.data.items.length > 1) {
      this.data.data.items.forEach((element, index) => {
        if (index !== 0) {
          this.addItem();
        }
      });
    }
    this.form.patchValue(this.data.data);

  }

  initTutorialForm() {
    this.form = this.fb.group({
      module: [null, Validators.required],
      sub_module: ['', Validators.required],
      items: this.fb.array([this.initItem()]),
      video_url: [''],
      video_presentation: [''],
      qa_checklist_url: [''],
      scenario_checklist_url: [''],
    });
  }
  initItem() {
    return this.fb.group({
      title: [''],
      description: [''],
    });
  }
  addItem() {
    this.item.push(this.initItem());
  }
  get item() {
    return this.form.get('items') as UntypedFormArray;
  }
  removeItem(parentIndex: number) {
    this.item.removeAt(parentIndex);
  }

  submitTutorial() {

    if (this.data.data) {
      this.subs.sink = this.tutorialService.UpdateInAppTutorial(this.data.data._id, this.form.value).subscribe((resp) => {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('TUTORIAL_UPDATE.TITLE'),
          text: this.translate.instant('TUTORIAL_UPDATE.TEXT', { title: this.data.data.module }),
          footer: `<span style="margin-left: auto">TUTORIAL_UPDATE</span>`,
          confirmButtonText: this.translate.instant('TUTORIAL_UPDATE.BUTTON'),
        });
        this.dialogRef.close();
      });
    } else {
      this.subs.sink = this.tutorialService.CreateInAppTutorial(this.form.value).subscribe((resp) => {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('TUTORIAL_SAVE.TITLE'),
          text: this.translate.instant('TUTORIAL_SAVE.TEXT'),
          footer: `<span style="margin-left: auto">TUTORIAL_SAVE</span>`,
          confirmButtonText: this.translate.instant('TUTORIAL_SAVE.BUTTON'),
        });
        this.dialogRef.close();
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  getTranslateType(name) {
    if (name) {
      const value = this.translate.instant('USER_TYPES.' + name);
      return value;
    }
  }
  keysrt(key) {
    return function (a, b) {
      if (a[key] > b[key]) {
        return 1;
      } else if (a[key] < b[key]) {
        return -1;
      }
      return 0;
    };
  }

  displayOptionModule() {
    this.displayInOption = [];
    if (this.data && this.data.listModule) {
      if (this.data.listModule.admissionMemberList && !this.data.listModule.admissionMemberList.length) {
        this.displayInOption.push('Admission Member');
      }
      if (this.data.listModule.cheques && this.data.listModule.cheques.length < 4) {
        this.displayInOption.push('Cheques');
      }
      if (this.data.listModule.candidateTableList && !this.data.listModule.candidateTableList.length) {
        this.displayInOption.push('Candidate Follow Up');
      }
      if (this.data.listModule.financeTableList && !this.data.listModule.financeTableList.length) {
        this.displayInOption.push('Finance Follow Up');
      }
      if (this.data.listModule.financeMemberList && !this.data.listModule.financeMemberList.length) {
        this.displayInOption.push('Financial Member');
      }
      if (this.data.listModule.historyFinanceList && !this.data.listModule.historyFinanceList.length) {
        this.displayInOption.push('History Finance');
      }
      if (this.data.listModule.reconciliationList && this.data.listModule.reconciliationList.length < 5) {
        this.displayInOption.push('Reconciliation & Lettrage');
      }
    }
  }

  recordNote(index) {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'candidate-note-record',
        disableClose: true,
        data: '',
      })
      .afterClosed()
      .subscribe((text) => {
        if (text.trim()) {
          const voiceText = `${text}`;
          const data = this.form.get('items').get(index.toString()).get('description').value + ' ' + voiceText
          this.form.get('items').get(index.toString()).get('description').setValue(data);
        }
      });
  }
}
