import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RncpTitleCardData } from 'app/rncp-titles/RncpTitle.model';
import { NavigationPath, AcadKitDocument } from '../academic-kit.model';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { MatDialog } from '@angular/material/dialog';
import { AddFolderDialogComponent } from '../add-folder-dialog/add-folder-dialog.component';
import { DocumentUploadDialogComponent } from '../document-upload-dialog/document-upload-dialog.component';
import { DocumentDetailDialogComponent } from '../document-detail-dialog/document-detail-dialog.component';
import Swal from 'sweetalert2';
import { MoveFolderDialogComponent } from '../move-folder-dialog/move-folder-dialog.component';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import { TestDetailsComponent } from '../test-details/test-details.component';

interface classData {
  _id: string;
  name: string;
  description: string;
  academic_kit: { is_created: boolean };
}

@Component({
  selector: 'ms-modify-categories',
  templateUrl: './modify-categories.component.html',
  styleUrls: ['./modify-categories.component.scss'],
})
export class ModifyCategoriesComponent implements OnInit, OnDestroy {
  @Input() selectedFolderId: string;
  @Input() currentClass: classData;
  @Input() rncpTitle: RncpTitleCardData;
  private subs = new SubSink();

  navigationPath: NavigationPath[] = [];
  isDefaultRootFolder = false;
  acadKitRootFolders = [];
  selectedFolderData: any;
  isWaitingForResponse = false;
  displayedTabIndex: number;
  private intVal: any;
  private timeOutVal: any;
  isFolder07 = false

  constructor(
    private translate: TranslateService,
    private academicKitService: AcademicKitService,
    public dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    // add "Folder" text to breadcrumb navigation
    this.navigationPath.push({ id: null, name: this.translate.instant('DASHBOARD.CATEGORIES') });
    // get sub folder, document, and test from selected folder
    if (this.selectedFolderId) {
      this.getOneFolderData(true, 0);
      // get root folders data
    } else {
      this.getRootFolderData();
    }
  }

