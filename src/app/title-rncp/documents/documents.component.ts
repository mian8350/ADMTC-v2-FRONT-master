import { Component, ViewChild, OnInit, OnDestroy, Input } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import * as _ from 'lodash';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { CoreService } from 'app/service/core/core.service';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
})
export class DocumentsComponent implements OnInit, OnDestroy {
  @Input() rncpId = '';
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['parent_class_id', 'parent_category', 'name', 'published_for_student', 'action'];
  filterColumns: string[] = ['classNameFilter', 'parentCategoryFilter', 'nameFilter', 'publishedForStudentFilter', 'actionFilter'];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  documentDialog: MatDialogRef<DocumentDialogComponent>;
  private subs = new SubSink();

  countDeepFolder: number;
  classesL = [];
  classes: Observable<any[]>;
  isWaitingForResponse = false;
  classNameFilter = new UntypedFormControl('');
  parentCategoryFilter = new UntypedFormControl('');
  nameFilter = new UntypedFormControl('');
  publishedForStudentFilter = new UntypedFormControl('All');
  publishedForStudentFilterList = ['All', 'Yes', 'No'];

  rncpTitles: any = [];
  selectedRNCP: any;
  noData: any;
  isPermission: any;

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;

  filteredValues = {
    className: '',
    parent_category: '',
    name: '',
    published_for_student: 'All',
  };
  private timeOutVal: any;
  constructor(
    private rncpTitlesService: RNCPTitlesService,
    private translate: TranslateService,
    private acadKitService: AcademicKitService,
    public dialog: MatDialog,
    public coreService: CoreService,
    public tutorialService: TutorialService,
    private authService: AuthService,
  ) {}

