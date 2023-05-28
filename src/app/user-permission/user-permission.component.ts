import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CoreService } from 'app/service/core/core.service';
import { PermissionService } from 'app/service/permission/permission.service';
import Swal from 'sweetalert2';
import { UserPermissionService } from 'app/service/user-permission/user-permission.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-user-permission',
  templateUrl: './user-permission.component.html',
  styleUrls: ['./user-permission.component.scss'],
})
export class UserPermissionComponent implements OnInit, OnDestroy {
  today: Date;
  private subs = new SubSink();
  isPermission: string[];
  currentUserTypeId: any;
  currentUser: any;
  isWaitingForResponse = false;
  dataUserTypes = [];
  leftLabel = [];
  dataPermission = [];
  countAdmtc = 0;
  countAcademicCR = 0;
  countAcademicPC = 0;
  countCompany = 0;
  countGroup = 0;
  startAdmtc = 0;
  startAcademicCR = 0;
  startAcademicPC = 0;
  startCompany = 0;
  startGroup = 0;

  listUsertypehidden = [
    {
      _id: '5bc066042a35327127ad9dfa',
      name: 'Collaborateur Ext. ADMTC',
    },
    {
      _id: '609894ae395d243f3bc19b90',
      name: 'Correcteur CDCM 2021',
    },
    {
      _id: '609894c0395d243f3bc19b91',
      name: 'Correcteur CDCM BA 2021',
    },
    {
      _id: '609894c7395d243f3bc19b92',
      name: 'Correcteur CGRHP 2021',
    },
    {
      _id: '5cc172e112b9ef6372797b56',
      name: 'Correcteur Croisé DMOE 2017',
    },
    {
      _id: '5cc08ebe35b14e520b7654ed',
      name: 'Correcteur Croisé RMO 2019',
    },
    {
      _id: '5b1ffb5c9e25da6d30bde480',
      name: 'Correcteur PFE Oral',
    },
    {
      _id: '60a21305e9b9795c40175d02',
      name: 'Correcteur croisé CDCM 2021',
    },
    {
      _id: '60a2137ce9b9795c40175d08',
      name: 'Correcteur croisé CDCM BA 2021',
    },
    {
      _id: '60a2133ee9b9795c40175d06',
      name: 'Correcteur croisé CGRHP 2021',
    },
    {
      _id: '60a212cde9b9795c40175d00',
      name: 'Correcteur croisé DMOE 2021',
    },
    {
      _id: '60a20fb4e9b9795c40175ce5',
      name: 'Correcteur croisé RMO 2021',
    },
    {
      _id: '5a2e1ecd53b95d22c82f954d',
      name: 'ADMTC Visitor',
    },
    {
      _id: '6449d79e5e28912e7c010d69',
      name: 'ADMTC Platform',
    },
  ];

  //
  // for sorting like matrix
  allListType = [
    '5a2e1ecd53b95d22c82f954b',
    '5a2e1ecd53b95d22c82f954e',
    '5a2e1ecd53b95d22c82f954c',

    '5a2e1ecd53b95d22c82f954f',
    '5a2e1ecd53b95d22c82f9550',
    '5b210d24090336708818ded1',
    '5a2e1ecd53b95d22c82f9552',
    '5a3cd5e7e6fae44c7c11561e',
    '5a2e1ecd53b95d22c82f9551',
    '5c173695ba179819bd115df1',
    '5e93dd18ef9a2925e85eeb29',
    '606fe9c974c4d62888cc2818',
    '62298c90604bb15fd819bd73',

    '5a2e1ecd53b95d22c82f9554',
    '5a2e1ecd53b95d22c82f9555',
    '6163f6bb3edc852cf45d4bb6',
    '5a2e1ecd53b95d22c82f9559',
    '5a9e7ddf8228f45eb2e9bc77',
    '5a2e1ecd53b95d22c82f9553',
    '5a2e1ecd53b95d22c82f9558',
    '5cdbde9b4b1f6a1b5a0b3fb5',
    '5cdbdeaf4b1f6a1b5a0b3fb6',

    '5a2e603f53b95d22c82f9590',
    '5a2e603c53b95d22c82f958f',
    '5a66cd0813f5aa05902fac1e',
  ];

