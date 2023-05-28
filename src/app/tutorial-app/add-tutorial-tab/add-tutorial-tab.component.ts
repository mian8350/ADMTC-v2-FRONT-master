import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { debounceTime } from 'rxjs/operators';
import { ImagePreviewDialogComponent } from 'app/shared/components/image-preview-dialog/image-preview-dialog.component';

@Component({
  selector: 'ms-add-tutorial-tab',
  templateUrl: './add-tutorial-tab.component.html',
  styleUrls: ['./add-tutorial-tab.component.scss'],
})
export class AddTutorialTabComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  public Editor = DecoupledEditor;
  @ViewChild('editor', { static: true }) editor: CKEditorComponent;
  // public config = {
  //   placeholder: this.translate.instant('Item Description'),
  //   height: '20rem',
  //   toolbar: ['bold', 'italic', 'underline', 'link'],
  // };
  public config = {
    toolbar: [
      'heading',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      'todoList',
      '|',
      'indent',
      'outdent',
      '|',
      'link',
      'blockQuote',
      'imageUpload',
      'insertTable',
      'horizontalLine',
      'pageBreak',
      '|',
      'undo',
      'redo',
    ],
    link: {
      addTargetToExternalLinks: true,
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
    },
  };

  firstForm: any;
  userTypesList: any = [];
  originalUserTypesList: any = [];
  originalUserTypesLists: any = [];
  form: UntypedFormGroup;
  modifyTutorial = false;
  originalUserType;
  userTypeList: any;
  subModuleDrop: any;
  itemsDrop: any[][] = [];
  userTypes = [];
  oriModuleList = [];
  userList = [];
  displayInOption = [];
  moduleList = [
    'List of schools',
    'School Detail',
    'Summary',
    'My Profile',
    'My Diploma',
    'My Experience',
    'My Skill',
    'My Language',
    'My Interest',
    'List of users',
    'List of tasks',
    'List of notifications',
    'List of Tests',
    'List of questionnaire',
    'List of jury organizations',
    'List of 1001 ideas',
    'List of tutorials',
    'List of Students',
    'List of Active Students',
    'List of Completed Students',
    'List of Deactivated Students',
    'List of Suspended Students',
    'List of platform',
    'List of alert',
    'List of RNCP Title',
    'List of pending task and calendar step',
    'List of companies',
    'List of quality control',
    'List of CertiDegree',
    'List of Cross Correction',
    'Inbox',
    'Sent',
    'Important',
    'Trash',
    'Draft',
    'RNCP Title Management',
    'My File',
    'List of Group of School',
    'Questionnaire Tools',
    'Process Management',
    'Promo',
    'Compléter la grille pour grand oral',
    'Schedule of Jury',
  ];
  listTutorialModule = {
    ListOfSchools: [],
    SchoolDetail: [],
    Summary: [],
    MyProfile: [],
    MyDiploma: [],
    MyExperience: [],
    MySkill: [],
    MyLanguage: [],
    MyInterest: [],
    ListOfUsers: [],
    ListOfTasks: [],
    ListOfNotifications: [],
    ListOfTests: [],
    ListOfQuestionnaire: [],
    ListOfJuryOrganizations: [],
    ListOfIdeas: [],
    ListOfTutorials: [],
    ListOfStudents: [],
    ListOfActiveStudents: [],
    ListOfCompletedStudents: [],
    ListOfDeactivatedStudents: [],
    ListOfSuspendedStudents: [],
    ListOfPlatform: [],
    ListOfAlert: [],
    ListOfTitle: [],
    ListOfPending: [],
    ListOfCompanies: [],
    ListOfQualityControl: [],
    ListOfCertiDegree: [],
    ListOfCrossCorrection: [],
    Inbox: [],
    Sent: [],
    Important: [],
    Trash: [],
    Draft: [],
    RNCPTitleManagement: [],
    MyFile: [],
    ListOfGroupOfSchool: [],
    QuestionnaireTools: [],
    ProcessManagement: [],
    Promo: [],
    SaiseGrandOral: [],
    ScheduleOfJury: [],
  };
  data: any;
  dataOrigin: any;
  dataUpdate: any;
  moduleData: any;
  isUpdate = false;
  isEditTutorial = false;
  needRefresh = true;
  isSaved = false;
  isSavedAndPublished = false;

  isWaitingForResponse = false;
  constructor(
    private tutorialService: TutorialService,
    private fb: UntypedFormBuilder,
    public translate: TranslateService,
    private dialog: MatDialog,
    private authService: AuthService,
    private userService: UserService,
    private utilService: UtilityService,
    private testService: TestCreationService,
  ) {}

  ngOnInit() {
    this.initTutorialForm();
    this.getTutorialData();
    this.getUserTypeList();
    this.subs.sink = this.tutorialService.dataEditTutorial.subscribe((val) => {
      if (val) {
        this.modifyTutorial = true;
        this.isEditTutorial = true;
        this.isUpdate = true;
        this.getTutorialForm(val);
        this.data = val;
        this.dataOrigin = val;

      }
    });
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.displayInOption = [];
      if (this.oriModuleList && this.oriModuleList.length) {
        if (this.data && this.data.module) {
          const datas = {
            name: this.translate.instant(this.data.module),
            value: this.data.module,
          };
          this.displayInOption.push(datas);
        }
        this.moduleList.forEach((element) => {
          const resultModule = this.oriModuleList.filter((resp) => resp.module === element);
          if (resultModule && resultModule.length < 1) {
            const data = {
              name: this.translate.instant(element),
              value: element,
            };
            this.displayInOption.push(data);
          }
        });
      } else {
        this.displayInOption = [];
        this.moduleList.forEach((element) => {
          const data = {
            name: this.translate.instant(element),
            value: element,
          };
          this.displayInOption.push(data);
        });
      }
    });
    // this.subs.sink = this.tutorialService.getModuleJson().subscribe((res) => {
    //   this.moduleData = res;
    // });
  }

  getTutorialData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.tutorialService.GetAllInAppTutorials().subscribe(
      (tutorialList) => {
        this.isWaitingForResponse = false;
        this.displayInOption = [];
        if (tutorialList && tutorialList.length) {
          if (this.data && this.data.module) {
            const datas = {
              name: this.translate.instant(this.data.module),
              value: this.data.module,
            };
            this.displayInOption.push(datas);
          }
          tutorialList.forEach((element) => {
            const tutorialData = _.cloneDeep(element);
            if (element.user_types && element.user_types.length) {
              tutorialData.user_types = element.user_types.filter((fil) => fil && fil._id).map((list) => list._id);
            }
            this.oriModuleList.push(tutorialData);
          });
          this.moduleList.forEach((element) => {
            const resultModule = this.oriModuleList.filter((resp) => resp.module === element);
            if (resultModule && resultModule.length < 1) {
              const data = {
                name: this.translate.instant(element),
                value: element,
              };
              this.displayInOption.push(data);
            }
          });
          this.subs.sink = this.tutorialService.getModuleJson().subscribe((res) => {
            this.moduleData = res;
          });
          // this.patchValues('');
        } else {
          this.displayInOption = [];
          this.moduleList.forEach((element) => {
            const data = {
              name: this.translate.instant(element),
              value: element,
            };
            this.displayInOption.push(data);
          });
          this.subs.sink = this.tutorialService.getModuleJson().subscribe((res) => {
            this.moduleData = res;
          });
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.subs.sink = this.tutorialService.getModuleJson().subscribe((res) => {
          this.moduleData = res;
        });
      },
    );
  }

  patchValues(moduleName) {
    this.userTypesList = _.cloneDeep(this.originalUserTypesLists);
    const module = moduleName ? moduleName : this.form.get('module').value;
    const user_types = this.form.get('user_types').value;
    let foundModuleFirst = this.oriModuleList.find((res) => res && res.module === module);
    const dataUserTypes = this.oriModuleList.filter((res) => res && res.module === module);
    const listSameModule = this.oriModuleList.filter((res) => res && res.module === module);
    let foundModule = '';
    foundModule = foundModuleFirst;
    let data = [];
    dataUserTypes.forEach((element) => {
      data = data.concat(element.user_types);
    });
    data = _.uniqBy(data);

    if (!this.isUpdate && dataUserTypes && dataUserTypes.length) {
      dataUserTypes[0].user_types = data;
      if (dataUserTypes[0].user_types && dataUserTypes[0].user_types) {
        dataUserTypes[0].user_types.forEach((element) => {
          const indx = this.userTypesList.findIndex((list) => list._id === element);
          this.userTypesList.splice(indx, 1);
        });
        this.userTypesList = _.uniqBy(this.userTypesList, 'name');
      }
    } else {
      if (listSameModule && listSameModule.length) {
        const notCurrentModule = listSameModule.filter((list) => list._id !== this.data._id);
        let dataEdit = [];
        notCurrentModule.forEach((element) => {
          dataEdit = dataEdit.concat(element.user_types);
        });
        dataEdit = _.uniqBy(dataEdit);

        if (notCurrentModule && notCurrentModule.length && notCurrentModule[0].user_types) {
          notCurrentModule[0].user_types = dataEdit;
          if (notCurrentModule[0].user_types && notCurrentModule[0].user_types) {
            notCurrentModule[0].user_types.forEach((element) => {
              const indx = this.userTypesList.findIndex((list) => list._id === element);
              this.userTypesList.splice(indx, 1);
            });
            this.userTypesList = _.uniqBy(this.userTypesList, 'name');
          }
        }
      }
      if (this.dataUpdate && this.dataUpdate.module !== module) {
        if (this.needRefresh) {
          this.needRefresh = false;
          // create dummy data
          const dummyData = {
            module: module ? module : '',
            sub_modules: [
              {
                sub_module: '',
                items: [
                  {
                    title: '',
                    description: '',
                    sub_index: 0,
                  },
                ],
                sub_index: 0,
              },
            ],
            user_types: moduleName === '' ? user_types : [],
            scenario_checklist_url: '',
            video_presentation: '',
            qa_checklist_url: '',
            count_document: null,
            video_url: '',
            is_published: false,
          };
          this.dataOrigin = null;
          this.resetFormValue();
          this.getTutorialForm(dummyData);
        } else {
          if (this.data && this.data.module === module) {
            foundModuleFirst = listSameModule.find((list) => list._id === this.data._id);
            foundModule = foundModuleFirst;
          }
          const userTypeDetected = [];
          const lastFilterData = [];
          if (user_types && user_types.length && foundModuleFirst && foundModuleFirst.user_types && foundModuleFirst.user_types.length) {
            foundModuleFirst.user_types.forEach((types) => {
              const indx = user_types.findIndex((list) => list === types);
              userTypeDetected.push(user_types[indx]);
            });
            if (user_types && user_types.length) {
              user_types.forEach((types) => {
                if (userTypeDetected.includes(types)) {
                  lastFilterData.push(types);
                }
              });
            }
          }

          if (
            userTypeDetected &&
            userTypeDetected.length &&
            lastFilterData &&
            lastFilterData.length &&
            foundModuleFirst &&
            foundModuleFirst.user_types &&
            foundModuleFirst.user_types.length
          ) {
            if (
              userTypeDetected.length === lastFilterData.length &&
              userTypeDetected.length === foundModuleFirst.user_types.length &&
              user_types.length === foundModuleFirst.user_types.length
            ) {
              if (foundModule) {
                this.resetFormValue();
                this.getTutorialForm(foundModule);
                this.data = foundModule;
                this.dataOrigin = foundModule;
                this.isUpdate = true;
                // this.isEditTutorial = true;
                this.needRefresh = true;

              }
            }
          }
        }
      } else {
        const userTypeDetected = [];
        const lastFilterData = [];
        if (this.data && this.data.module === module) {
          foundModuleFirst = listSameModule.find((list) => list._id === this.data._id);
          foundModule = foundModuleFirst;
        }
        if (user_types && user_types.length && foundModuleFirst && foundModuleFirst.user_types && foundModuleFirst.user_types.length) {
          foundModuleFirst.user_types.forEach((types) => {
            const indx = user_types.findIndex((list) => list === types);
            userTypeDetected.push(user_types[indx]);
          });
          if (user_types && user_types.length) {
            user_types.forEach((types) => {
              if (userTypeDetected.includes(types)) {
                lastFilterData.push(types);
              }
            });
          }
        }

        if (
          userTypeDetected &&
          userTypeDetected.length &&
          lastFilterData &&
          lastFilterData.length &&
          foundModuleFirst &&
          foundModuleFirst.user_types &&
          foundModuleFirst.user_types.length
        ) {
          if (
            userTypeDetected.length === lastFilterData.length &&
            userTypeDetected.length === foundModuleFirst.user_types.length &&
            user_types.length === foundModuleFirst.user_types.length
          ) {
            if (foundModule) {
              this.resetFormValue();
              this.getTutorialForm(foundModule);
              this.data = foundModule;
              this.dataOrigin = foundModule;
              this.isUpdate = true;
              // this.isEditTutorial = true;
              this.needRefresh = true;

            }
          }
        }
      }
    }
  }

  resetFormValue() {
    const lengthsub = this.subModal.length;
    if (lengthsub !== 1) {
      for (let index = lengthsub; index >= 1; index--) {
        this.removeSubModal(index);
      }
    }
  }

  getTutorialForm(val) {
    const payload = _.cloneDeep(val);
    if (payload && payload.sub_modules && payload.sub_modules.length) {
      payload.sub_modules.forEach((element, index) => {
        payload.sub_modules[index].sub_index = index;
        if (index !== 0) {
          this.addSubModal();
        }
        if (element && element.items && element.items.length) {
          element.items.forEach((item, indexItems) => {
            payload.sub_modules[index].items[indexItems].sub_index = index;
            if (indexItems !== 0) {
              item.sub_index = index;
              this.addItem(index);
            }
          });
        }
      });
    }
    if (payload.user_types && payload.user_types.length) {
      if (typeof payload.user_types[0] !== 'string') {
        payload.user_types = payload.user_types.filter((fil) => fil && fil._id).map((list) => list._id);
      }
    } else {
      payload.user_types = null;
    }
    this.form.patchValue(payload);
    // this.patchValues(payload.module);
    this.dataUpdate = payload;
    this.firstForm = _.cloneDeep(this.form.value);

  }

  initTutorialForm() {
    this.form = this.fb.group({
      module: [null, Validators.required],
      sub_modules: this.fb.array([this.initSubModal()]),
      video_url: ['', [this.isInputUrlValidator()]],
      user_types: [[]],
      video_presentation: [''],
      qa_checklist_url: ['', this.isInputUrlValidator()],
      scenario_checklist_url: ['', this.isInputUrlValidator()],
    });
    this.firstForm = _.cloneDeep(this.form.value);
  }

  getUserTypeList() {
    this.subs.sink = this.userService.getUserTypesForTutorial().subscribe((userTypes) => {
      this.userTypesList = userTypes;
      this.originalUserTypesList = userTypes;
      this.originalUserTypesLists = userTypes;
      this.initUserTypeValidation();
    });
  }

  isInputUrlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return this.utilService.isUrlFormat(control.value) || control.value === '' ? null : { invalidUrl: true };
    };
  }

  initItem() {
    return this.fb.group({
      title: [''],
      description: [''],
      sub_index: [0],
    });
  }

  initSubModal() {
    return this.fb.group({
      sub_module: [''],
      sub_index: [0],
      items: this.fb.array([this.initItem()]),
    });
  }

  initSubModals() {
    return this.fb.group({
      sub_module: [''],
      sub_index: [0],
      items: this.fb.array([]),
    });
  }

  addItem(index) {
    this.getItems(index).push(this.initItem());
    const items = this.form.get('sub_modules').get(index.toString()).get('items').value;
    const subIndex = this.form.get('sub_modules').get(index.toString()).get('sub_index').value;
    const lastIndex = items.length - 1;
    this.form.get('sub_modules').get(index.toString()).get('items').get(lastIndex.toString()).get('sub_index').patchValue(subIndex);
  }

  addSubModal() {
    this.subModal.push(this.initSubModals());
    const sub_module = this.form.get('sub_modules').value;
    const lastIndex = sub_module.length - 1;
    this.form.get('sub_modules').get(lastIndex.toString()).get('sub_index').patchValue(lastIndex);
    this.addItem(lastIndex);
  }

  getItems(index: number): UntypedFormArray {
    return this.form.get('sub_modules').get(index.toString()).get('items') as UntypedFormArray;
  }

  get subModal() {
    return this.form.get('sub_modules') as UntypedFormArray;
  }

  removeItem(index: number, parentIndex: number) {
    this.getItems(index).removeAt(parentIndex);
  }

  removeSubModal(parentIndex: number) {
    this.subModal.removeAt(parentIndex);
  }

  cancel() {
    this.tutorialService.setTutorialStep(0);
    this.tutorialService.setTutorialView(null);
    this.tutorialService.setTutorialEdit(null);
  }

  submitTutorial() {

    const payload = _.cloneDeep(this.form.value);
    if (this.subModuleDrop && this.subModuleDrop.length) {
      payload.sub_modules = [];
      this.subModuleDrop.forEach((element) => {
        if (element.value) {
          payload.sub_modules.push(element.value);
        }
      });
    }
    if (payload.sub_modules && payload.sub_modules.length) {
      payload.sub_modules.forEach((element, index) => {
        payload.sub_modules[index].items = [];
        this.getItems(index).controls.forEach((itemList, indexItem) => {
          const payItem = {
            title: this.form.get('sub_modules').get(index.toString()).get('items').get(indexItem.toString()).get('title').value,
            description: this.form.get('sub_modules').get(index.toString()).get('items').get(indexItem.toString()).get('description').value,
          };
          payload.sub_modules[index].items.push(payItem);
        });
        delete element.sub_index;
        if (payload.sub_modules[index].items && payload.sub_modules[index].items.length) {
          payload.sub_modules[index].items.forEach((ite, ins) => {
            delete payload.sub_modules[index].items[ins].sub_index;
          });
        }
      });
    }
    payload.is_published = true;
    if (this.isUpdate) {
      Swal.fire({
        title: this.translate.instant('INAPP_S4.TITLE'),
        text: this.translate.instant('INAPP_S4.TEXT'),
        footer: `<span style="margin-left: auto">INAPP_S4</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonText: this.translate.instant('INAPP_S4.BUTTON_1'),
        cancelButtonText: this.translate.instant('INAPP_S4.BUTTON_2'),
      }).then((res) => {
        if (res.value) {
          if (this.dataOrigin && this.dataOrigin._id) {
            this.subs.sink = this.tutorialService.UpdateInAppTutorial(this.data._id, payload).subscribe((resp) => {
              this.isSavedAndPublished = true;
              this.firstForm = _.cloneDeep(this.form.value);
              Swal.fire({
                type: 'success',
                title: this.translate.instant('TUTORIAL_UPDATE.TITLE'),
                text: this.translate.instant('TUTORIAL_UPDATE.TEXT', { title: this.data.module }),
                footer: `<span style="margin-left: auto">TUTORIAL_UPDATE</span>`,
                confirmButtonText: this.translate.instant('TUTORIAL_UPDATE.BUTTON'),
              }).then((ress) => {
                this.tutorialService.setTutorialStep(0);
                this.tutorialService.setTutorialView(null);
                this.tutorialService.setTutorialEdit(null);
                this.isUpdate = false;
              });
            });
          } else {
            this.subs.sink = this.tutorialService.checkIfModuleExitsForUsertype(payload.module, payload.user_types).subscribe((resps) => {
              if (resps === 'Can Create') {
                this.subs.sink = this.tutorialService.CreateInAppTutorial(payload).subscribe((resp) => {
                  this.isSavedAndPublished = true;
                  this.firstForm = _.cloneDeep(this.form.value);
                  Swal.fire({
                    type: 'success',
                    title: this.translate.instant('TUTORIAL_SAVE.TITLE'),
                    text: this.translate.instant('TUTORIAL_SAVE.TEXT'),
                    footer: `<span style="margin-left: auto">TUTORIAL_SAVE</span>`,
                    confirmButtonText: this.translate.instant('TUTORIAL_SAVE.BUTTON'),
                  }).then((ress) => {
                    this.tutorialService.setTutorialStep(0);
                    this.tutorialService.setTutorialView(null);
                    this.tutorialService.setTutorialEdit(null);
                  });
                });
              } else {
                Swal.fire({
                  title: 'error',
                  type: 'error',
                  text: 'error',
                });
              }
            });
          }
        }
      });
    } else {
      Swal.fire({
        title: this.translate.instant('INAPP_S4.TITLE'),
        text: this.translate.instant('INAPP_S4.TEXT'),
        footer: `<span style="margin-left: auto">INAPP_S4</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonText: this.translate.instant('INAPP_S4.BUTTON_1'),
        cancelButtonText: this.translate.instant('INAPP_S4.BUTTON_2'),
      }).then((res) => {
        if (res.value) {
          this.subs.sink = this.tutorialService.checkIfModuleExitsForUsertype(payload.module, payload.user_types).subscribe((resps) => {
            if (resps === 'Can Create') {
              this.subs.sink = this.tutorialService.CreateInAppTutorial(payload).subscribe((resp) => {
                this.isSavedAndPublished = true;
                this.firstForm = _.cloneDeep(this.form.value);
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('TUTORIAL_SAVE.TITLE'),
                  text: this.translate.instant('TUTORIAL_SAVE.TEXT'),
                  footer: `<span style="margin-left: auto">TUTORIAL_SAVE</span>`,
                  confirmButtonText: this.translate.instant('TUTORIAL_SAVE.BUTTON'),
                }).then((ress) => {
                  this.tutorialService.setTutorialStep(0);
                  this.tutorialService.setTutorialView(null);
                  this.tutorialService.setTutorialEdit(null);
                });
              });
            } else {
              Swal.fire({
                title: 'error',
                type: 'error',
                text: 'error',
              });
            }
          });
        }
      });
    }
  }

  submitOnlyTutorial() {

    const payload = _.cloneDeep(this.form.value);
    if (this.subModuleDrop && this.subModuleDrop.length) {
      payload.sub_modules = [];
      this.subModuleDrop.forEach((element) => {
        if (element.value) {
          payload.sub_modules.push(element.value);
        }
      });
    }
    if (payload.sub_modules && payload.sub_modules.length) {
      payload.sub_modules.forEach((element, index) => {
        payload.sub_modules[index].items = [];
        this.getItems(index).controls.forEach((itemList, indexItem) => {
          const payItem = {
            title: this.form.get('sub_modules').get(index.toString()).get('items').get(indexItem.toString()).get('title').value,
            description: this.form.get('sub_modules').get(index.toString()).get('items').get(indexItem.toString()).get('description').value,
          };
          payload.sub_modules[index].items.push(payItem);
        });
        delete element.sub_index;
        if (payload.sub_modules[index].items && payload.sub_modules[index].items.length) {
          payload.sub_modules[index].items.forEach((ite, ins) => {
            delete payload.sub_modules[index].items[ins].sub_index;
          });
        }
      });
    }
    if (this.data && this.isUpdate) {
      // payload.is_published = false;
      if (this.dataOrigin && this.dataOrigin._id) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.tutorialService.UpdateInAppTutorial(this.data._id, payload).subscribe(
          (resp) => {
          this.isWaitingForResponse = false;
          this.isSaved = true;
          this.firstForm = _.cloneDeep(this.form.value);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('INAPP_S3.TITLE'),
            text: this.translate.instant('INAPP_S3.TEXT'),
            footer: `<span style="margin-left: auto">INAPP_S3</span>`,
            confirmButtonText: this.translate.instant('INAPP_S3.BUTTON'),
          }).then((ress) => {
            this.tutorialService.setTutorialStep(0);
            this.tutorialService.setTutorialView(null);
            this.tutorialService.setTutorialEdit(null);
          });
        },
         (err) => {
          this.isWaitingForResponse = false;
         }
        );
      } else {
        // payload.is_published = false;
        this.isWaitingForResponse = true;
        this.subs.sink = this.tutorialService.checkIfModuleExitsForUsertype(payload.module, payload.user_types).subscribe((resps) => {
          this.isWaitingForResponse = false;
          if (resps === 'Can Create') {
            this.subs.sink = this.tutorialService.CreateInAppTutorial(payload).subscribe((resp) => {
              this.isSaved = true;
              this.firstForm = _.cloneDeep(this.form.value);
              Swal.fire({
                type: 'success',
                title: this.translate.instant('INAPP_S3.TITLE'),
                text: this.translate.instant('INAPP_S3.TEXT'),
                footer: `<span style="margin-left: auto">INAPP_S3</span>`,
                confirmButtonText: this.translate.instant('INAPP_S3.BUTTON'),
              }).then((ress) => {
                this.tutorialService.setTutorialStep(0);
                this.tutorialService.setTutorialView(null);
                this.tutorialService.setTutorialEdit(null);
              });
            });
          } else {
            this.isWaitingForResponse = false;
            Swal.fire({
              title: 'error',
              type: 'error',
              text: resps,
            });
          }
        });
      }
    } else {
      this.isWaitingForResponse = true;
      // payload.is_published = false;
      this.subs.sink = this.tutorialService.checkIfModuleExitsForUsertype(payload.module, payload.user_types).subscribe((resps) => {
        this.isWaitingForResponse = false;
        if (resps === 'Can Create') {
          this.subs.sink = this.tutorialService.CreateInAppTutorial(payload).subscribe((resp) => {
            this.isSaved = true;
            this.firstForm = _.cloneDeep(this.form.value);
            Swal.fire({
              type: 'success',
              title: this.translate.instant('INAPP_S3.TITLE'),
              text: this.translate.instant('INAPP_S3.TEXT'),
              footer: `<span style="margin-left: auto">INAPP_S3</span>`,
              confirmButtonText: this.translate.instant('INAPP_S3.BUTTON'),
            }).then((ress) => {
              this.tutorialService.setTutorialStep(0);
              this.tutorialService.setTutorialView(null);
              this.tutorialService.setTutorialEdit(null);
            });
          });
        } else {
          this.isWaitingForResponse = false;
          Swal.fire({
            title: 'error',
            type: 'error',
            text: resps,
          });
        }
      });
    }
  }

  initUserTypeValidation() {
    this.userTypesList = _.cloneDeep(this.originalUserTypesLists);
    const module = this.form.get('module').value;
    const dataUserTypes = this.oriModuleList.filter((res) => res && res.module === module);
    const listSameModule = this.oriModuleList.filter((res) => res && res.module === module);
    if (!this.isUpdate && dataUserTypes && dataUserTypes.length) {
      let data = [];
      dataUserTypes.forEach((element) => {
        data = data.concat(element.user_types);
      });
      data = _.uniqBy(data);

      dataUserTypes[0].user_types = data;
      if (dataUserTypes[0].user_types && dataUserTypes[0].user_types) {
        dataUserTypes[0].user_types.forEach((element) => {
          const indx = this.userTypesList.findIndex((list) => list._id === element);
          this.userTypesList.splice(indx, 1);
        });
        this.userTypesList = _.uniqBy(this.userTypesList, 'name');
      }
    } else {
      if (listSameModule && listSameModule.length) {
        const notCurrentModule = listSameModule.filter((list) => list._id !== this.data._id);
        let dataEdit = [];
        notCurrentModule.forEach((element) => {
          dataEdit = dataEdit.concat(element.user_types);
        });
        dataEdit = _.uniqBy(dataEdit);

        if (notCurrentModule && notCurrentModule.length && notCurrentModule[0].user_types) {
          notCurrentModule[0].user_types = dataEdit;
          if (notCurrentModule[0].user_types && notCurrentModule[0].user_types) {
            notCurrentModule[0].user_types.forEach((element) => {
              const indx = this.userTypesList.findIndex((list) => list._id === element);
              this.userTypesList.splice(indx, 1);
            });
            this.userTypesList = _.uniqBy(this.userTypesList, 'name');
          }
        }
      }
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
  }

  viewTutorial(data) {
    window.open(`${data}`, '_blank');
  }

  recordNote(subModuleIndex, itemIndex) {
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
          const data = this.getItems(subModuleIndex).at(itemIndex).get('description').value + ' ' + voiceText;
          this.getItems(subModuleIndex).at(itemIndex).get('description').setValue(data);
        }
      });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      this.subModuleDrop = event.container.data;

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {

      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  dropItem(event: CdkDragDrop<string[]>, index) {
    if (event.previousContainer === event.container) {
      this.itemsDrop[index] = event.container.data;

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {

      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  dataModuleNoEmpty() {
    let isNotEmpty = false;
    const subModule = this.form.get('sub_modules').value;
    if (subModule && subModule.length) {
      if (subModule[0].sub_module) {
        isNotEmpty = true;
      }
    }
    return isNotEmpty;
  }

  dataItemNoEmpty(index) {
    let isNotEmpty = false;
    const items = this.form.get('sub_modules').get(index.toString()).get('items').value;
    if (items && items.length) {
      if (items[0].title) {
        isNotEmpty = true;
      }
    }
    return isNotEmpty;
  }

  validateButton() {
    if (!this.form) {
      return;
    }
    let disabled = true;
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.form.value);
    if (firstForm === form) {
      disabled = true;
    } else {
      disabled = false;
    }
    return disabled;
  }
  getMessage(data) {
    if (data && data.includes('<img')) {
      const imgs = _.cloneDeep(data);
      let img = imgs.split('src="');
      if (data && data.includes('<figcaption>')) {
        img = img[1].split('"><figcaption>');
        img = img[0];
      } else {
        img = img[1].split('"></figure>');
        img = img[0];
      }
      if (img) {
        this.openImage(img.toString());
      }

    }
    return '';
  }

  openImage(data) {
    this.subs.sink = this.dialog
      .open(ImagePreviewDialogComponent, {
        disableClose: true,
        width: '98%',
        height: '98%',
        panelClass: 'image-preview-pop-up',
        data: data,
      })
      .afterClosed()
      .subscribe((resp) => {});
  }
}