  @ViewChild(MatSort, { static: false }) set content(content: MatSort) {
    this.dataSource.sort = content;
  }

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.dataSource.paginator = this.paginator;
    this.getDocsData();
    this.filterAndSorting();
    this.getClassDropdownList();
    this.dataSource.filterPredicate = this.customFilterPredicate();
    this.getInAppTutorial('Documents');
  }

  getDocsData() {
    this.isWaitingForResponse = true;
    let customRequest = 'parent_folder{folder_name}';
    let lastIndex;
    this.subs.sink = this.rncpTitlesService.CountParentFolderDeepForDocument(this.rncpId).subscribe((res) => {
      // Customize the request to get parent folders according to the deepest document in this title
      if (res > 0) {
        for (let i = 1; i <= res; i++) {
          lastIndex = customRequest.lastIndexOf('folder_name');
          customRequest = customRequest.substr(0, lastIndex + 11) + ' parent_folder_id{folder_name}' + customRequest.substr(lastIndex + 11);
        }
      }
      this.subs.sink = this.rncpTitlesService.GetAllDocuments(this.rncpId, customRequest).subscribe((response) => {
        response.forEach((documents) => {
          // Replace the not published document, class value by not published to be displayed as 'Not Published' and to be filterable in FE
          if (!(documents.parent_class_id && documents.parent_class_id.length)) {
            documents.parent_class_id = [{ name: 'Not Published' }];
          }
          // Cooking the correct path to the document in FE
          if (documents.parent_folder != null && !documents.parent_folder.folder_name.includes('\\')) {
            let path = '';
            let pathList = [];
            let parent_cat = documents.parent_folder;
            // Loop throw each document parent folder till arrive to the last one
            do {
              if (parent_cat != null) {
                pathList.push(parent_cat.folder_name);
                parent_cat = parent_cat.parent_folder_id;
              }
            } while (parent_cat);
            // The parent folders hierarchy is gotten inversed from the response, so they need to be reversed
            pathList = pathList.reverse();
            // Concatenate the parent folders hierarchy in one variable seperated by backslash to have the fool ordered path to the document
            for (const thePath of pathList) {
              path = path + thePath + ` \\ `;
            }
            // Removing the last backslash from the path
            if (path[path.length - 2] + path[path.length - 1] === `\\ `) {
              path = path.substring(0, path.length - 2);
            }
            // Placing the correct cooked path in the parent folder title to display it and to be filterable in FE
            documents.parent_folder.folder_name = path;
          }
        });
        this.dataSource.data = response;
        this.isWaitingForResponse = false;
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      });
    });
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.authService.getLocalStorageUser();
    const userType = currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);

    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);

      const classNameFound = searchString.className
        ? data.parent_class_id &&
          data.parent_class_id.find((classe) => classe.name.toLowerCase().indexOf(searchString.className.toLowerCase()) !== -1)
          ? true
          : false
        : searchString.className.length
        ? false
        : true;

      const parentCategoryFound = searchString.parent_category
        ? data.parent_folder &&
          data.parent_folder.folder_name.toString().trim().toLowerCase().indexOf(searchString.parent_category.toLowerCase()) !== -1
        : true;

      const nameFound = searchString.name
        ? data.document_name.toString().trim().toLowerCase().indexOf(searchString.name.toLowerCase()) !== -1
        : true;

      const publishedForStudentFound =
        searchString.published_for_student.toLowerCase() === 'all' ||
        (searchString.published_for_student.toLowerCase() === 'yes' && data.published_for_student) ||
        (searchString.published_for_student.toLowerCase() === 'no' && !data.published_for_student);

      return parentCategoryFound && nameFound && publishedForStudentFound && classNameFound;
    };
  }

  filterAndSorting() {
    this.subs.sink = this.classNameFilter.valueChanges.subscribe((className) => {
      this.filteredValues['className'] = className;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.parentCategoryFilter.valueChanges.subscribe((parent_category) => {
      this.filteredValues['parent_category'] = parent_category;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.nameFilter.valueChanges.subscribe((name) => {
      this.filteredValues['name'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.publishedForStudentFilter.valueChanges.subscribe((published_for_student) => {
      this.filteredValues['published_for_student'] = published_for_student;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    // Personalize the sorting for object respective displayed attribute, and changing to data to lowercase for correct sorting
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'parent_category':
          return item.parent_folder && item.parent_folder.folder_name ? item.parent_folder.folder_name.toLocaleLowerCase() : null;
        case 'parent_class_id':
          return item.parent_class_id ? item.parent_class_id[0].name.toLocaleLowerCase() : null;
        case 'name':
          return item.document_name ? item.document_name.toLocaleLowerCase() : null;
        default:
          return item[property];
      }
    };
  }

  resetFilter() {
    this.classNameFilter.setValue('');
    this.parentCategoryFilter.setValue('');
    this.nameFilter.setValue('');
    this.publishedForStudentFilter.setValue('All');
    this.sort.sort({ id: null, start: 'desc', disableClear: false });

    this.filteredValues = {
      className: '',
      parent_category: '',
      name: '',
      published_for_student: 'All',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  editDocument(element: any) {
    this.subs.sink = this.dialog
      .open(DocumentDialogComponent, {
        panelClass: 'custom-dialog-container-publishable-doc',
        width: '600px',
        disableClose: true,
        data: {
          docs: _.cloneDeep(element),
          rncpId: this.rncpId,
          isUpdate: true,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getDocsData();
        }
      });
  }

  deleteDoc(element) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DELETEDOC_S1.TITLE'),
      html: this.translate.instant('DELETEDOC_S1.TEXT', { DOCNAME: element.document_name }),
      footer: `<span style="margin-left: auto">DELETEDOC_S1</span>`,
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      clearTimeout(this.timeOutVal);
      if (result.value) {
        Swal.fire({ type: 'success', title: 'Bravo!', text: this.translate.instant('REMOVEDOCUMENTSUCCESS'), allowOutsideClick: false });
        this.subs.sink = this.acadKitService.deleteAcadDoc(element._id).subscribe((resp) => {
          if (resp) {
            this.getDocsData();
          }
        });
      }
    });
  }

  getClassDropdownList() {
    this.subs.sink = this.acadKitService.getClassDropDownList(this.rncpId).subscribe((classData) => {
      this.classesL = _.cloneDeep(classData);
      this.classesL.push({ name: 'Not Published' });
      this.classes = this.classNameFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt) =>
          this.classesL
            .filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))
            .sort((a: any, b: any) => a.name.localeCompare(b.name)),
        ),
      );
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  renderTooltipClass(classes: any[]): string {
    let tooltip = '';
    for (const classs of classes) {
      if (classs.name) {
        tooltip = tooltip + `${classs.name}, `;
      }
    }
    if (tooltip[tooltip.length - 2] + tooltip[tooltip.length - 1] == `, `) {
      tooltip = tooltip.substring(0, tooltip.length - 2);
    }
    return tooltip;
  }
}
