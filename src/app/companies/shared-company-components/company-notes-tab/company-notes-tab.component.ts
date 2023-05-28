import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import { ReplyCompanyNoteDialogComponent } from './reply-company-note-dialog/reply-company-note-dialog.component';
import { AddCompanyNoteDialogComponent } from './add-company-note-dialog/add-company-note-dialog.component';
import { CompanyService } from 'app/service/company/company.service';
import { CertidegreeService } from './../../../service/certidegree/certidegree.service';
import { AuthService } from './../../../service/auth-service/auth.service';
import { SchoolService } from './../../../service/schools/school.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { ApplicationUrls } from 'app/shared/settings';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';

@Component({
  selector: 'ms-company-notes-tab',
  templateUrl: './company-notes-tab.component.html',
  styleUrls: ['./company-notes-tab.component.scss']
})
export class CompanyNotesTabComponent implements OnInit, OnChanges, OnDestroy {
  public Editor = DecoupledEditor;

  private subs = new SubSink();

  @Input() companyId;
  @Input() companyEntityId;
  @Input() userData;
  isWaitingForResponse = false;
  isReset = true

  form: UntypedFormGroup;
  companyComments: any[] = [];
  filterForm: UntypedFormGroup;
  filteredValues = {
    company_id: '',
    company_entity_id: '',
    note_body: '',
    created_by: '',
    date_note_created: '',
    category: '',
  };
  commentFilter = new UntypedFormControl(null);
  userFilter = new UntypedFormControl(null);
  dateFilter = new UntypedFormControl(null);
  categoryFilter = new UntypedFormControl(null);
  categoryFilterList: any[] = []
  userFilterList: any[] = []
  dateFilterList: any[] = []
  commentForm = new UntypedFormControl(null);
  isFirsLoad = true

  currentUser;
  allDataUser: any;
  allUser: any;
  timeout: any
  intVal: any
  timeOutVal: any

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  neutralStudentIcon = '../../../../../assets/img/student_icon_neutral.png';

  public config = {
    height: '20rem',
    toolbar: [],
    placeholder: this.translate.instant('Answer')
  };

  constructor(
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private authService: AuthService,
    private translate: TranslateService,
    private certiDegreeService: CertidegreeService,
    private companyService: CompanyService,
  ) { }

