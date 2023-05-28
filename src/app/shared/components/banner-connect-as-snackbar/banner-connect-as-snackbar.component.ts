import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserService } from 'app/service/user/user.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { debounceTime } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { CoreService } from 'app/service/core/core.service';

@Component({
  selector: 'ms-banner-connect-as-snackbar',
  templateUrl: './banner-connect-as-snackbar.component.html',
  styleUrls: ['./banner-connect-as-snackbar.component.scss'],
})
export class BannerConnectAsSnackbarComponent implements OnInit, OnDestroy {
  currentUser;
  isWaitingForResponse = false;
  private subs = new SubSink();
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    public authService: AuthService,
    private ngxPermissionService: NgxPermissionsService,
    private router: Router,
    private userService: UserService,
    private _snackRef: MatSnackBarRef<BannerConnectAsSnackbarComponent>,
    public utilService: UtilityService,
    public tutorialService: TutorialService,
    public coreService: CoreService,
  ) {}

  ngOnInit() {

    // this.currentUser = this.data.currentUser;
    this.currentUser = JSON.parse(localStorage.getItem('userProfile'));
    this.subs.sink = this.authService.isConnectAsUser$.pipe(debounceTime(100)).subscribe((resp) => {

      if (!resp) {
        this.dismiss();
      }
    });
  }

  backToPreviousLogin() {
    this.isWaitingForResponse = true;
    const user = _.cloneDeep(JSON.parse(localStorage.getItem('backupUser')));
    this.authService.loginAsPreviousUser();

    const userLogin = user;

    const entities = userLogin.entities;

    const sortedEntities = this.utilService.sortEntitiesByHierarchy(entities);
    const permissions = [];
    const permissionsId = [];
    if (sortedEntities && sortedEntities.length > 0) {
      sortedEntities.forEach((entity) => {

        permissions.push(entity.type.name);
        permissionsId.push(entity.type._id);
      });
    }
    this.authService.setPermission([permissions[0]]);
    this.ngxPermissionService.flushPermissions();
    this.ngxPermissionService.loadPermissions([permissions[0]]);

    // Close the tutorial dialog when logout
    this.tutorialService.setTutorialView(null);
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;

    this.userService.reloadCurrentUser(true);
    this.redirectPage();
  }

  redirectPage() {
    this.router.navigateByUrl('/mailbox/inbox', { skipLocationChange: true }).then(() => {
      if (this.ngxPermissionService.getPermission('Mentor') || this.ngxPermissionService.getPermission('HR')) {
        this.router.navigate(['/students-card']);
      } else if (this.ngxPermissionService.getPermission('Chief Group Academic')) {
        this.router.navigate(['/school-group']);
      } else if (this.ngxPermissionService.getPermission('Student')) {
        this.router.navigate(['/my-file']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  dismiss() {
    this._snackRef.dismiss();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
