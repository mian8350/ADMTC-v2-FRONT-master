import { UtilityService } from './../../../../../service/utility/utility.service';
import { SubSink } from 'subsink';
import { SchoolService } from 'app/service/schools/school.service';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { ApplicationUrls } from 'app/shared/settings';
import * as moment from 'moment';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';

@Component({
  selector: 'ms-commentaries-reply-dialog',
  templateUrl: './commentaries-reply-dialog.component.html',
  styleUrls: ['./commentaries-reply-dialog.component.scss']
})
export class CommentariesReplyDialogComponent implements OnInit {
  replies: any
  isWaitingForResponse: Boolean = false

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  maleStudentIcon = '../../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../../assets/img/student_icon_fem.png';

  commentForm = new UntypedFormControl(null);

  private subs = new SubSink();
  public Editor = DecoupledEditor;
  allUser;
  public config = {
    placeholder: this.translate.instant('Answer'),
    height: '20rem',
    toolbar: [],
  };

  constructor(
    public dialogRef: MatDialogRef<CommentariesReplyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService,
    private schoolService: SchoolService,
    private utilService: UtilityService
  ) { }

  ngOnInit() {

    this.getComment()
    this.config['mention'] = {
      feeds: [
        {
          marker: '@',
          feed: (query) => this.getFeedItems(query),
          minimumCharacters: 3
        },
      ],
    };
  }

  getComment() {
    this.isWaitingForResponse = true
    this.subs.sink = this.schoolService.GetOneStudentComment(this.data.commentId).subscribe(resp => {
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


  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  addReply(comment) {

    let payload = comment
    payload.comment = this.commentForm.value
    payload.created_by = this.data.currentUser._id
    payload.student_id = this.data.studentId
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
        this.isWaitingForResponse = false
        this.commentForm.setValue(null,{emitEvent:false})
        this.getComment()
      }
    })
  }


  closeDialog() {
    this.dialogRef.close()
  }

}
