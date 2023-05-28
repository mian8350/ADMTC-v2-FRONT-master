import { Component, OnInit, Output, Input, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { SchoolService } from 'app/service/schools/school.service';
import { AcadKitFolder, AcadKitDocument } from 'app/rncp-titles/dashboard/academic-kit.model';
import { SubSink } from 'subsink';
import { environment } from 'environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDetailDialogComponent } from 'app/rncp-titles/dashboard/document-detail-dialog/document-detail-dialog.component';
import { CoreService } from 'app/service/core/core.service';

@Component({
  selector: 'ms-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
})
export class DocumentsComponent implements OnInit, OnDestroy {
  @ViewChild(DocumentsComponent, { static: false }) childRef: DocumentsComponent;

  @Input() folder: AcadKitFolder;
  @Input() isRootFolder: boolean;
  @Input() customRootFolderIndex: number;

  isWaitingForResponse = false;
  selectedClassId = '';
  private subs = new SubSink();
  acadKitFolders: AcadKitFolder[] = [];

  // to determine which type of folder's child is displayed
  expandFolder = {
    subFolder: false,
    folders: false,
  };

  constructor(private schoolService: SchoolService, public dialog: MatDialog, public coreService: CoreService) {}

  ngOnInit() {
    this.subs.sink = this.schoolService.selectedClassId$.subscribe((id) => {
      this.selectedClassId = id;
    });
  }

  toggleTutorial() {
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  toggleSubFolder(folderId: string) {
    this.expandFolder.subFolder = !this.expandFolder.subFolder;

    if (this.expandFolder.subFolder) {
      this.getSubFolders(folderId);
    }
  }

  toggleFolder(folderId: string) {
    this.expandFolder.folders = !this.expandFolder.folders;

    if (this.expandFolder.folders) {
      this.getSubFolders(folderId);
    }
  }

  getSubFolders(folderId: string) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.schoolService.getSubfolders(folderId, this.selectedClassId).subscribe((resp) => {
      // Filtering the coming folders data to display only published documents for the selected class
      if (resp) {
        const listAt = [];
        this.subs.sink = resp.documents.forEach((elemet) => {
          if (elemet.parent_class_id != null) {
            elemet.parent_class_id.forEach((el) => {
              if (el._id == this.selectedClassId) {
                listAt.push(elemet.document_name);
              }
            });
          }
        });
        resp.documents = resp.documents.filter(
          (element) =>
            element.published_for_student == true &&
            listAt.some(function (item) {
              return item == element.document_name;
            }),
          // End of filtering
        );
        this.folder.documents = resp.documents.sort((a: any, b: any) => {
          const a_name = a && a.document_name ? a.document_name : '';
          const b_name = b && b.document_name ? b.document_name : '';
          return a_name.localeCompare(b_name);
        });
        this.folder.sub_folders_id = resp.sub_folders_id.sort((a: any, b: any) => {
          const a_title = a && a.title ? a.title : '';
          const b_title = b && b.title ? b.title : '';
          return a_title.localeCompare(b_title);
        });
      }
      this.isWaitingForResponse = false;
    });
  }

  openDocumentDetails(document: AcadKitDocument) {
    const titleId = this.schoolService.getSelectedRncpTitleId();


    this.dialog.open(DocumentDetailDialogComponent, {
      disableClose: true,
      width: '850px',
      data: {
        ...document,
        titleId: titleId,
      },
    });
  }

  downloadDocumentAdded(documentData) {
    const url = `${environment.apiUrl}/fileuploads/${documentData.s3_file_name}?download=true`.replace('/graphql', '');
    return url;
    // window.open(url, '_blank');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
