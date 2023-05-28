import { Component, OnInit, Inject } from '@angular/core';
import { NavigationPath } from '../academic-kit.model';
import { SubSink } from 'subsink';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';

@Component({
  selector: 'ms-duplicate-folder-dialog',
  templateUrl: './duplicate-folder-dialog.component.html',
  styleUrls: ['./duplicate-folder-dialog.component.scss']
})
export class DuplicateFolderDialogComponent implements OnInit {
  private subs = new SubSink();

  acadKitFolders = [];
  isWaitingForResponse = false;
  customRootFolderIndex: number;
  destinationFolderId: string;
  destinationFolderTitle: string;
  navigationPath: NavigationPath[] = [];

  isDisabled: boolean = true;


  constructor(
    public dialogRef: MatDialogRef<DuplicateFolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData,
    private acadKitService: AcademicKitService,
  ) { }

  ngOnInit(): void {
    this.getAcadKitRootFolder();
    this.updateBreadcrumbNavigationPath();
  }

  getAcadKitRootFolder() {
    this.isWaitingForResponse = true;
    // get all acad kit data from this title
    this.subs.sink = this.acadKitService.getAcademicKitOfSelectedClass(this.parentData?.classId).subscribe(resp => {
      if (resp) {
        this.acadKitFolders = resp.academic_kit.categories;
        // remove folder 06 so user cant move anything to folder 06
        if (this.acadKitFolders && this.acadKitFolders.length) {
          this.acadKitFolders = this.acadKitFolders.filter(folder => folder.folder_name !== '06. EPREUVES DE LA CERTIFICATION');
        }
      }
      this.isWaitingForResponse = false;
    }, () => { this.isWaitingForResponse = false; })
  }

  updateBreadcrumbNavigationPath() {
    this.subs.sink = this.acadKitService.moveFolderBreadcrumb$.subscribe(path => {
      this.navigationPath = path;
      if (this.navigationPath?.length) {
        this.isDisabled = false;
      } else {
        this.isDisabled = true;
      }
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
    this.acadKitService.setMoveFolderBreadcrumb(null);
    this.acadKitService.setDestinationFolder(null);
  }

  selectFolder() {
    // subscribe to destinationFolderId$ to get which folder is being selected as destination folder from the folder tree
    this.subs.sink = this.acadKitService.destinationFolderId$.subscribe(folder => {
      if (folder) {
        this.destinationFolderId = folder?._id;
        this.destinationFolderTitle = folder?.folder_name;
      }
    });
    
    const documentPayload = {
      parent_rncp_title: this.parentData?.titleId,
      destination_folder_id: this.destinationFolderId,
    }
    this.dialogRef.close(documentPayload);
    this.acadKitService.setMoveFolderBreadcrumb(null);
    this.acadKitService.setDestinationFolder(null);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
