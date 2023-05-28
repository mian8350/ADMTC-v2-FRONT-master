import { CompanyService } from 'app/service/company/company.service';
import { SubSink } from 'subsink';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { ApplicationUrls } from 'app/shared/settings';
import * as moment from 'moment';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';

@Component({
  selector: 'ms-reply-company-note-dialog',
  templateUrl: './reply-company-note-dialog.component.html',
  styleUrls: ['./reply-company-note-dialog.component.scss']
})
export class ReplyCompanyNoteDialogComponent implements OnInit {
  replies: any
  isWaitingForResponse: Boolean = false
  allUser
  allDataUser

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  maleStudentIcon = '../../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../../assets/img/student_icon_fem.png';

  commentForm = new UntypedFormControl(null);

  private subs = new SubSink();
  public Editor = DecoupledEditor;
  public config = {
    placeholder: this.translate.instant('Answer'),
    height: '20rem',
    toolbar: [],
  };

  constructor(
    public dialogRef: MatDialogRef<ReplyCompanyNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService,
    private companyService: CompanyService
  ) { }

  ngOnInit() {

    this.allDataUser = this.data.allDataUser;
    this.config['mention'] = {
      feeds: [
        {
          marker: '@',
          feed: (query) => this.getFeedItems(query),
          minimumCharacters: 3
        },
      ],
    };
    this.getComment()
  }

  getComment() {
    this.isWaitingForResponse = true
    this.subs.sink = this.companyService.GetOneCompanyNote(this.data.commentId).subscribe(resp => {
      this.replies = resp
      this.isWaitingForResponse = false
    })
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

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  getFeedItems(queryText) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!queryText) {
          this.allUser = this.data.allDataUser.map((newData) => {
            return '@' + newData.last_name + ' ' + newData.first_name;
          }).slice(0, 10);

          resolve(this.allUser);
        } else {
          const itemsToDisplay = this.data.allDataUser.filter((user) => {

            const searchString = queryText.toLowerCase();
            return (user.last_name.toLowerCase().trim().includes(searchString));
          })

          this.allUser = itemsToDisplay.map((newData) => {
            return '@' + newData.last_name + ' ' + newData.first_name;
          });


          resolve(this.allUser);
        }
      }, 50);
    });
  }

  addReply(comment) {

    let payload = comment
    payload.note = this.commentForm.value
    payload.created_by = this.data.currentUser._id
    if (this.data.companyId) {
      payload.company_id = this.data.companyId;
    } else if (this.data.companyEntityId) {
      payload.company_entity_id = this.data.companyEntityId
    }
    payload.reply_for_note_id = payload._id
    payload.is_reply = true
    if (payload && payload.tagged_user_ids && payload.tagged_user_ids.length) {
      payload.tagged_user_ids = payload.tagged_user_ids.map((ressp) => ressp._id);
    } else {
      payload.tagged_user_ids = null;
    }
    delete payload.reply_note_ids;
    delete payload.date_created
    delete payload._id
    this.isWaitingForResponse = true

    this.subs.sink = this.companyService.CreateCompanyNote(payload).subscribe(resp => {
      if (resp) {
        this.isWaitingForResponse = false
        this.getComment()
        this.commentForm.setValue(null, { emitEvent: false })
      }
    })
  }


  closeDialog() {
    this.dialogRef.close()
  }

}
