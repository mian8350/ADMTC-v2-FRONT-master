import { Component, OnInit, Inject, Input, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { TranslateService } from '@ngx-translate/core';
import { NavigationPath } from '../academic-kit.model';

interface ParentData {
  classId: string;
  rncpTitle: string;
  itemId: string;
  itemName: string;
  type: string; // 'FOLDER', 'DOCUMENT' or 'TEST'
}

@Component({
  selector: 'ms-move-folder-dialog',
  templateUrl: './move-folder-dialog.component.html',
  styleUrls: ['./move-folder-dialog.component.scss']
})
export class MoveFolderDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  acadKitFolders = [];
  isWaitingForResponse = false;
  customRootFolderIndex: number;
  destinationFolderId: string;
  destinationFolderTitle: string;
  navigationPath: NavigationPath[] = [];

  constructor(
    public dialogRef: MatDialogRef<MoveFolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: ParentData,
    private acadKitService: AcademicKitService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    // note: this component can be used for moving a folder to folder, document to folder, and test to folder.
    // that's why we need to specify the type when calling this dialog component

    this.getAcadKitRootFolder();
    this.updateBreadcrumbNavigationPath();
  }

  getAcadKitRootFolder() {
    this.isWaitingForResponse = true;
    // get all acad kit data from this title
    this.subs.sink = this.acadKitService.getAcademicKitOfSelectedClass(this.parentData.classId).subscribe(resp => {
      if (resp) {
        this.acadKitFolders = resp.academic_kit.categories;
        // remove folder 06 so user cant move anything to folder 06
        if (this.acadKitFolders && this.acadKitFolders.length) {
          this.acadKitFolders = this.acadKitFolders.filter(folder => folder.folder_name !== '06. EPREUVES DE LA CERTIFICATION');
        }
      }
      this.isWaitingForResponse = false;
    })
  }

  updateBreadcrumbNavigationPath() {
    this.subs.sink = this.acadKitService.moveFolderBreadcrumb$.subscribe(path => {
      this.navigationPath = path;
    })
  }

  getCustomRootFolderIndex(folderIndex: number) {
    // to get index of newly created custom folder other than default folder "01. ADMISSIONS" to "07. ARCHIVES"
    if (folderIndex + 1 > 7) {
      this.customRootFolderIndex = folderIndex + 1;
      return this.customRootFolderIndex;
    }
    return null;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  moveFolder() {
    // subscribe to destinationFolderId$ to get which folder is being selected as destination folder from the folder tree
    this.subs.sink = this.acadKitService.destinationFolderId$.subscribe(folder => {
      if (folder) {
        this.destinationFolderId = folder._id;
        this.destinationFolderTitle = folder.folder_name;
      }
    });

    switch (this.parentData.type) {
      case 'FOLDER':
        // move folder to folder
        const folderPayload = {
          parent_rncp_title: this.parentData.rncpTitle,
          class: this.parentData.classId,
          parent_folder_id: this.destinationFolderId
        }
        this.subs.sink = this.acadKitService.updateAcademicKitFolder(this.parentData.itemId, folderPayload).subscribe(resp => {
          if (resp) {
            this.dialogRef.close(true);
            this.showSwal();
          }
        });
        break;
      case 'DOCUMENT':
        // move document to folder
        const documentPayload = {
          parent_rncp_title: this.parentData.rncpTitle,
          parent_folder: this.destinationFolderId
        }
        this.subs.sink = this.acadKitService.updateAcadDoc(this.parentData.itemId, documentPayload).subscribe(resp => {
          if (resp) {

            this.dialogRef.close(true);
            this.showSwal();
          }
        });
        break;
      case 'TEST':
        // later BE need to change parent_category to be parent_folder
        const testPayload = {
          parent_rncp_title: this.parentData.rncpTitle,
          parent_category: this.destinationFolderId
        }
        // move test to folder
        this.subs.sink = this.acadKitService.updateTest(this.parentData.itemId, testPayload).subscribe(resp => {
          if (resp) {

            this.dialogRef.close(true);
            this.showSwal();
          }
        });
        break;
    }
  }

  showSwal() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('DASHBOARD.MOVEDOCUMENTSUCCESS.Title'),
      html: this.translate.instant('DASHBOARD.MOVEDOCUMENTSUCCESS.Text', {
        messageType: this.translate.instant(`DASHBOARD.${this.parentData.type}`), // either 'document' or 'folder' or 'test'
        selectedFolder: this.parentData.itemName,
        targetFolder: this.destinationFolderTitle
      }),
      footer: `<span style="margin-left: auto">DASHBOARD</span>`,
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('DASHBOARD.MOVEDOCUMENTSUCCESS.Ok')
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
