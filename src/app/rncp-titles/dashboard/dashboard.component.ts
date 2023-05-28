import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { AcademicKitService } from '../../service/rncpTitles/academickit.service';
import { SubSink } from 'subsink';
import { RncpTitleCardData } from '../RncpTitle.model';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SetupAcademicKitDialogComponent } from '../rncp-titles/setup-academic-kit-dialog/setup-academic-kit-dialog.component';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { AcadKitFolder } from './academic-kit.model';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import * as _ from 'lodash';
import { CalendarComponent } from './calendar/calendar.component';
import { PendingTaskComponent } from './pendingtask/pendingtask.component';
import { DomSanitizer } from '@angular/platform-browser';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { ApplicationUrls } from 'app/shared/settings';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, UntypedFormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  rncpTitle: RncpTitleCardData;
  positionStack = [];
  displayModifyMode = false;
  acadKitFolders: AcadKitFolder[] = [];
  isWaitingForResponse = false;
  selectedFolderId: string;
  customRootFolderIndex: number;
  classList = [];
  isUserAdmtc = false;
  isTask = false;
  isEvent = false;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isUserPCSchool = false;
  isUserChiefGroupAcademic = false;
  isDataUserAcadir: any;

  // Checking Data Task and Calendar
  CurUser: any;
  schoolId: any;
  entityData: any;
  noTaskAndEvent = false;
  noTaskAndCalendar = false;
  isUserVisitor = false;

  private subs = new SubSink();

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  selectedClass: any;
  isLoading = false;

  @ViewChildren('colTaskCalender') taskCalender: QueryList<ElementRef>;
  @ViewChildren('colAcadKit') acadKit: QueryList<ElementRef>;
  @ViewChildren('headerAcadKit') acadKitHeader: QueryList<ElementRef>;

  titleClassesFilter = new FormControl('');
  filteredClass;
  classListPillbox = [];
  classListSelection = [];
  heightAcadKit: any;
  headerAcad: any;

  quickSearchAcadKit = new UntypedFormControl('');

  constructor(
    private rncpTitlesService: RNCPTitlesService,
    private academicKitService: AcademicKitService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private utilService: UtilityService,
    private sanitizer: DomSanitizer,
    private pageTitleService: PageTitleService,
    private permissions: NgxPermissionsService,
    public permissionService: PermissionService,
    private translate: TranslateService,
  ) {
    // setInterval(()=> { this.getDataElement() }, 2000);
  }

  ngOnInit() {
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permissions.getPermission('Academic Admin');
    this.isUserPCSchool = !!this.permissions.getPermission('PC School Director');
    this.isUserChiefGroupAcademic = !!this.permissions.getPermission('Chief Group Academic');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.CurUser = this.authService.getLocalStorageUser();
    if (this.route.snapshot.queryParamMap.get('schoolId')) {
      this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    }
    this.subs.sink = this.route.paramMap.subscribe((param) => {
      const titleId = param.get('titleId');
      this.subs.sink = this.rncpTitlesService.getOneTitleById(titleId).subscribe((resp) => {
        if (resp) {
          this.rncpTitle = resp;
          this.rncpTitlesService.setSelectedTitle(this.rncpTitle);
          this.pageTitleService.setIcon('import_contacts');
          this.fetchClassesForThisTitle(this.rncpTitle._id);
        }
      });
    });

    // to check if acad kit need to be refreshed
    this.subs.sink = this.academicKitService.isAcadKitRefreshed$.subscribe((refreshData) => {
      if (refreshData) {
        this.getAcadKitRootFolder();
        this.academicKitService.refreshAcadKit(false);
      }
    });
    this.loadingDownloadDocuments();
    this.filteredClass = this.titleClassesFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => this.classListSelection.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))),
    );
  }

  ngAfterViewInit() {
    this.taskCalender.changes.pipe(startWith(null)).subscribe((_) => {
      this.taskCalender.forEach((item, index) => {
        this.heightAcadKit = item?.nativeElement?.offsetHeight - 130 + 'px';
      });
    });
  }

  getDataElement() {
    this.taskCalender.changes.pipe(startWith(null)).subscribe((_) => {
      this.taskCalender.forEach((item, index) => {
        this.heightAcadKit = item?.nativeElement?.offsetHeight;
      });
      this.acadKitHeader.forEach((head, index) => {
        this.headerAcad = head?.nativeElement?.offsetHeight;
      });
    });

    let viewPortHeightExcludeHeader = document.body.clientHeight - 300; // 300 calculated manually from the header height

    return `${
      this.heightAcadKit - this.headerAcad < viewPortHeightExcludeHeader
        ? viewPortHeightExcludeHeader
        : this.heightAcadKit - this.headerAcad
    }px`;

    // if there is no task the isTask is set to true. Similarly, if there is no Event, the isEvent is set to true;
    // if (this.isTask && this.isEvent) {
    //   heightTable = window.offsetheight;
    // } else {
    //   heightTable = (this.heightAcadKit -  this.headerAcad) + 'px';
    // }
  }

  setClassFilter(classSelected) {
    if (classSelected) {
      this.onSelectClass(classSelected);
    }
  }

  setClassPilbox(classSelected) {
    if (classSelected) {
      this.titleClassesFilter.patchValue(null, { emitEvent: false });
      this.onSelectClass(classSelected);
    }
  }

  fetchClassesForThisTitle(titleId: string, selectedClass?) {
    this.subs.sink = this.rncpTitlesService.getAllClassByRncpTitleForAcadKit(titleId).subscribe((classesResp) => {
      let tempClassList = _.cloneDeep(classesResp);
      // Check if user is non-operator/non-certifier admin/cr staff/chief group academic. Allow to display all class
      if (this.utilService.isUserEntityADMTC() || this.utilService.isUserCRDirAdmin() || this.utilService.isUserLoginCRStaff()) {
        // If the user is CR Staff and chief group academic (Not Operator and CR Admin),
        // we need to only show the class that already have acad kit
        if (this.utilService.isUserLoginCRStaff()) {
          tempClassList = tempClassList.filter((classData) => classData && classData.academic_kit && classData.academic_kit.is_created);
        }

        this.classList = tempClassList.sort((classA: any, classB: any) => classA.name.localeCompare(classB.name));
        this.triggerSelectClassAfterFilter(this.classList, selectedClass);
      } else if (this.utilService.isChiefGroupAcademic() && this.schoolId) {
        // If the user is chiefgroupacademic, then we need to filter connected class by school
        this.subs.sink = this.rncpTitlesService.getSchoolConnectedTitleClass(this.schoolId).subscribe((schoolData) => {
          tempClassList = tempClassList.filter((classData) => classData && classData.academic_kit && classData.academic_kit.is_created);
          // We need to only display connected class with the school for chief group academic
          if (schoolData && schoolData.preparation_center_ats) {
            tempClassList = tempClassList.filter(
              (classData) =>
                classData &&
                schoolData.preparation_center_ats.find((schoolPC) => schoolPC.class_id && schoolPC.class_id._id === classData._id),
            );
          }
          this.classList = tempClassList.sort((classA: any, classB: any) => classA.name.localeCompare(classB.name));
          this.triggerSelectClassAfterFilter(this.classList, selectedClass);
        });
      } else {
        // For other user that are not operator or cr admin or cr staff, we need to filter based on assigned class
        const userType = this.CurUser.entities ? this.CurUser.entities[0].type.name : '';
        this.subs.sink = this.authService.getUserById(this.CurUser._id).subscribe((respp) => {
          const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
          const classes = this.utilService.getAcademicAllAssignedClass(academicUser);
          this.classList = tempClassList
            .filter(
              (classData) => classData && classes.includes(classData._id) && classData.academic_kit && classData.academic_kit.is_created,
            )
            .sort((classA: any, classB: any) => classA.name.localeCompare(classB.name));
          this.triggerSelectClassAfterFilter(this.classList, selectedClass);
        });
      }
    });
  }

  setClassSelectionAndPillbox() {
    if (this.classList && this.classList.length) {
      this.classListSelection = this.classList.filter((cls) => !cls.is_class_header);
      this.classListPillbox = this.classList.filter((cls) => cls.is_class_header);

      if (this.classListSelection && this.classListSelection.length && this.classListPillbox && !this.classListPillbox.length) {
        this.titleClassesFilter.setValue(this.classListSelection[0].name);
      }
    }
  }

  triggerSelectClassAfterFilter(tempClassList, selectedClass?) {
    // Check if the service is already selected beforehand but user move to somewhere else.
    // And when they return to dashboard the should still see the latest class
    this.setClassSelectionAndPillbox();
    const selectedClassFromService = this.academicKitService.getSelectedClass();

    // Data formatting for selection dropdown and pillbox
    
    // Check if selected class has data passed or not,
    // its used after creating acad kit the first time on reload to select the newly created acad kit
    if (
      this.classList &&
      selectedClass &&
      tempClassList.find((classData) => classData && classData._id && classData._id === selectedClass._id)
    ) {
      const foundClass = tempClassList.find((classData) => classData && classData._id && classData._id === selectedClass._id);
      this.onSelectClass(foundClass);
    } else if (
      this.classList &&
      selectedClassFromService &&
      tempClassList.find((classData) => classData && selectedClassFromService && classData._id === selectedClassFromService._id)
    ) {
      const foundClass = tempClassList.find((classData) => classData && selectedClassFromService && classData._id === selectedClassFromService._id)

      if (!foundClass.is_class_header) {
        this.titleClassesFilter.patchValue(foundClass.name, { emitEvent: false });
        this.setClassFilter(selectedClassFromService);
      } else {
        this.setClassPilbox(selectedClassFromService);
      }
    } else if (this.classListPillbox && this.classListPillbox.length) {
      this.onSelectClass(this.classListPillbox[0]);
    } else if (this.classList && this.classList[0]) {
      this.onSelectClass(this.classList[0]);
    }
  }

  onSelectClass(classObject: any) {

    this.selectedClass = classObject;
    this.academicKitService.setSelectedClass(classObject); // set on service so children can listen
    const classString = this.translate.instant('COMPANY.CLASS');
    this.pageTitleService.setTitle(`${this.rncpTitle.short_name} - ${classString} ${this.selectedClass.name}`);
    this.checkingTaskCalendar();
    this.checkForSetupAcadKit();
  }

  getColorPilbox(indexClass: number): string {
    if(this.classListPillbox && this.classListPillbox.length ) {
      const indexClassSelected = this.classListPillbox.findIndex((classesPilbox, index) => classesPilbox._id === this.selectedClass._id );
      if(indexClassSelected !== -1 && indexClassSelected === indexClass) {
        return 'accent';
      }
    }
    return 'primary';
  }

  checkForSetupAcadKit() {
    if (!this.selectedClass) {
      return;
    }
    // if acad kit not created yet, show setup acad kit dialog, and reset acad kit data to [] for task AV-4847
    this.acadKitFolders = [];
    if (!this.selectedClass.academic_kit || !this.selectedClass.academic_kit.is_created) {
      this.subs.sink = this.dialog
        .open(SetupAcademicKitDialogComponent, {
          disableClose: true,
          width: '600px',
          data: this.selectedClass,
        })
        .afterClosed()
        .subscribe((result) => {
          if (result && result !== 'cancel') {
            this.fetchClassesForThisTitle(this.rncpTitle._id, this.selectedClass);
          } else if (result && result === 'cancel') {
            this.checkAndRouteAfterCancelSetupAcadKit();
          }
        });
    } else {
      this.getAcadKitRootFolder();
    }
  }

  checkAndRouteAfterCancelSetupAcadKit() {
    let validate = false;
    let availableClass;
    if (this.classList && this.classList.length) {
      for (const classData of this.classList) {
        if (classData && classData.academic_kit && classData.academic_kit.is_created) {
          validate = true;
          availableClass = classData;
          break;
        }
      }
    }

    if (!validate) {
      this.router.navigate(['/rncpTitles']);
    }
  }

  getAcadKitRootFolder() {
    this.isWaitingForResponse = true;
    // get all acad kit data from this title
    this.subs.sink = this.academicKitService.getAcademicKitOfSelectedClass(this.selectedClass._id).subscribe((resp) => {
      if (resp) {
        const temp = _.cloneDeep(resp.academic_kit.categories);
        if (temp && temp.length) {
          temp.forEach((category) => {
            // aplha ordering school in 06
            if (category.folder_name === '06. EPREUVES DE LA CERTIFICATION' || category.folder_name === '07. CERTIFICATION MANAGEMENT') {
              if (category.sub_folders_id && category.sub_folders_id.length) {
                category.sub_folders_id = category.sub_folders_id.sort((folder1, folder2) => {
                  if (folder1 && folder2 && folder1.folder_name < folder2.folder_name) {
                    return -1;
                  } else if (folder1 && folder2 && folder1.folder_name > folder2.folder_name) {
                    return 1;
                  } else {
                    return 0;
                  }
                });
                if (this.isUserAcadir) {
                  const entity = this.CurUser.entities.filter((ent) => ent.type.name === 'Academic Director');
                  const dataUnix = _.uniqBy(entity, 'school.short_name');
                  category.sub_folders_id = category.sub_folders_id.filter((folder) =>
                    folder.school ? folder.school._id === dataUnix[0].school._id : '',
                  );
                } else if (this.isUserAcadAdmin) {
                  const entity = this.CurUser.entities.filter((ent) => ent.type.name === 'Academic Admin');
                  const dataUnix = _.uniqBy(entity, 'school.short_name');
                  category.sub_folders_id = category.sub_folders_id.filter((folder) =>
                    folder.school ? folder.school._id === dataUnix[0].school._id : '',
                  );
                } else if (this.isUserPCSchool) {
                  const entity = this.CurUser.entities.filter((ent) => ent.type.name === 'PC School Director');
                  const dataUnix = _.uniqBy(entity, 'school.short_name');
                  category.sub_folders_id = category.sub_folders_id.filter((folder) =>
                    folder.school ? folder.school._id === dataUnix[0].school._id : '',
                  );
                }
              }
            }

            // Filtering out document added from root folder
            if (category && category.documents && category.documents.length) {
              category.documents = category.documents.filter((document) => document.parent_test === null);
            }
          });
        }
        this.acadKitFolders = temp;
      } else {
        this.acadKitFolders = resp.academic_kit.categories;
      }
      this.isWaitingForResponse = false;
    });
  }

  ngOnDestroy() {
    // clearInterval();
    this.subs.unsubscribe();
    this.pageTitleService.setTitle('');
    this.pageTitleService.setIcon('');
  }

  modifyAcadKit() {
    this.selectedFolderId = null;
    this.displayModifyMode = true;
  }

  showAcadKit() {
    this.displayModifyMode = false;
    this.getAcadKitRootFolder();
  }

  selectFolder(event: string) {
    this.selectedFolderId = event;
    this.displayModifyMode = true;
  }

  scrollToCalender() {
    const domDocument = document.getElementById('calendar');
    if (domDocument) {
      domDocument.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getCustomRootFolderIndex(folderIndex: number) {
    // to get index of newly created custom folder other than default folder "01. ADMISSIONS" to "07. ARCHIVES"
    if (folderIndex + 1 > 7) {
      this.customRootFolderIndex = folderIndex + 1;
      return this.customRootFolderIndex;
    }
    return null;
  }

  checkingTaskCalendar() {
    this.isWaitingForResponse = true;
    const pendingTaskfilter = {
      class_name: this.selectedClass._id,
    };
    this.subs.sink = this.rncpTitlesService
      .checkPendingTask(this.rncpTitle._id, this.schoolId, pendingTaskfilter)
      .subscribe((result: any[]) => {
        if (result && result.length) {
          this.isWaitingForResponse = false;
          this.isTask = false;
          this.noTaskAndEvent = false;
        } else {
          this.isTask = true;
          if (this.isEvent && this.isTask) {
            this.dashboardDisplay();
          }
        }
      });
    this.subs.sink = this.academicKitService.checkEvent(this.rncpTitle._id, this.selectedClass._id).subscribe((response) => {
      if (response && response.length) {
        this.isWaitingForResponse = false;
        this.isEvent = false;
        this.noTaskAndEvent = false;
      } else {
        this.isEvent = true;
        if (this.isEvent && this.isTask) {
          this.dashboardDisplay();
        }
      }
    });
  }

  dashboardDisplay() {
    this.entityData = _.filter(this.CurUser.entities, function (entity) {
      return (
        entity.type.name === 'Academic Final Jury Member' ||
        entity.type.name === 'Chief Group Academic' ||
        entity.type.name === 'Corrector' ||
        entity.type.name === 'Animator Business game' ||
        entity.type.name === 'Corrector Certifier' ||
        entity.type.name === 'Corrector of Problematic' ||
        entity.type.name === 'Corrector Quality' ||
        entity.type.name === 'Cross Corrector' ||
        entity.type.name === 'President of Jury' ||
        entity.type.name === 'Professional Final Jury Member' ||
        entity.type.name === 'Teacher' ||
        entity.type.name === 'Academic Director'
      );
    });
    if (this.entityData && this.entityData.length) {
      this.noTaskAndEvent = true;
      this.isWaitingForResponse = false;
    } else {
      this.isWaitingForResponse = false;
    }
  }

  imgURL(src: string) {
    return this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src);
  }

  isAllowedPendingTask() {
    // this.isUserVisitor = this.utilService.isUserVisitor();
    let allowed = true;
    // if (this.isUserVisitor) {
    //   allowed = false;
    // }
    return allowed;
  }

  isAllowedToShowKit(index) {
    switch (index) {
      case 0:
        return this.permissionService.showAcadKitFolderOnePerm();
      case 1:
        return this.permissionService.showAcadKitFolderTwoPerm();
      case 2:
        return this.permissionService.showAcadKitFolderThreePerm();
      case 3:
        return this.permissionService.showAcadKitFolderFourPerm();
      case 4:
        return this.permissionService.showAcadKitFolderFivePerm();
      case 5:
        return this.permissionService.showAcadKitFolderSixPerm();
      case 6:
        return this.permissionService.showAcadKitFolderSevenPerm();
      default:
        return this.permissionService.showAcadKitFolderOthersPerm();
    }
  }

  loadingDownloadDocuments() {
    // listen process dwonload documents in acad kit
    // can't use eventEmiiter because component academicKit is recursive so instead use behaviour subject
    this.subs.sink = this.academicKitService.loadingObservable.subscribe((resp) => {
      this.isLoading = resp;
    });
  }

  quickSearchKit(){

    const userTypeId = this.CurUser?.entities[0]?.type?._id;
    
    this.isLoading = true;
    const payload = {
      rncp_title_id: this.rncpTitle?._id,
      class_id: this.selectedClass?._id,
      document_name: this.quickSearchAcadKit.value
    }

    const pagination = {
      page: 0,
      limit: 1
    }

    this.subs.sink = this.academicKitService.getAllAcadKitForQuickSearch(pagination, payload, userTypeId).subscribe((resp)=>{
      this.isLoading = false;
      if(resp.length){
        window.open(`./rncpTitles/academic-kit-search-list?classId=${payload.class_id}&rncpTitleId=${payload.rncp_title_id}&search=${payload.document_name}`, '_blank');
      }else{
        Swal.fire({
          type:'error',
          title: this.translate.instant('ACAD_KIT.Document/Evaluation not found'),
          allowOutsideClick: false
        })
      }
    },
    (err)=>{
      this.isLoading = false;
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
        allowOutsideClick: false
      });
    })
  }
}
