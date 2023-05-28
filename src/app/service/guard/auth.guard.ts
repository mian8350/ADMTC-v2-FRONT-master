import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { NgxPermission } from 'ngx-permissions/lib/model/permission.model';
import { NgxPermissionsService } from 'ngx-permissions';
import * as _ from 'lodash';
import { PermissionService } from '../permission/permission.service';
import { AuthService } from '../auth-service/auth.service';
import { UtilityService } from '../utility/utility.service';
import { SubSink } from 'subsink';

@Injectable({
  providedIn: 'root',
})
export class PermissionGuard implements CanActivate {
  private subs = new SubSink();
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private permissions: NgxPermissionsService,
    public permissionService: PermissionService,
    private authService: AuthService,
    private utilService: UtilityService,
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const expectedPermission = route.data.permission;
    if (expectedPermission) {


      let allow = this.permissionService.showMenu(expectedPermission);

      // *************** Start Exceptions for users that use a module(have access) inside another module(do not have access)
      if (this.permissions.getPermission('Chief Group Academic')) {
        if (expectedPermission === 'rncp_title.show_perm') {
          allow = this.permissionService.showMenu('rncp_title.show_chief_group_perm');
        }
      }
      if (this.permissions.getPermission('Mentor') || this.permissions.getPermission('HR')) {
        if (expectedPermission === 'schools.show_perm') {
          allow = true;
        }
      }
      // *************** End Exceptions for users that use a module(have access) inside another module(do not have access)

      const permissions = this.permissions.getPermissions();

      if (!allow) {
        if (this.permissions.getPermission('Mentor') || this.permissions.getPermission('HR')) {
          this.router.navigate(['/students-card']);
        } else if (this.permissions.getPermission('Chief Group Academic')) {
          this.router.navigate(['/school-group']);
        } else if (this.permissions.getPermission('Student')) {
          this.router.navigate(['/my-file']);
        } else if (
          (permissions.constructor === Object && Object.keys(permissions).length === 0) ||
          !this.permissionService.getEntityPermission()
        ) {
          this.authService.logOut();
        } else if (!this.permissionService.showMenu('rncp_title.show_perm')) {
          this.router.navigate(['/mailbox/inbox']);
        } else {
          this.router.navigate(['/rncpTitles']);
        }
      }
    }


    if (!localStorage.getItem('userProfile')) {
      this.authService.logOut();
    }
    const userData = JSON.parse(localStorage.getItem('userProfile'));
    let isLogin = false;
    let isPasswordSet = false;
    if (userData) {
      isLogin = true;
      if (userData.is_password_set) {
        isPasswordSet = true;
      }

      // logged in so return true
      return true;
    }

    // *************** Get Query Param from link, usually to check from notif link
    let userId = '';
    let setPasswordToken = '';
    let autoLoginEmail = '';
    let autoLoginToken = '';

    if (route.queryParams.hasOwnProperty('userId')) {
      userId = route.queryParams.userId;
    }
    if (route.queryParams.hasOwnProperty('setPasswordToken') && !isLogin && !isPasswordSet) {

      setPasswordToken = route.queryParams.setPasswordToken;
      // setPasswordToken = '';
    }
    if (route.queryParams.hasOwnProperty('email')) {
      autoLoginEmail = route.queryParams.email;
    }
    if (route.queryParams.hasOwnProperty('token')) {
      autoLoginToken = route.queryParams.token;
    }

    // *************** If link has email and password in the link, then we do autologin
    if (autoLoginEmail && autoLoginToken) {

      this.autoLogin(autoLoginEmail, autoLoginToken, state.url);
      return;
    }

    if (userId !== '' && setPasswordToken !== '') {
      // if user from notif and has set password token, route to set-password while store original url
      this.router.navigate([`/session/setPassword/${userId}`], { queryParams: { returnUrl: state.url, token: setPasswordToken } });
    } else {
      // not logged in so redirect to login page with the return url
      this.router.navigate(['/session/login'], { queryParams: { returnUrl: state.url } });
    }
    return false;
  }

  private autoLogin(email: string, token: string, originalUrl) {
    this.subs.unsubscribe();
    this.subs.sink = this.authService.autoLoginFromAuth(email.toLowerCase()).subscribe(
      (resp) => {
        if (resp) {

          const userLogin = resp;


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

          const temp = userLogin;
          temp.entities = sortedEntities;

          localStorage.setItem('userProfile', JSON.stringify(temp));

          if (permissions && permissions.length) {
            // this.authService.setLocalUserProfileAndToken(resp);
            this.authService.setLocalUserProfileAndToken({ token: token, user: resp });
            this.authService.setPermission(permissions);
            this.permissions.flushPermissions();
            this.permissions.loadPermissions(permissions);


            const cleanedUrl = originalUrl.split('?')[0];
            this.router.navigateByUrl(cleanedUrl);
          } else {
            this.authService.logOut();
          }
        } else {
          this.authService.logOut();
        }
      },
      (err) => {
        this.authService.logOut();
      },
    );
  }
}
