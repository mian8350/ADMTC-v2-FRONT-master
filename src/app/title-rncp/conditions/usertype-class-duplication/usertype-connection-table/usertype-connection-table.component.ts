import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { map } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-usertype-connection-table',
  templateUrl: './usertype-connection-table.component.html',
  styleUrls: ['./usertype-connection-table.component.scss'],
})
export class UsertypeConnectionTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() classData;
  @Input() currentClassId;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  displayedColumns: string[] = ['name', 'school', 'userType', 'class'];
  filterColumns: string[] = ['nameFilter', 'schoolFilter', 'userTypeFilter', 'classFilter'];
  private subs = new SubSink();
  currentClass = '';
  rncpId;
  @Output() triggerRefresh = new EventEmitter<Boolean>();
  @Output() triggerSpinner = new EventEmitter<Boolean>();

  isReset = false;
  isWaitingForResponse = false;
  noData: any;
  usersCount = 0;

  dataSource = new MatTableDataSource([]);

  nameFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl(null);

  filteredValues = {
    name: null,
    school: null,
  };
  private timeOutVal: any;

  usersData: any;
  schoolList: any = [];

  acadDirId = '5a2e1ecd53b95d22c82f9554';

  constructor(
    private router: ActivatedRoute,
    private rncpService: RNCPTitlesService,
    private translate: TranslateService,
    private utilService: UtilityService,
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    this.currentClass = this.classData ? this.classData.name : '';
    this.rncpId = this.router.snapshot.paramMap.get('rncpId');


    this.getUserTypeTable();
    this.initFilter();
  }

  getUserTypeTable() {
    this.isWaitingForResponse = true;
    const originClass = this.classData && this.classData.origin_class ? this.classData.origin_class._id : null;
    const currentClass = this.currentClassId;
    if (originClass) {
      this.subs.sink = this.rncpService.getAllUserConnectWithClass(originClass, currentClass).subscribe(
        (resp) => {
          if (resp) {
            const response = _.cloneDeep(resp);
            if (
              this.classData &&
              this.classData.class_duplication_status &&
              this.classData.class_duplication_status === 'school_connected'
            ) {
              response.forEach((element) => {
                element.connect_to_class = true;
              });
            }

            response.forEach((element) => {
              if (element && element.entity && element.entity.school && element.entity.school.short_name) {
                this.schoolList.push(element.entity.school);
              }
            });

            if (this.schoolList && this.schoolList.length) {
              this.schoolList = _.uniqBy(this.schoolList, '_id');
            }



            const users = _.cloneDeep(response);

            this.dataSource.paginator = this.paginator;
            let sortedUsers = users.map((list) => {
              return {
                connect_to_class: this.classData.class_duplication_status === 'usertype_duplicated' ? list.connect_to_class : true,
                user_id: list.user_id,
                entity: list.entity,
              };
            });
            sortedUsers.sort((a, b) =>
              a.user_id.last_name.toLowerCase() > b.user_id.last_name.toLowerCase()
                ? 1
                : a.user_id.last_name.toLowerCase() < b.user_id.last_name.toLowerCase()
                ? -1
                : 0,
            );

            this.usersData = _.cloneDeep(sortedUsers);
            this.dataSource.data = sortedUsers;
            this.usersCount = users.length;
            this.isWaitingForResponse = false;
          } else {
            this.dataSource.data = [];
            this.paginator.length = 0;
            this.usersCount = 0;
          }
          this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
          this.isReset = false;
          this.isWaitingForResponse = false;
        },
        (err) => {
          this.dataSource.data = [];
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        },
      );
    } else {
      this.dataSource.data = [];
      this.isWaitingForResponse = false;
    }
  }

  initFilter() {
    this.subs.sink = this.nameFilter.valueChanges.subscribe((type) => {
      this.filteredValues['name'] = type;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'last_name':
          return item.user_id ? item.user_id.last_name.toLowerCase() : null;
        case 'userType':
          return item.entity && item.entity.type ? this.translate.instant('USER_TYPES.') + item.entity.type.name : null;
        case 'school':
          return item.entity && item.entity.school ? item.entity.school.short_name : null;
        default:
          return item[property];
      }
    };

    this.dataSource.sort = this.sort;
  }

  // custom filter logic
  customFilterPredicate() {
    return (data, filter: string) => {
      const searchString = JSON.parse(filter);
      const nameFound = searchString.name
        ? data.user_id
          ? data.user_id.last_name.toLowerCase().trim().includes(searchString.name.toLowerCase().trim())
          : false
        : true;
      const schoolFound = searchString.school
        ? data.entity
          ? data.entity.school.short_name.toLowerCase().trim().includes(searchString.school.toLowerCase().trim())
          : false
        : true;

      return nameFound && schoolFound;
    };
  }

  resetTable() {
    this.isReset = true;
    this.paginator.pageIndex = 0;

    this.filteredValues = {
      name: '',
      school: '',
    };

    this.nameFilter.patchValue(null, { emitEvent: false });
    this.schoolFilter.patchValue(null, { emitEvent: false });

    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.getUserTypeTable();
  }

  duplicateUser() {

    this.triggerSpinner.emit(true);
    const payload = this.dataSource.data.map((list) => {
      return {
        user_id: list.user_id._id,
        connect_to_class: list.connect_to_class ? list.connect_to_class : false,
        entity_id: {
          entity_name: list.entity && list.entity.entity_name ? list.entity.entity_name : null,
          school_type: list.entity && list.entity.school_type ? list.entity.school_type : null,
          school: list.entity && list.entity.school ? list.entity.school._id : null,
          companies:
            list.entity && list.entity.companies && list.entity.companies.length ? list.entity.companies.map((comp) => comp._id) : null,
          group_of_schools:
            list.entity && list.entity.group_of_schools && list.entity.group_of_schools.length
              ? list.entity.group_of_schools.map((comp) => comp._id)
              : null,
          group_of_school: list.entity && list.entity.group_of_school ? list.entity.group_of_school._id : null,
          class: list.entity && list.entity.class ? list.entity.class._id : null,
          type: list.entity && list.entity.type ? list.entity.type._id : null,
          assigned_rncp_title: list.entity && list.entity.assigned_rncp_title ? list.entity.assigned_rncp_title._id : null,
        },
      };
    });
    if (payload && payload.length) {
      const userSelected = payload.filter((user) => user.connect_to_class === true);

      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('Duplicate_User.TITLE'),
        html: this.translate.instant('Duplicate_User.TEXT', { user_selected: userSelected.length }),
        footer: `<span style="margin-left: auto">Duplicate_User</span>`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: this.translate.instant('Duplicate_User.BUTTON_1', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('Duplicate_User.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('Duplicate_User.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('Duplicate_User.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.subs.sink = this.rncpService.connectMultipleUserToClass(this.currentClassId, payload).subscribe(
            (resp) => {

              this.triggerSpinner.emit(false);
              this.triggerRefresh.emit(true);
              let schoolListOrder = '';
              if (resp && resp[0] && resp[0].school_has_acad_dir.length !== 0) {
                schoolListOrder += '<ul style="text-align: start; margin-left: 20px">';
                resp[0].school_has_acad_dir.forEach((item) => {
                  if (item && item.short_name) {
                    schoolListOrder += `<li> ${this.utilService.cleanHTML(item.short_name)} </li>`;
                  }
                });
                schoolListOrder += '</ul>';
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('Duplicate_User_2.TITLE'),
                  html: this.translate.instant('Duplicate_User_2.TEXT', { school_name: schoolListOrder }),
                  footer: `<span style="margin-left: auto">Duplicate_User_2</span>`,
                  confirmButtonText: this.translate.instant('Duplicate_User_2.BUTTON'),
                });
              } else {
                Swal.fire({
                  type: 'success',
                  title: 'Bravo!',
                  allowEscapeKey: true,
                  confirmButtonText: 'Okay',
                });
              }
            },
            (err) => {
              this.triggerSpinner.emit(false);
              this.swalError(err);
            },
          );
        } else {
          this.triggerSpinner.emit(false);
        }
      });
    } else {
      this.triggerSpinner.emit(false);
    }
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  CheckActiveTaskInTitleSchoolAndClass(element) {


    if (this.classData && this.classData.class_duplication_status && this.classData.class_duplication_status === 'usertype_duplicated') {
      if (element.entity && element.entity.type._id === this.acadDirId && element.connect_to_class === false) {
        Swal.fire({
          type: 'info',
          title: this.translate.instant('USER_UNCHECK_S1.TITLE'),
          html: this.translate.instant('USER_UNCHECK_S1.TEXT'),
          footer: `<span style="margin-left: auto">USER_UNCHECK_S1</span>`,
          confirmButtonText: this.translate.instant('USER_UNCHECK_S1.BUTTON'),
        }).then(response => {
          if (this.usersData && this.usersData.length !== 0) {
            this.usersData.forEach((item) => {
              if (
                item.user_id &&
                item.entity &&
                element.user_id &&
                element.entity &&
                item.user_id._id === element.user_id._id &&
                item.entity.type._id === element.entity.type._id
              ) {
                item.connect_to_class = true;
              }
            });
          }
          this.dataSource.data = this.usersData;
        })
        // *************** Previously using checkActiveClass,
        // *************** but after [QA-020] change the condition that acad dir will not be allowed to be unchecked
        // this.triggerSpinner.emit(true);
        // this.subs.sink = this.rncpService
        //   .checkActiveTaskInTitleSchoolAndClass(element.user_id._id, this.rncpId, element.entity.school._id, this.currentClassId)
        //   .subscribe(
        //     (resp) => {
        //       this.triggerSpinner.emit(false);
        //       if (resp === true) {
        //         Swal.fire({
        //           type: 'error',
        //           title: this.translate.instant('USERMODIFY_S3.TITLE'),
        //           html: this.translate.instant('USERMODIFY_S3.TEXT'),
        //           confirmButtonText: this.translate.instant('USERMODIFY_S3.BUTTON'),
        //         }).then((resp) => {
        //           if (resp) {
        //             if (this.usersData && this.usersData.length !== 0) {
        //               this.usersData.forEach((item) => {
        //                 if (
        //                   item.user_id &&
        //                   item.entity &&
        //                   element.user_id &&
        //                   element.entity &&
        //                   item.user_id._id === element.user_id._id &&
        //                   item.entity.type._id === element.entity.type._id
        //                 ) {
        //                   item.connect_to_class = true;
        //                 }
        //               });
        //             }
        //             this.dataSource.data = this.usersData;
        //             // this.isWaitingForResponse = false;
        //             // this.triggerSpinner.emit(false);
        //           }
        //         });
        //       }
        //     },
        //     (err) => (this.triggerSpinner.emit(false)),
        //   );
      }
    }
  }
}
