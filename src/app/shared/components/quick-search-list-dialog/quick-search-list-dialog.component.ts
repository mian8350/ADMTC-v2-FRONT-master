import { Router } from '@angular/router';
import { UserService } from './../../../service/user/user.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { UtilityService } from './../../../service/utility/utility.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './../../../service/auth-service/auth.service';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { LoginAsUserDialogComponent } from 'app/shared/components/login-as-user-dialog/login-as-user-dialog.component';
import { PermissionService } from 'app/service/permission/permission.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'environments/environment';
import { StudentsService } from 'app/service/students/students.service';
import * as moment from 'moment';
import { startWith, tap } from 'rxjs/operators';

@Component({
  selector: 'ms-quick-search-list-dialog',
  templateUrl: './quick-search-list-dialog.component.html',
  styleUrls: ['./quick-search-list-dialog.component.scss'],
})
export class QuickSearchListDialogComponent implements OnInit {
  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  displayedColumns: string[] = [];
  filterColumns: string[] = [];

  groupCount = 0;
  noData: any;
  dataSearchingEmail = []
  pageIndex = 0

  sortValue = null;
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;
  isEdit = false;
  isConnect = false;

  isADMTC = false;
  isAcadDirAdmin = false;
  currentUser;
  studentSafeUrl: SafeResourceUrl;
  selectedYear: any;

  isLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<QuickSearchListDialogComponent>,
    private translate: TranslateService,
    private authService: AuthService,
    public dialog: MatDialog,
    private utilService: UtilityService,
    private ngxPermissionService: NgxPermissionsService,
    private userService: UserService,
    private router: Router,
    public permissionService: PermissionService,
    private sanitizer: DomSanitizer,
    private studentService: StudentsService,
  ) {}

  ngOnInit() {
    this.getYearCertificationsList();
    this.studentSafeUrl = this.safeUrl();

    if (this.data && this.data.data && this.data.data.length) {
      if (this.data.type === 'mentor') {
        this.displayedColumns = ['lastName', 'firstName', 'school', 'company', 'action'];
        this.filterColumns = ['lastNameFilter', 'firstNameFilter', 'schoolFilter', 'companyFilter', 'actionFilter'];
      } else if (this.data.type === 'user') {
        this.displayedColumns = ['lastName', 'firstName', 'userType', 'school', 'title', 'action'];
        this.filterColumns = ['lastNameFilter', 'firstNameFilter', 'userTypeFilter', 'schoolFilter', 'titleFilter', 'actionFilter'];
      } else if (this.data.type === 'jury') {
        this.displayedColumns = ['lastName', 'firstName', 'position', 'school', 'title', 'action'];
        this.filterColumns = ['lastNameFilter', 'firstNameFilter', 'positionFilter', 'schoolFilter', 'titleFilter', 'actionFilter'];
      } else if (this.data.type === 'student') {
        this.displayedColumns = ['lastName', 'firstName', 'school', 'title', 'titleStatus', 'action'];
        this.filterColumns = ['lastNameFilter', 'firstNameFilter', 'schoolFilter', 'titleFilter', 'titleStatusFilter','actionFilter'];
      } else if (this.data.type === 'title') {
        this.displayedColumns = ['titleShortName','titleLongName', 'action'];
        this.filterColumns = ['titleShortNameFilter','titleLongNameFilter', 'actionFilter'];
      }else if(this.data.type === 'email'){
        this.displayedColumns = ['lastName', 'firstName', 'userType', 'school', 'title', 'action']
        this.filterColumns = ['lastNameFilter', 'firstNameFilter', 'userTypeFilter', 'schoolFilter', 'titleFilter', 'actionFilter'];
      }else {
        this.displayedColumns = ['school', 'action'];
        this.filterColumns = ['schoolFilter', 'actionFilter'];
      }
      if(this.data?.type==='email'){        
        this.getDataQuickSearchEmail()

      }else{
        this.dataSource.data = this.data.data;
        this.groupCount = this.data.data.length;
        this.dataSource.paginator = this.paginator;

      }

    }
  }

  ngAfterViewInit(){
    this.subs.sink = this.paginator.page
    .pipe(
      startWith(null),
      tap(() => {
        if (this.data?.type === 'email') {
          this.getDataQuickSearchEmail()
        }
      }),
    )
    .subscribe();
  }

  safeUrl() {
    const url = `${environment.studentEnvironment}/session/login`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getDataQuickSearchEmail() { //this function is to get searching data from the BE
    const pagination = {
      page: this.paginator.pageIndex,
      limit: 10
    }
    this.isLoading = true;
    this.subs.sink = this.userService.getUserQuickSearchEmail(this.data.data2.email, this.data.data2.school, this.data.data2.title, pagination).subscribe((resp) => {
      if(resp){
        this.isLoading = false
        this.dataEmail(resp)
      }
      this.groupCount = resp?.length && resp[0]?.count_document ? resp[0].count_document : 0
    })
  }

  dataEmail(data){
    if (data.length){
      const dataEmail = data.map(data=>{
        return {
          ...data,
          isStudent : data?.student_id ? true: false,
          school : data?.student_id ? data?.student_id?.school : null,
          rncp_title: data?.student_id ? data?.student_id?.rncp_title : null
  
        }
      })
      this.dataSource.data = dataEmail
    }
  }


  getUniqueSchools(entities) {
    const entity = _.filter(entities, function (data) {
      return data.school !== null;
    });
    return _.uniqBy(entity, 'school.short_name');
  }

  getUniqueSchoolsCompany(schools) {
    const school = _.filter(schools, function (schoolData) {
      return schoolData !== null;
    });
    return _.uniqBy(school, 'school.short_name');
  }

  renderTooltipSchool(entities: any[]): string {
    let tooltip = '';
    const type = _.uniqBy(entities, 'school.short_name');
    for (const entity of type) {
      if (entity.school) {
        tooltip = tooltip + entity.school.short_name + `, `;
      }
    }
    return tooltip.substring(0, tooltip.length - 2);
  }

  renderTooltipSchoolCompany(schools: any[]): string {
    let tooltip = '';
    const type = _.uniqBy(schools, 'school.short_name');
    for (const school of type) {
      if (school.short_name) {
        tooltip = tooltip + school.short_name + `, `;
      }
    }
    return tooltip.substring(0, tooltip.length - 2);
  }

  getUniqueRncpTitles(entities) {
    return _.uniqBy(entities, 'assigned_rncp_title.short_name');
  }

  renderTooltipTitle(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(entities, 'assigned_rncp_title.short_name');
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity.assigned_rncp_title) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + `${entity.assigned_rncp_title.short_name}`;
        }
      } else {
        if (entity.assigned_rncp_title) {
          tooltip = tooltip + `${entity.assigned_rncp_title.short_name}`;
        }
      }
    }
    return tooltip;
  }

  renderTooltipCompany(companies: any[]): string {
    let tooltip = '';
    const type = _.uniqBy(companies, 'company.company_name');
    for (const company of type) {
      if (company.company_name) {
        tooltip = tooltip + company.company_name + `, `;
      }
    }
    return tooltip.substring(0, tooltip.length - 2);
  }

  editSelection(selectedData) {
    if (this.data.type === 'student') {
      if (selectedData.student_title_status === 'suspended') {
        this.goToStudentSuspended(selectedData);
      } else if (selectedData.student_title_status === 'deactivated') {
        this.goToStudentDeactived(selectedData);
      } else {
        this.goToStudent(selectedData);
      }
    } else if (this.data.type === 'school') {
      this.goToSchool(selectedData);
    } else if(this.data.type === 'user' || this.data.type === 'mentor'){
      this.goToUserCard(selectedData?._id)
    } else if (this.data.type === 'jury') {
      this.goToJury(selectedData);
    } else if(this.data.type === 'title') {
      this.goToTitle(selectedData);
    }else if(this.data?.type === 'email') {
      if(selectedData?.student_id){
        this.goToStudent(selectedData?.student_id)
      }else{
        this.goToUserCard(selectedData._id);
      }
    }
  }
  goToUserCard(userId){
    window.open(`./users/user-management-detail/?userId=${userId}&isFromActiveUserTab=true`, '_blank');
  }

  goToJury(jury) {
    this.isLoading = true;
    if (this.selectedYear) {
      this.isLoading = false;
      window.open(
        `./global-jury-organization/all-jury-schedule?open=all-tab&position=${jury.position}&userData=${jury.last_name}&latestYear=${this.selectedYear}&userId=${jury._id}`,
        '_blank',
      );
    }
  }

  goToUser(user, type) {
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.currentUser = this.authService.getLocalStorageUser();
    if (type === 'mentor') {
      if (this.isADMTC) {
        window.open(`./users/?user=${user._id}`, '_blank');
      } else if (this.isAcadDirAdmin) {

        const schools = this.utilService.getUserAllSchoolAcadDirAdmin();
        const filteredEntities = user.entities.filter(
          (entity) => entity && entity.entity_name === 'company' && entity.companies && entity.companies.length,
        );
        let selectedEntity;

        if (filteredEntities && filteredEntities.length) {
          selectedEntity = filteredEntities[0];


          let selectedCompany;

          if (selectedEntity && selectedEntity.companies && selectedEntity.companies.length) {
            selectedEntity.companies.forEach((company) => {
              if (company && company.school_ids && company.school_ids.length) {
                company.school_ids.forEach((school) => {
                  if (school && school._id && schools.includes(school._id)) {
                    selectedCompany = company;
                  }
                });
              }
            });
          }

          if (selectedCompany) {
            window.open(
              `./companies/branches?selectedCompanyId=${selectedCompany._id}&selectedCompanyName=${selectedCompany.company_name}&selectedMentorId=${user._id}&companyTab=companyStaff`,
              '_blank',
            );
          } else {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('Mentor not Found'),
            });
          }
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('Mentor not Found'),
          });
        }
      }
    } else {
      if (this.isAcadDirAdmin) {

        const entityCurrentUser = this.currentUser.entities[0];
        if (entityCurrentUser) {
          window.open(`./school/${entityCurrentUser.school._id}?open=school-staff&schoolstaff=${user._id}`, '_blank');
        }
      } else {
        window.open(`./users/?user=${user._id}`, '_blank');
      }
    }
  }

  goToSchool(school, extraQueryString?) {
    window.open(`./school/${school._id}?open=school-staff${extraQueryString ? '&' + extraQueryString : ''}`, '_blank');
  }

  goToStudent(student) {
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=student-cards&selectedTab=Identity&selectedSubTab=Identity&studentStatus=active`,
      '_blank',
    );
  }

  goToStudentSuspended(student) {
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=suspended-student&student-name=${student.last_name}`,
      '_blank',
    );
  }

  goToStudentDeactived(student) {
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=deactivated-student&student-name=${student.last_name}`,
      '_blank',
    );
  }

  goToTitle(title){
    window.open(`./rncpTitles/${title?._id}/dashboard`, '_blank');
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getUserType(entities,element?) {
    // ************ if acad dir/mon
    if (entities && this.isUserAcadDirMin(entities)) {
      const temp = this.isUserAcadDirMin(entities);
      return `${this.translate.instant('USER_TYPES.Acad Dir')} ${temp.assigned_rncp_title.short_name}`;
    }
    // ************ if acad dept
    else if (this.isUserAcadDept(entities) && (this.data?.type!=='email' || (this.data?.type==='email' && !element?.isStudent))) {
      const temp = this.isUserAcadDept(entities);
      return `${this.translate.instant('USER_TYPES.Acad Dpt')}`;
    }
    // ************ if certifier admin
    else if (this.isUserCertifierDirMin(entities)) {
      const temp = this.isUserCertifierDirMin(entities);
      return `${this.translate.instant('USER_TYPES.Certifier')} ${temp.assigned_rncp_title.short_name}`;
    }
    // *********** If not all three above
    else {
      const temp = entities[0];
      return `${this.translate.instant('USER_TYPES.' + temp.type.name)}`;
    }
  }

  isUserAcadDirMin(entities) {
    let result = null;
    result = entities.find((entity) => entity && entity.type && entity.type.name === 'Academic Director');
    return result;
  }

  isUserAcadDept(entities) {
    let result = null;
    result = entities.find((entity) => entity && entity.type && entity.type.role === 'preparation_center');
    return result;
  }

  isUserCertifierDirMin(entities) {
    let result = null;
    result = entities.find((entity) => entity && entity.type && entity.type.name === 'Certifier Admin');
    return result;
  }

  sortData(sort: Sort) {}

  connectAsUser(element, type) {

    const currentUser = this.utilService.getCurrentUser();
    let id;
    let unixUserType;
    let unixEntities;
    let unixSchoolType = [];
    let unixSchool = [];
    if (type === 'student') {
      if (element && element.user_id) {
        id = element.user_id._id;
        unixUserType = _.uniqBy(element.user_id.entities, 'type.name');
      }
    } else {
      if (element) {
        id = element._id;
        unixUserType = _.uniqBy(element.entities, 'type.name');
        unixEntities = _.uniqBy(element.entities, 'entity_name');
        if (unixEntities && unixEntities.length && unixEntities[0].entity_name === 'academic') {
          unixSchoolType = _.uniqBy(element.entities, 'school_type');
          unixSchool = _.uniqBy(element.entities, 'school._id');
        }
      }
    }

    if (id && unixUserType.length === 1) {
      this.isConnect = true;
      this.subs.sink = this.authService.loginAsUser(currentUser._id, id).subscribe((resp) => {
        if (resp) {

          const tempUser = resp.user;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('SUCCESS'),
            html: this.translate.instant('USER_S7_SUPERUSER.TEXT', {
              UserCivility: this.translate.instant(element.civility),
              UserFirstName: element.first_name,
              UserLastName: element.last_name,
            }),
            allowEscapeKey: true,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('UNDERSTOOD'),
          }).then((result) => {
            const studentType = '5a067bba1c0217218c75f8ab';
            if (tempUser.entities[0].type._id === studentType) {
              this.authService.connectAsStudent(resp, tempUser.entities[0].type.name, 'ifr');
            } else {
              this.authService.backupLocalUserProfileAndToken();
              this.authService.setLocalUserProfileAndToken(resp);
              this.authService.setPermission([tempUser.entities[0].type.name]);
              this.ngxPermissionService.flushPermissions();
              this.ngxPermissionService.loadPermissions([tempUser.entities[0].type.name]);
              this.userService.reloadCurrentUser(true);
              if (this.ngxPermissionService.getPermission('Mentor') || this.ngxPermissionService.getPermission('HR')) {
                this.router.navigate(['/students-card']);
              } else if (this.ngxPermissionService.getPermission('Chief Group Academic')) {
                this.router.navigate(['/school-group']);
              }
              // else if (this.ngxPermissionService.getPermission('Student')) {
              //   this.router.navigate(['/my-file']);
              // }
              else {
                this.router.navigate(['/rncpTitles']);
              }
              this.closeDialog();
            }
          });
        } else {
          this.isConnect = false;
        }
      });
    } else {
      this.dialog
        .open(LoginAsUserDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '615px',
          data: element,
        })
        .afterClosed()
        .subscribe((resp) => {
          this.closeDialog();
        });
    }
  }

  getYearCertificationsList() {
    this.subs.sink = this.studentService.getListYearOfCertifications().subscribe((res) => {
      let tempList: any;
      const currentYear = moment().year();
      tempList = _.cloneDeep(res).filter((year) => year && year.year && Number(year.year) <= currentYear);
      const selectedYearOfYear = tempList.reverse().find((year) => year && year.has_completed_student);
      this.selectedYear = selectedYearOfYear.year;
    });
  }
}
