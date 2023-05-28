import { UserService } from 'app/service/user/user.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CoreService } from 'app/service/core/core.service';
import { ApplicationUrls } from 'app/shared/settings';
import { UserEmailDialogComponent } from 'app/users/user-email-dialog/user-email-dialog.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-user-cards',
  templateUrl: './user-cards.component.html',
  styleUrls: ['./user-cards.component.scss'],
})
export class UserCardsComponent implements OnInit {
  @Input() userList;
  @Input() selectedUserId;
  @Output() selectedUserChange = new EventEmitter<string>();
  @Input() load
  maleCandidateIcon = '../../../../../assets/img/student_icon.png';
  femaleCandidateIcon = '../../../../../assets/img/student_icon_fem.png';
  neutralStudentIcon = '../../../../../assets/img/student_icon_neutral.png';
  userProfilePic = '../../../../../assets/img/user-1.jpg';
  userProfilePic1 = '../../../../../assets/img/user-3.jpg';
  userProfilePic2 = '../../../../../assets/img/user-5.jpg';
  greenHandShakeIcon = '../../../../../assets/img/hand-shake-green.png';
  redHandShakeIcon = '../../../../../assets/img/hand-shake-red.png';
  blackHandShakeIcon = '../../../../../assets/img/hand-shake-black.png';
  orangeHandShakeIcon = '../../../../../assets/img/hand-shake-orange.png';
  greyHandShakeIcon = '../../../../../assets/img/hand-shake-grey.png';

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  myInnerHeight = 1920;
  isWaitingForResponse = false;
  constructor(private coreService: CoreService, private dialog: MatDialog, private userService: UserService, private translate: TranslateService) { }
  ngOnInit() {
    this.coreService.sidenavOpen = false;
  }
  selectUser = (userId) => {
    if (this.selectedUserId !== userId) {
      if (!this.userService.childrenFormValidationStatus) {
        return this.fireUnsavedDataWarningSwal(userId);
      } else {
        this.selectedUserId = userId;
        this.selectedUserChange.emit(this.selectedUserId);
        this.userService.childrenFormValidationStatus = true
      }
    }
  };

  fireUnsavedDataWarningSwal(userId) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      footer: `<span style="margin-left: auto">TMTC_S01</span>`,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        return false;
      } else {
        this.userService.childrenFormValidationStatus = true;
        this.selectedUserId = userId;
        this.selectedUserChange.emit(this.selectedUserId);
        return true
      }
    });
  }


  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 251;
    return this.myInnerHeight;
  }

  // *************** To Get Height window screen and put in style css height
  getCardHeight() {
    this.myInnerHeight = window.innerHeight - 263;
    return this.myInnerHeight;
  }

  sendMail(data) {
    this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: data,
    });
  }
}
