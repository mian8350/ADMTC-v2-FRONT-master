import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { SubSink } from 'subsink';
import { NavigationPath } from '../../academic-kit.model';

@Component({
  selector: 'ms-folder-tree',
  templateUrl: './folder-tree.component.html',
  styleUrls: ['./folder-tree.component.scss']
})
export class FolderTreeComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @Input() folder: any;
  @Input() selectedFolderId: string;
  @Input() isRootFolderView: boolean;
  @Input() customRootFolderIndex: number;
  @Input() isToggleAllSubFolder: boolean;

  destinationFolderId: string;
  destinationFolderTitle: string;
  isWaitingForResponse = false;
  expandFolder = {
    subFolder: false,
  };
  navigationPath: NavigationPath[];
  isParentFolderExist: boolean;

  constructor(private acadKitService: AcademicKitService) { }

  ngOnInit() {
    // get selected destination folder
    this.subs.sink = this.acadKitService.destinationFolderId$.subscribe(folder => {
      if (folder) {
        this.destinationFolderId = folder._id;
        this.destinationFolderTitle = folder.folder_name;
      }
    });

    if (this.isToggleAllSubFolder) {
      // recursively get sub folder when isToggleAllSubFolder true
      this.toggleAllSubFolder(this.folder._id);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  toggleFolder(folderId: string, folderTitle: string) {
    this.acadKitService.setDestinationFolder({ _id: folderId, folder_name: folderTitle });
    this.expandFolder.subFolder = !this.expandFolder.subFolder;
    this.setBreadcrumbNav(folderId, folderTitle);

    if (this.expandFolder.subFolder) {
      this.getSubFolders(folderId);
    }
  }

  setBreadcrumbNav(folderId: string, folderTitle: string) {
    // add selected folder data to breadcrumb navigation path
    this.navigationPath = [];
    this.isParentFolderExist = true;
    this.navigationPath.push({id: folderId, name: folderTitle});
    this.getParentData(folderId);
  }

  getParentData(folderId: string) {
    if (this.isParentFolderExist) {
      this.subs.sink = this.acadKitService.getAcademicKitParentFolder(folderId).subscribe(resp => {
        if (resp && resp.parent_folder_id) {
          this.navigationPath.unshift({id: resp.parent_folder_id._id, name: resp.parent_folder_id.folder_name});
          this.isParentFolderExist = true;
          // recursively call parent data of the folder until root level folder to get full navigation path
          this.getParentData(resp.parent_folder_id._id);
        } else {
          this.isParentFolderExist = false;
          // if already in root folder level, set it to service so move folder dialog component can access this breadcrumb data
          this.acadKitService.setMoveFolderBreadcrumb(this.navigationPath);
        }
      })
    }
  }

  toggleAllSubFolder(folderId: string) {
    // this will show all of the sub folder recursively when we click on eye button
    this.expandFolder.subFolder = !this.expandFolder.subFolder;
    this.isToggleAllSubFolder = true;
    this.getSubFolders(folderId);
  }

  getSubFolders(folderId: string) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadKitService.getAcademicKitSubfoldersMoveDialog(folderId).subscribe(resp => {
      if (resp) {
        this.folder.sub_folders_id = resp.sub_folders_id;

      } else {
        // stop getting sub folder from API if there is no sub folders
        this.isToggleAllSubFolder = false;
      }
      this.isWaitingForResponse = false;
    })
  }

}
