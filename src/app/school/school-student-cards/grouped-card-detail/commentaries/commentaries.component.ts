import { CertidegreeService } from './../../../../service/certidegree/certidegree.service';
import { AuthService } from './../../../../service/auth-service/auth.service';
import { AddCommentaryDialogComponent } from './add-commentary-dialog/add-commentary-dialog.component';
import { SchoolService } from './../../../../service/schools/school.service';
import { Component, DoCheck, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { ApplicationUrls } from 'app/shared/settings';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { CommentariesReplyDialogComponent } from './commentaries-reply-dialog/commentaries-reply-dialog.component';

@Component({
  selector: 'ms-commentaries',
  templateUrl: './commentaries.component.html',
  styleUrls: ['./commentaries.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CommentariesComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();

  @Input() studentId;
  isWaitingForResponse = false;

  form: UntypedFormGroup;
  studentComments: any[] = [];
  filterForm: UntypedFormGroup;
  filteredValues = {
    student_id: '',
    comment_body: '',
    created_by: '',
    date_comment_created: '',
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

  currentUser;
  allDataUser: any;
  allUser: any;
  timeout: any
  intVal: any
  timeOutVal: any

  public Editor = DecoupledEditor;
  public config = {
    placeholder: this.translate.instant('Answer'),
    height: '20rem',
    toolbar: [],
  };

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  neutralStudentIcon = '../../../../../assets/img/student_icon_neutral.png';

  constructor(
    private fb: UntypedFormBuilder,
    private schoolService: SchoolService,
    private dialog: MatDialog,
    private authService: AuthService,
    private translate: TranslateService,
    private certiDegreeService: CertidegreeService
  ) { }

  ngOnInit() {
    this.initForm();
    this.filteredValues.student_id = this.studentId;
    this.filterStudentComment()
    this.getAllStudentComment()
    this.getCategoryFilterDropdown()
    this.currentUser = this.authService.getLocalStorageUser();
    this.commentForm.valueChanges.subscribe(res=>{
      this.isForm()
    })

    this.getAllUsers()
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
      this.getAllStudentComment()
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

  filterStudentComment() {
    this.subs.sink = this.categoryFilter.valueChanges.subscribe((value) => {
      this.filteredValues.category = value ? value : "";
      this.getAllStudentComment();
    });

    this.subs.sink = this.userFilter.valueChanges.subscribe((value) => {
      this.filteredValues.created_by = value ? value : "";
      this.getAllStudentComment();
    });

    this.subs.sink = this.dateFilter.valueChanges.subscribe((value) => {
      this.filteredValues.date_comment_created = value ? value : "";
      this.getAllStudentComment();
    });

    this.subs.sink = this.commentFilter.valueChanges.subscribe((value) => {
      this.filteredValues.comment_body = value ? value : "";
      this.getAllStudentComment();
    });
  }

  getAllStudentComment() {
    this.isWaitingForResponse = true;
    this.studentComments = [];
    // const id = {
    //   student_id: this.studentId
    // }

    this.subs.sink = this.schoolService.GetAllStudentComments(this.filteredValues).subscribe((resp) => {
      if (!resp) {
        this.studentComments = [];
        this.isWaitingForResponse = false;
        return;
      } else {

        this.isWaitingForResponse = false;
        this.studentComments = resp;
        this.getFilterDropdown()
      }
    });
  }

  getCategoryFilterDropdown() {
    this.subs.sink = this.schoolService.GetAllStudentCommentCategories().subscribe((resp) => {
      if (resp && resp.length) {
        this.categoryFilterList = resp;
      }
    });
  }

  getFilterDropdown() {
    if (this.studentComments) {
      this.userFilterList = this.studentComments.map(el => { return { name: el.created_by.first_name + " " + el.created_by.last_name } })
      this.userFilterList = [...new Map(this.userFilterList.map((item) => [item['name'], item])).values()];

      this.dateFilterList = this.studentComments.map(el => { return { date: this.transformDate(el.date_created) } })
      this.dateFilterList = [...new Map(this.dateFilterList.map((item) => [item['date'], item])).values()];


    }
  }

  getAllUsers() {
    this.isWaitingForResponse = true
    this.subs.sink = this.schoolService.getAllUserNote().subscribe(resp => {
      if (resp) {
        this.allDataUser = resp;
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
        this.isWaitingForResponse = false
      }
    })
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

  transformDate(data) {
    if (data) {
      const date = data;
      const datee = moment(date).format('DD/MM/YYYY');
      return datee;
    } else {
      return '';
    }
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
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
    if (this.studentId) {
      // this.filteredValues.student_id = this.studentId
      this.reset()
      // this.getAllStudentComment()
      this.getAllUsers()
    }
  }

  addComment() {
    this.subs.sink = this.dialog
      .open(AddCommentaryDialogComponent, {
        width: '900px',
        minHeight: '200px',
        disableClose: true,
        panelClass: 'no-padding-pop-up',
        data: {
          studentId: this.studentId,
          currentUser: this.currentUser,
          isEdit: false,
          allDataUser: this.allDataUser,
          allUser: this.allUser
        }
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getAllStudentComment()
      });
  }
  edit(comment) {
    this.subs.sink = this.dialog
      .open(AddCommentaryDialogComponent, {
        width: '900px',
        minHeight: '100px',
        disableClose: true,
        panelClass: 'no-padding-pop-up',
        data: {
          studentId: this.studentId,
          currentUser: this.currentUser,
          isEdit: true,
          commentId: comment._id,
          allDataUser: this.allDataUser,
          allUser: this.allUser
        }
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getAllStudentComment()
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
        this.subs.sink = this.schoolService.DeleteStudentComment(id).subscribe(resp => {
          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo'),
              confirmButtonText: this.translate.instant('OK'),
              allowOutsideClick: false,
              allowEscapeKey: false,
            }).then((res) => {
              if (res.value) {
                this.getAllStudentComment()
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
    payload.comment = this.commentForm.value
    payload.created_by = this.currentUser._id
    payload.student_id = this.studentId
    payload.reply_for_comment_id = payload._id
    payload.is_reply = true
    if (payload && payload.tagged_user_ids && payload.tagged_user_ids.length) {
      payload.tagged_user_ids = payload.tagged_user_ids.map((ressp) => ressp._id);
    } else {
      payload.tagged_user_ids = null;
    }
    delete payload.reply_comment_ids;
    delete payload.date_created
    delete payload._id

    this.isWaitingForResponse = true
    this.subs.sink = this.schoolService.CreateStudentComment(payload).subscribe(resp => {

      if (resp) {
        this.getAllStudentComment()
        this.commentForm.setValue('',{emitEvent:false})
        this.isWaitingForResponse = false
      }
    })
  }
  reply(comment) {
    this.subs.sink = this.dialog
      .open(CommentariesReplyDialogComponent, {
        width: '900px',
        minHeight: '100px',
        disableClose: true,
        panelClass: 'grey-mode-pop-up',
        data: {
          studentId: this.studentId,
          commentId: comment._id,
          currentUser: this.currentUser,
          allDataUser: this.allDataUser,
          allUser: this.allUser

        }
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getAllStudentComment()
      });

  }
  reset() {
    this.filteredValues = {
      student_id: this.studentId,
      comment_body: '',
      created_by: '',
      date_comment_created: '',
      category: '',
    };
    this.commentForm.setValue('', { emitEvent: false });
    this.categoryFilter.setValue(null, { emitEvent: false });
    this.getAllStudentComment()
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
