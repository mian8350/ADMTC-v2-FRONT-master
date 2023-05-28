import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { NgxPermissionsService } from 'ngx-permissions';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-rejection-manual-task-dialog',
  templateUrl: './rejection-manual-task-dialog.component.html',
  styleUrls: ['./rejection-manual-task-dialog.component.scss']
})
export class RejectionManualTaskDialogComponent implements OnInit {
  private subs = new SubSink();
  toggleValue = false;
  internalTaskToggle = false;
  form: UntypedFormGroup;
  documents: UntypedFormArray;
  users = [];
  internalChecked;
  private timeOutVal: any;
  isWaitingForResponse = false;
  isUserCertifierAdmin = false;
  isUserCertifierDir = false;
  currentUser: any;
  listUser: any;
  titleList: any;
  originalTitleList: any;
  isCRDir = false;
  isCRAdmin = false;
  rncpTitles: any;
  userTypesList: any;
  userList: any;
  userRecipientList: any;
  rncpTitlesList: any;
  originalUserTypesList: any;
  originalUserList: any;
  originalRncpTitlesList: any;
  isPermission: any;
  selectedTitleId: string[] = [];
  selectedUserTypeId: string[] = [];
  titleReady = false;
  userReady = false;
  userTypeReady = false;
  checked;
  today = new Date();
  constructor(
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private userService: UserService,
    private utilService: UtilityService,
    private auth: AuthService,
    private permission: NgxPermissionsService,
    public permissionService: PermissionService,
    private rncpTitleService: RNCPTitlesService,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
  ) { }

  ngOnInit() {
    this.isPermission = this.auth.getPermission();
    this.isCRAdmin = !!this.permission.getPermission('Certifier Admin');
    this.isCRDir = !!this.permission.getPermission('CR School Director');
    this.currentUser = this.auth.getLocalStorageUser();
    this.isUserCertifierAdmin = this.utilService.isCertifierAdmin();
    this.isUserCertifierDir = this.utilService.isCertifierDirector();
  }


}