  constructor(
    private translate: TranslateService,
    private userService: AuthService,
    private fb: UntypedFormBuilder,
    private router: ActivatedRoute,
    private coreService: CoreService,
    public userPermissionService: UserPermissionService,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.coreService.sidenavOpen = false;
    }, 1000);
    this.currentUser = this.userService.getLocalStorageUser();
    this.isPermission = this.userService.getPermission();
    this.pageTitleService.setTitle('User Permission');
    const currentUserEntity = this.currentUser?.entities?.find((resp) => resp?.type?.name === this.isPermission[0]);
    this.currentUserTypeId = currentUserEntity?.type?._id;
    this.getAllUserTypes();
  }

  getAllUserTypes() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userPermissionService.getAllUserTypes().subscribe(
      (resp) => {
        if (resp?.length) {
          resp = resp.filter((res) => {
            const found = this.listUsertypehidden.some((list) => list?._id === res?._id);
            if (!found) {
              return res;
            }
          });

          const listDataAdmtc = [];
          const listDataAcademicCR = [];
          const listDataAcademicPC = [];
          const listDataCompany = [];
          const listDataGroup = [];
          this.countAdmtc = 0;
          this.countAcademicCR = 0;
          this.countAcademicPC = 0;
          this.countCompany = 0;
          this.countGroup = 0;
          resp.forEach((element, idx) => {
            if (element?.entity === 'admtc') {
              this.countAdmtc++;
            } else if (element?.entity === 'academic' && element?.role === 'certifier') {
              this.countAcademicCR++;
            } else if (element?.entity === 'academic' && element?.role === 'preparation_center') {
              this.countAcademicPC++;
            } else if (element?.entity === 'company') {
              this.countCompany++;
            } else if (element?.entity === 'group_of_schools') {
              this.countGroup++;
            }
          });
          resp.forEach((element, idx) => {
            if (element?.entity === 'admtc') {
              element['total'] = this.countAdmtc;
              listDataAdmtc.push(element);
            } else if (element?.entity === 'academic' && element?.role === 'certifier') {
              element['total'] = this.countAcademicCR;
              listDataAcademicCR.push(element);
            } else if (element?.entity === 'academic' && element?.role === 'preparation_center') {
              element['total'] = this.countAcademicPC;
              listDataAcademicPC.push(element);
            } else if (element?.entity === 'company') {
              element['total'] = this.countCompany;
              listDataCompany.push(element);
            } else if (element?.entity === 'group_of_schools') {
              element['total'] = this.countGroup;
              listDataGroup.push(element);
            }
          });

          this.dataUserTypes = [...listDataAdmtc, ...listDataAcademicCR, ...listDataAcademicPC, ...listDataCompany, ...listDataGroup];
          // Sorting
          this.dataUserTypes = this.sortUsertype(this.dataUserTypes);

          this.dataUserTypes.forEach((element, idx) => {
            if (element?.entity === 'admtc') {
              this.startAdmtc = 0;
            } else if (element?.entity === 'academic' && element?.role === 'certifier') {
              if (this.startAcademicCR < 1) {
                this.startAcademicCR = idx;
              }
            } else if (element?.entity === 'academic' && element?.role === 'preparation_center') {
              if (this.startAcademicPC < 1) {
                this.startAcademicPC = idx;
              }
            } else if (element?.entity === 'company') {
              if (this.startCompany < 1) {
                this.startCompany = idx;
              }
            } else if (element?.entity === 'group_of_schools') {
              if (this.startGroup < 1) {
                this.startGroup = idx;
              }
            }
          });
          // console.log('this.dataUserTypes_', this.dataUserTypes);
          this.GetAllUserPermissionTable();
        } else {
          this.isWaitingForResponse = false;
        }
      },
      (err) => {
        this.userService.postErrorLog(err);
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'info',
          title: this.translate.instant('SORRY'),
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  sortUsertype(data) {
    let result;
    // Need to map result to easier loop in table
    result = data.map((resp) => {
      if (this.allListType.includes(resp._id)) {
        resp['index'] = this.checkingIndex(resp._id);
        return resp;
      }
    });

    result = result.sort((a, b) => a.index - b.index);
    result = result.filter((res) => res);
    return result;
  }

  checkingIndex(data) {
    let resultIndex = 0;
    // Need to find index from list of order, to sort header table to be same like matrix
    this.allListType.forEach((resp, index) => {
      if (resp === data) {
        resultIndex = index;
      }
    });
    return resultIndex;
  }

  calculateWidth(total) {
    return (270 * total).toString() + 'px';
  }

  GetAllUserPermissionTable() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userPermissionService.getAllUserPermissions().subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.dataPermission = _.cloneDeep(resp);
          this.leftLabel = [];
          if (resp?.menus?.length) {
            resp.menus.forEach((element) => {
              if (element?.sub_menu?.length) {
                element.sub_menu.forEach((sub, indexSub) => {
                  if (sub?.actions?.length && sub?.name !== 'show_chief_group_perm') {
                    sub.actions.forEach((act, indexAct) => {
                      const data = {
                        menu: element && element.menu ? element.menu : '',
                        sub_menu: sub && sub.name ? sub.name : '',
                        actions: act && act.name ? act.name : '',
                        permissions: sub && sub.permissions_menu ? sub.permissions_menu : '',
                        permissions_action: act && act.permissions_actions ? act.permissions_actions : '',
                        is_action_menu: true,
                        isFirst: true,
                        isShowSubMenu: true,
                      };
                      this.leftLabel.push(data);
                    });
                  } else if (sub?.name !== 'show_chief_group_perm') {
                    let subMenu;
                    if (
                      sub?.name === 'rncp_title' ||
                      sub?.name === 'users' ||
                      sub?.name === 'tutorials' ||
                      sub?.name === 'inapp_tutorials' ||
                      sub?.name === 'promos'
                    ) {
                      subMenu = '';
                    } else {
                      subMenu = sub && sub.name ? sub.name : '';
                    }
                    const data = {
                      menu: element && element.menu ? element.menu : '',
                      sub_menu: subMenu,
                      actions: '',
                      permissions: sub && sub.permissions_menu ? sub.permissions_menu : '',
                      permissions_action: '',
                      is_action_menu: false,
                      isShowSubMenu: true,
                      isFirst: true,
                    };
                    this.leftLabel.push(data);
                  }
                });
              }
            });
          }
          console.log('this.leftLabel', this.leftLabel);
        }
      },
      (err) => {
        this.userService.postErrorLog(err);
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'info',
          title: this.translate.instant('SORRY'),
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageTitleService.setTitle('');
  }
}