  getOneFolderData(addToNavigationPath: boolean, displayedTabIndex: number) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.academicKitService.getAcademicKitDetail(this.selectedFolderId).subscribe((resp) => {
      if (resp) {
        const notEditAbleFolderName = [
          '01. ADMISSIONS',
          '02. ANNALES EPREUVES',
          '03. BOITE A OUTILS',
          '04. ORGANISATION',
          '05. PROGRAMME',
          '06. EPREUVES DE LA CERTIFICATION',
          '07. ARCHIVES',
        ];
        this.selectedFolderId = resp._id;
        this.selectedFolderData = resp;
        if(this.selectedFolderData && this.selectedFolderData.is_default_folder){
          this.isFolder07 =this.academicKitService.isRootFolder07(this.selectedFolderData)
        }
        if (!notEditAbleFolderName.includes(resp.folder_name)) {
          this.selectedFolderData['is_edit_able'] = true;
        }
        // displayedTabIndex: 0 = sub folder tab, 1 = document tab, 2 = test tab
        this.displayedTabIndex = displayedTabIndex;
        if (addToNavigationPath) {
          this.navigationPath.push({ id: this.selectedFolderData._id, name: this.selectedFolderData.folder_name });
        }
      }
      this.isWaitingForResponse = false;
    });
  }

  getRootFolderData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.academicKitService.getAcademicKitOfSelectedClass(this.currentClass._id).subscribe((resp) => {
      if (resp) {

        this.acadKitRootFolders = resp.academic_kit.categories;
      }
      this.isWaitingForResponse = false;
    });
  }

  openFolder(folder: any) {
    this.selectedFolderId = folder._id;
    this.getOneFolderData(true, 0);
  }

  openSubFolder(subFolder: any) {
    this.selectedFolderId = subFolder._id;
    this.getOneFolderData(true, 0);
  }

  goToFolder(folderId: string, navigationIndex: number) {
    // if already in root folder level, then call API getRootFolderData()
    if (!folderId) {
      this.selectedFolderId = null;
      this.navigationPath = [];
      this.navigationPath.push({ id: null, name: this.translate.instant('DASHBOARD.CATEGORIES') });
      this.getRootFolderData();
    } else {
      this.selectedFolderId = folderId;
      this.navigationPath.splice(navigationIndex);
      this.getOneFolderData(true, 0);
    }
  }

  navigationGoUp() {
    // get index of the selected folder in the navigation array
    const selectedFolderIndex = this.navigationPath.findIndex((path) => path.id === this.selectedFolderId);

    // if already in root folder level, then call API getRootFolderData()
    if (!this.navigationPath[selectedFolderIndex - 1].id) {
      this.selectedFolderId = null;
      this.navigationPath = [];
      this.navigationPath.push({ id: null, name: this.translate.instant('DASHBOARD.CATEGORIES') });
      this.getRootFolderData();
    } else {
      // selectedFolderIndex - 1 because we want to go up 1 level in navigation
      this.selectedFolderId = this.navigationPath[selectedFolderIndex - 1].id;
      // remove navigation breadcrumb item after the selected folder
      this.navigationPath.splice(selectedFolderIndex - 1);
      this.getOneFolderData(true, 0);
    }
  }

  addNewFolder() {
    this.subs.sink = this.dialog
      .open(AddFolderDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          rncpTitle: this.rncpTitle._id,
          classId: this.currentClass._id,
          folderId: null,
        },
        panelClass: 'certification-rule-pop-up',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getRootFolderData();
        }
      });
  }

  addSubFolder() {
    this.subs.sink = this.dialog
      .open(AddFolderDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          rncpTitle: this.rncpTitle._id,
          classId: this.currentClass._id,
          folderId: this.selectedFolderId,
          isEdit: false,
        },
        panelClass: 'certification-rule-pop-up',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getOneFolderData(false, 0);
        }
      });
  }

  editFolder() {
    const selectedFolderIndex = this.navigationPath.findIndex((path) => path.id === this.selectedFolderId);
    const parentFolderId = this.navigationPath[selectedFolderIndex - 1].id;

    this.subs.sink = this.dialog
      .open(AddFolderDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          rncpTitle: this.rncpTitle._id,
          classId: this.currentClass._id,
          folderId: this.selectedFolderId,
          parentFolderId: parentFolderId,
          isEdit: true,
        },
        panelClass: 'certification-rule-pop-up',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.navigationGoUp();
        }
      });
  }

  deleteFolder() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('ACAD_S1.TITLE'),
      html: this.translate.instant('ACAD_S1.TEXT', {
        folder_name: this.selectedFolderData.folder_name,
      }),
      footer: `<span style="margin-left: auto">ACAD_S1</span>`,
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
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.subs.sink = this.academicKitService.deleteAcademicKitFolder(this.selectedFolderId).subscribe((resp) => {
          if (resp) {
            this.navigationGoUp();
            Swal.fire({
              type: 'success',
              title: this.translate.instant('ACAD_S1b.TITLE'),
              html: this.translate.instant('ACAD_S1b.TEXT', {
                folder_name: this.selectedFolderData.folder_name,
              }),
              footer: `<span style="margin-left: auto">ACAD_S1b</span>`,
              confirmButtonText: 'OK',
            });
          } else {
            Swal.fire({ type: 'error', title: 'Error' });
          }
        });
      }
    });
  }

  moveFolder() {

    this.subs.sink = this.dialog
      .open(MoveFolderDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          classId: this.currentClass._id,
          rncpTitle: this.rncpTitle._id,
          itemId: this.selectedFolderId,
          itemName: this.selectedFolderData.folder_name,
          type: 'FOLDER',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.navigationGoUp();
        }
      });
  }

  addNewDocument() {
    this.subs.sink = this.dialog
      .open(DocumentUploadDialogComponent, {
        disableClose: true,
        width: '600px',
        panelClass: 'trend-dialog',
        data: {
          titleId: this.rncpTitle._id,
          classId: this.currentClass._id,
          folderId: this.selectedFolderId,
          docGenerationType: 'uploadedFromAcadKit',
          isUpdate: false,
          isFolder07: this.isFolder07
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getOneFolderData(false, 1);
        }
      });
  }

  openDocumentDetailsDialog(document: AcadKitDocument) {
    this.subs.sink = this.dialog
      .open(DocumentDetailDialogComponent, {
        disableClose: true,
        width: '850px',
        data: {
          ...document,
          titleId: this.rncpTitle._id,
          classId: this.currentClass._id,
          isFolder07:this.isFolder07
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getOneFolderData(false, 1);
        }
      });
  }

  addNewTest(selectedFolderId: string) {

    this.router.navigate(['/create-test', this.rncpTitle._id, { categoryId: selectedFolderId, classId: this.currentClass._id }, 'first']);
  }

  openTestDetails(test) {
    this.dialog.open(TestDetailsComponent, {
      width: '600px',
      disableClose: true,
      data: test,
    })
    .afterClosed()
    .subscribe((result) => {
      if (result) {
        this.getOneFolderData(false, 2);
      }
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