  ngOnInit() {
    this.initForm();
    this.getCategoryFilterDropdown()
    this.filterCompanyComment()
    if (this.userData && this.userData.length) {
      this.getAllUsers(this.userData);
    }
    this.currentUser = this.authService.getLocalStorageUser();
    this.commentForm.valueChanges.subscribe(res => {
      this.isForm()
    })
    this.config['mention'] = {
      feeds: [
        {
          marker: '@',
          feed: (query) => this.getFeedItems(query),
          minimumCharacters: 3,
        },
      ],
    };
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.config['placeholder'] = event.translations['Answer']
      this.getAllCompanyComment()
    })
  }
  initForm() {
    this.filterForm = this.fb.group({
      searchCommentFilter: [null],
      userFilter: [null],
      dateFilter: [null],
      categoryFilter: [null],
    });
  }

  filterCompanyComment() {
    this.subs.sink = this.categoryFilter.valueChanges.subscribe((value) => {
      this.filteredValues.category = value ? value : "";
      if(!this.isReset){
        this.getAllCompanyComment()
      }
    });

    this.subs.sink = this.userFilter.valueChanges.subscribe((value) => {
      this.filteredValues.created_by = value ? value : "";
      if(!this.isReset){
        this.getAllCompanyComment()
      }

    });

    this.subs.sink = this.dateFilter.valueChanges.subscribe((value) => {
      this.filteredValues.date_note_created = value ? value : "";
      if(!this.isReset){
        this.getAllCompanyComment()
      }

    });

    this.subs.sink = this.commentFilter.valueChanges.subscribe((value) => {
      this.filteredValues.note_body = value ? value : "";
      if(!this.isReset){
        this.getAllCompanyComment()
      }

    });
  }

  getAllCompanyComment() {
    this.isWaitingForResponse = true;
    this.isReset = false
    if (this.companyId) {
      this.filteredValues.company_id = this.companyId;
      this.filteredValues.company_entity_id = null
    } else if (this.companyEntityId) {
      this.filteredValues.company_id = null;
      this.filteredValues.company_entity_id = this.companyEntityId
    }
    this.companyComments = [];
    this.subs.sink = this.companyService.GetAllCompanyNotes(this.filteredValues).subscribe((resp) => {
      if (!resp) {
        this.companyComments = [];
        this.isWaitingForResponse = false;
        return;
      } else {
        this.isWaitingForResponse = false;
        this.companyComments = resp;
        if(this.isFirsLoad){
          this.getFilterDropdown()
        }
      }
      this.isFirsLoad = false
    });
  }

  getCategoryFilterDropdown() {
    this.subs.sink = this.companyService.GetAllCompanyNoteCategories().subscribe((resp) => {
      if (resp && resp.length) {
        this.categoryFilterList = resp;
      }
    });
  }

  getFilterDropdown() {
    if (this.companyComments) {
      this.userFilterList = this.companyComments.map(el => { return { name: el.created_by.first_name + " " + el.created_by.last_name } })
      this.userFilterList = [...new Map(this.userFilterList.map((item) => [item['name'], item])).values()];

      this.dateFilterList = this.companyComments.map(el => { return { date: this.transformDate(el.date_created) } })
      this.dateFilterList = [...new Map(this.dateFilterList.map((item) => [item['date'], item])).values()];


    }
  }

  getAllUsers(respAdmtc) {
    this.isWaitingForResponse = false;
    const listResponse = _.cloneDeep(respAdmtc);
    this.allDataUser = listResponse;
    this.allUser = this.allDataUser.map((newData) => {
      return '@' + newData.last_name + ' ' + newData.first_name;
    });
    this.config['mention'] = {
      feeds: [
        {
          marker: '@',
          feed: (query) => this.getFeedItems(query),
          minimumCharacters: 3,
        },
      ],
    };
  }

  getFeedItems(queryText) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.allDataUser && this.allDataUser.length) {
          if (!queryText) {
            this.allUser = this.allDataUser
              .map((newData) => {
                return '@' + newData.last_name + ' ' + newData.first_name;
              })
              .slice(0, 10);
            resolve(this.allUser);
          } else {
            const itemsToDisplay = this.allDataUser.filter((user) => {
              const searchString = queryText.toLowerCase();
              return user.last_name.toLowerCase().trim().includes(searchString);
            });

            this.allUser = itemsToDisplay.map((newData) => {
              return '@' + newData.last_name + ' ' + newData.first_name;
            });

            resolve(this.allUser);
          }
        }
      }, 50);
    });
  }
  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  transformDate(data) {
    if (data) {
      const date = data;
      const datee = moment(date).format('DD/MM/YYYY');
      return datee;
    } else {
      return '';
    }
  }

  transformTime(data) {
    if (data) {
      const date = data;
      const datee = moment(date).format('HH:mm');
      return datee;
    } else {
      return '';
    }
  }

  ngOnChanges() {
    if (this.userData && this.userData.length) {
      this.getAllUsers(this.userData);
    }
    this.reset()
  }

  addComment() {
    this.subs.sink = this.dialog
      .open(AddCompanyNoteDialogComponent, {
        width: '900px',
        minHeight: '200px',
        disableClose: true,
        panelClass: 'no-padding-pop-up',
        data: {
          companyId: this.companyId,
          companyEntityId: this.companyEntityId,
          currentUser: this.currentUser,
          isEdit: false,
          allDataUser: this.allDataUser,
          allUser: this.allUser
        }
      })
      .afterClosed()
      .subscribe((resp) => {
        this.isFirsLoad = true
        this.getCategoryFilterDropdown()
        this.getAllCompanyComment()
      });
  }
  edit(comment) {
    this.subs.sink = this.dialog
      .open(AddCompanyNoteDialogComponent, {
        width: '900px',
        minHeight: '100px',
        disableClose: true,
        panelClass: 'no-padding-pop-up',
        data: {
          companyId: this.companyId,
          companyEntityId: this.companyEntityId,
          currentUser: this.currentUser,
          isEdit: true,
          commentId: comment._id,
          allDataUser: this.allDataUser,
          allUser: this.allUser
        }
      })
      .afterClosed()
      .subscribe((resp) => {
        this.isFirsLoad = true
        this.getAllCompanyComment()
        this.getCategoryFilterDropdown()
      });
  }
  delete(id) {
    this.isWaitingForResponse = true
    let timeDisabled = 5
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Delete_Comment.title'),
      text: this.translate.instant('Delete_Comment.text'),
      allowEscapeKey: true,
      showCancelButton: true,
      footer: `<span style="margin-left: auto">Delete_Comment</span>`,
      confirmButtonText: this.translate.instant('Delete_Comment.YES', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('Delete_Comment.Cancel'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('Delete_Comment.YES') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('Delete_Comment.YES');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then(confirm => {
      if (confirm.value) {
        this.subs.sink = this.companyService.DeleteCompanyNote(id).subscribe(resp => {
          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo'),
              confirmButtonText: this.translate.instant('OK'),
              allowOutsideClick: false,
              allowEscapeKey: false,
            }).then((res) => {
              if (res.value) {
                this.isFirsLoad = true
                this.getAllCompanyComment()
                this.getCategoryFilterDropdown()
              }
            });
          }
          this.isWaitingForResponse = false
        })
      }
      this.isWaitingForResponse = false
    })
  }
  addReply(comment) {

    let payload = comment
    payload.note = this.commentForm.value
    payload.created_by = this.currentUser._id
    payload.reply_for_note_id = payload._id
    if (payload && payload.tagged_user_ids && payload.tagged_user_ids.length) {
      payload.tagged_user_ids = payload.tagged_user_ids.map((ressp) => ressp._id);
    } else {
      payload.tagged_user_ids = null;
    }
    payload.is_reply = true
    if (this.companyId) {
      payload.company_id = this.companyId
    } else if (this.companyEntityId) {
      payload.company_entity_id = this.companyEntityId
    }
    delete payload.reply_note_ids;
    delete payload.date_created
    delete payload._id

    this.isWaitingForResponse = true
    this.subs.sink = this.companyService.CreateCompanyNote(payload).subscribe(resp => {

      if (resp) {
        this.reset()
        this.isWaitingForResponse = false
      }
    })
  }
  reply(comment) {
    this.subs.sink = this.dialog
      .open(ReplyCompanyNoteDialogComponent, {
        width: '900px',
        minHeight: '100px',
        disableClose: true,
        panelClass: 'grey-mode-pop-up',
        data: {
          companyId: this.companyId,
          companyEntityId: this.companyEntityId,
          commentId: comment._id,
          currentUser: this.currentUser,
          allDataUser: this.allDataUser,
          allUser: this.allUser

        }
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getAllCompanyComment()
      });

  }
  reset() {
    this.isReset = true
    this.filteredValues = {
      company_id: '',
      company_entity_id: '',
      note_body: '',
      created_by: '',
      date_note_created: '',
      category: '',
    };
    this.commentForm.setValue('', { emitEvent: false });
    this.categoryFilter.setValue(null, { emitEvent: false });
    this.dateFilter.setValue(null, { emitEvent: false });
    this.userFilter.setValue(null, { emitEvent: false });
    this.commentFilter.setValue(null, { emitEvent: false });
    this.getCategoryFilterDropdown()
    this.getAllCompanyComment()
  }
  isForm() {
    if (!this.commentForm.value) {
      this.certiDegreeService.childrenFormValidationStatus = true;
      return true
    } else {
      this.certiDegreeService.childrenFormValidationStatus = false;
      return false;
    }
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
    clearInterval(this.intVal);
    clearTimeout(this.timeOutVal);
  }


}
