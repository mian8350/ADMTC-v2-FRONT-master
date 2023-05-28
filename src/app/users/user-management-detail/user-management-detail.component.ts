import { UtilityService } from './../../service/utility/utility.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { CoreService } from 'app/service/core/core.service';
import { Observable, of } from 'rxjs';
import { debounceTime, startWith, take, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { UserService } from 'app/service/user/user.service';
import { UsersService } from 'app/service/users/users.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'ms-user-management-detail',
  templateUrl: './user-management-detail.component.html',
  styleUrls: ['./user-management-detail.component.scss'],
})
export class UserManagementDetailComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  isWaitingForResponse: Boolean = true;
  selectedMentor: any = null;
  selectedAdmissionMember: any = null;
  admissionMemberList = [];
  dataCount = 0;
  private selectedIndex;
  titleList = []
  schoolsList = [];
  listObjective = [];
  levels = [];
  school = [];
  title = []
  class = []
  classList = []
  intakeChannelList = [];
  school_ids
  title_ids
  status
  admissionMemberFilteredList: Observable<any>;
  admissionMemberFilter = new UntypedFormControl('');
  mentorFilter = new UntypedFormControl('');
  mentorFilteredList: Observable<any>;
  classFilter = new UntypedFormControl(null);
  classFilteredList: any[];
  schoolFilter = new UntypedFormControl(null);
  schoolsFilteredList: any[];
  titleFilter = new UntypedFormControl(null);
  titleFilteredList: any[];
  userFilter = new UntypedFormControl('');
  intakeChannelFilter = new UntypedFormControl('');
  intakeChannelFilteredList: Observable<any>;
  searchByNameFilter = new UntypedFormControl('');
  myInnerHeight = 1920;
  currSelectedUserId = '';
  currSelectedUser: any;
  userList = [];
  tab = '';
  filteredValues = {
    last_name: null,
    school: null,
    title: null,
    class_id: null,
    school_type: null,
    exclude_company: null,
    is_for_school_staff: null,
    user_type_login: null
  };
  isFirstLoad = true;
  isReset = false;
  isUserADMTC: boolean
  PClist
  sortValue = null;
  private subs = new SubSink();
  maleCandidateIcon = '../../../../../assets/img/student_icon.png';
  femaleCandidateIcon = '../../../../../assets/img/student_icon_fem.png';
  neutralStudentIcon = '../../../../../assets/img/student_icon_neutral.png';
  userProfilePic = '../../../../../assets/img/user-1.jpg';
  userProfilePic1 = '../../../../../assets/img/user-3.jpg';
  userProfilePic2 = '../../../../../assets/img/user-5.jpg';
  greenHeartIcon = '../../../../../assets/img/enagement_icon_green.png';
  isPermission: any;
  currentUser: any;
  currentUserTypeId: any;
  schoolType: any
  exclude_company;
  isReload = false
  selectedUserId = null
  isDeactive = false

  constructor(
    private route: ActivatedRoute,
    private pageTitleService: PageTitleService,
    private translate: TranslateService,
    private coreService: CoreService,
    private usersService: UsersService,
    private userService: UserService,
    private authService: AuthService,
    private utilService: UtilityService
  ) { }

  ngOnInit() {
    this.status = null
    this.isReload = false
    this.route.queryParams.subscribe((query) => {
      this.sortValue = query.sortValue || null;
      this.tab = query.tab;
      const isDeactive = query.isFromActiveUserTab
      if (query.userId) {
        if (isDeactive === "false") {
          this.status = 'deleted'
        }
        this.getOneUser(query.userId);
      } else {
        this.getAllUsers()
      }
      this.updatePageTitle();
      this.coreService.sidenavOpen = false;
    });

    this.isPermission = this.authService.getPermission();
    this.currentUser = this.authService.getLocalStorageUser();
    const currentUserEntity = this.currentUser.entities.find((resp) => resp.type.name === this.isPermission[0]);
    this.currentUserTypeId = currentUserEntity.type._id;
    this.isUserADMTC = this.utilService.isUserEntityADMTC()
    this.getUser()
    this.getDataForList();
    this.initFilter();
  }

  updatePageTitle() {
    this.pageTitleService.setTitle(this.translate.instant('User Card'));
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.pageTitleService.setTitle(this.translate.instant('User Card'));
    });
  }

  ngAfterViewInit() {
    this.coreService.sidenavOpen = false;
    this.subs.sink = this.paginator.page
      .pipe(
        tap(() => {
          if (!this.isFirstLoad && !this.isReload) {
            this.getAllUsers();
          } else {
            this.isReload = false
          }
        }),
      )
      .subscribe();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 231;
    return this.myInnerHeight;
  }
  // *************** To Get Height window screen and put in style css height
  getCardHeight() {
    this.myInnerHeight = window.innerHeight - 200;
    return this.myInnerHeight;
  }
  initFilter() {
    this.subs.sink = this.userFilter.valueChanges.pipe(debounceTime(400)).subscribe((searchTxt) => {
      if (searchTxt === '') {
        this.filteredValues.last_name = '';
        this.getAllUsers();
      } else {
        this.filteredValues.last_name = searchTxt === 'All' ? '' : searchTxt;
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getAllUsers();
        }
      }
    });

    this.subs.sink = this.schoolFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.school = statusSearch === '' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      this.filteredValues.title = ''
      this.filteredValues.class_id = ''
      if (!this.isReset) {
        this.getAllUsers();
      }
    });

    this.subs.sink = this.titleFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.title = statusSearch === '' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      this.filteredValues.class_id = ''
      if (!this.isReset) {
        this.getAllUsers();
      }
    });

    this.subs.sink = this.classFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.class_id = statusSearch === '' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllUsers();
      }
    });
  }

  getOneUser(userId: string) {
    this.isWaitingForResponse = true;
    this.userList = []
    this.subs.sink = this.userService.getOneUserCard(userId, this.status).subscribe(
      (user) => {
        if (user) {
          this.isWaitingForResponse = false;
          this.userList.unshift(user);
          this.getAllUsers(true); // fetch the rest of the users..
        } else {
          this.userList = []
          this.isWaitingForResponse = false
        }
      },
      (error) => {

        this.isWaitingForResponse = false;
      },
    );
  }

  getUser() {
    const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
    let titleUser;
    let schoolUser;
    this.schoolType = null
    if (!this.isUserADMTC) {
      const isCR = this.usersService.CRList.find(el => el.name === userType)
      const isPC = this.usersService.PCList.find(el => el.name === userType)
      if (isCR) {
        this.filteredValues.school_type = this.currentUser.entities ? this.currentUser.entities[0].school_type : null;
        this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
          const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
          this.filteredValues.title = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        })
        schoolUser = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
        this.filteredValues.school = schoolUser
        this.filteredValues.exclude_company = true
      } else if (isPC) {
        this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
          const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
          this.filteredValues.title = this.filteredValues.title ? this.filteredValues.title : this.utilService.getAcademicAllAssignedTitle(dataUSer);
        })
        schoolUser = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
        this.filteredValues.school = this.filteredValues.school ? this.filteredValues.school : schoolUser
        this.filteredValues.is_for_school_staff = true;
        this.filteredValues.user_type_login = this.utilService.getCurrentUserType()
        this.filteredValues.exclude_company = true
        this.PClist = this.usersService.PCList.map(el => el._id)
      }
    }
  }
  reload(event) {
    this.selectedUserId = null
    this.selectedUserId = this.currSelectedUserId
    this.currSelectedUserId = null
    this.isReload = true
    this.isDeactive = null
    if (event.deactivation) {
      this.isDeactive = true
    }
    if (event.reload) {
      this.getAllUsers()
    }

  }

  getAllUsers(queryParamHasUserId: boolean = false) {
    this.isWaitingForResponse = true;
    if (!this.isUserADMTC && !this.filteredValues.school && !this.filteredValues.title) {
      this.getUser()
    }

    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    this.subs.sink = this.usersService.getAllUserManagement(pagination, this.sortValue,
      this.filteredValues.last_name, this.filteredValues.school, this.filteredValues.title, this.filteredValues.class_id,
      this.filteredValues.exclude_company, this.filteredValues.school_type,
      this.filteredValues.is_for_school_staff, this.filteredValues.user_type_login, this.PClist, this.status).subscribe(
        (users: any) => {
          if (users && users.length) {
            if (queryParamHasUserId) {
              this.userList = _.uniqBy([...this.userList].concat(_.cloneDeep(users)), '_id');
              // this.userList.push(resp); // this will be in the form of [{}, []]
              // this.userList = [].concat(...this.userList); // flatten array above with the user data fetched from param
              // this.userList = _.uniqBy([...this.userList], '_id'); // make it unique by id to prevent displaying duplicates
            } else {
              this.userList = users;
            }
            if (!this.isReload) {
              this.currSelectedUser = this.userList[0];
              this.currSelectedUserId = this.currSelectedUser._id || null;
            } else {
              this.currSelectedUserId = this.isDeactive ? "" : this.selectedUserId;
            }
            this.paginator.length = users[0].count_document;
            this.dataCount = users && users.length > 0 && users[0].count_document ? users[0].count_document : 0;
          } else {
            this.userList = [];
            this.currSelectedUser = null
            this.currSelectedUserId = null
            this.paginator.length = 0;
          }
          this.isFirstLoad = false;
          this.isReset = false;
          this.isWaitingForResponse = false;
        },
        (err) => {
          this.isWaitingForResponse = false;
          this.userList = [];
          this.paginator.length = 0;
          this.isReset = false;
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        },
      );
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key] || filterData[key] === false) {
        filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
      }
    });
    return 'filter: {' + filterQuery + '}';
  }

  updatedSelectedUser(newSelection) {
    this.currSelectedUserId = null;
    this.currSelectedUserId = newSelection;
    const filteredUser = this.userList.filter((user) => newSelection === user._id);
    this.currSelectedUser = filteredUser[0];
  }
  resetUsers() {
    this.isReset = true;
    this.paginator.pageIndex = 0;

    this.titleList = []
    this.filteredValues = {
      last_name: null,
      school: null,
      title: null,
      class_id: null,
      school_type: null,
      exclude_company: null,
      is_for_school_staff: null,
      user_type_login: null
    };
    this.userFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue(null, { emitEvent: false });
    this.titleFilter.setValue(null, { emitEvent: false });
    this.classFilter.setValue(null, { emitEvent: false });
    this.sortValue = null;
    this.getAllUsers();
  }

  getDataForList() {
    let title_ids = null;
    let schoolIds = null;
    if (this.isUserADMTC) {
      this.getSchool()
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        this.title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.school_ids = this.utilService.getAcademicAllAssignedSchool(dataUSer);
        this.getSchool()
      })
    }

  }
  getSchool() {
    this.isWaitingForResponse = true
    this.subs.sink = this.userService.getAllSchool(this.school_ids).subscribe(resp => {
      this.school = resp.sort((a, b) => a.short_name.toLowerCase() > b.short_name.toLowerCase() ? 1 : a.short_name.toLowerCase() < b.short_name.toLowerCase() ? -1 : 0)
      this.isWaitingForResponse = false
      this.titleFilter.setValue(null, { emitEvent: false });
    })
  }
  getTitle() {
    if (!this.schoolFilter.value) {
      this.titleFilter.setValue(null, { emitEvent: false })
    }
    if (this.schoolFilter.value) {
      const school_id = this.schoolFilter.value
      this.subs.sink = this.userService.GetAllTitles(this.title_ids, school_id).subscribe(resp => {
        if (resp) {
          this.title = resp.sort((a, b) => a.short_name.toLowerCase() > b.short_name.toLowerCase() ? 1 : a.short_name.toLowerCase() < b.short_name.toLowerCase() ? -1 : 0)
          this.listObjective = this.title
          this.getDataClass()
        }
      })
    }
  }

  getDataClass() {
    this.classList = [];
    if (this.classFilter.value) {
      this.classFilter.setValue(null, { emitEvent: false });
    }
    if (this.titleFilter.value) {
      const titleL = this.titleFilter.value;
      const sList = this.listObjective.filter((list) => {
        return titleL.includes(list._id);
      });
      sList.filter((el, n) => {
        if (el.classes && el.classes.length) {
          el.classes.filter((elem, nex) => {
            this.classList.push(elem);
          });
        }
      });
      this.classList = this.classList.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0)
    } else {
      this.classList = [];
    }

    this.class = _.uniqBy(this.classList, 'name');
  }
}