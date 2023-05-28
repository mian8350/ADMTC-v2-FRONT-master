import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { DuplicateFolderDialogComponent } from '../duplicate-folder-dialog/duplicate-folder-dialog.component';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-duplicate-detail-dialog',
  templateUrl: './duplicate-detail-dialog.component.html',
  styleUrls: ['./duplicate-detail-dialog.component.scss']
})
export class DuplicateDetailDialogComponent implements OnInit {
  
  titleControl = new UntypedFormControl('');
  classControl = new UntypedFormControl('');
  classSelected = [];
  classes = [];
  private subs = new SubSink();
  titleRncp;

  isWaitingForResponse = false;
  isDisabled: boolean = true;
  saveDataClasses: any[];


  constructor(
    private translate: TranslateService,
    private rncpTitlesService: RNCPTitlesService,
    public dialogRef: MatDialogRef<DuplicateDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private dialog: MatDialog,
    private acadKitService: AcademicKitService
  ) { }

  ngOnInit() {
    if(this.parentData?.titleId) {
      this.getOneTitle();
    }
  }

  getOneTitle() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitlesService.getOneTitleById(this.parentData?.titleId).subscribe((resp) => {
      if (resp) {
        this.isWaitingForResponse = false;
        this.titleRncp = {
          _id: resp?._id,
          name: resp?.short_name,
        };
        this.titleControl?.patchValue(this.titleRncp?.name);
        this.getAllClass(this.titleRncp?._id)
      }
    }, () => this.isWaitingForResponse = false);
  }

  onDeleteDocument(classIndex, navIndex) {
    this.classSelected[classIndex]?.navigationPath?.splice(navIndex, 1);
    this.classSelected[classIndex]?.folderDestinationIds?.splice(navIndex, 1);
    this.checkValidity();
  }

  openDuplicateFolderDialog(classData) {
    const payload = {
      titleId: this.parentData?.titleId ? this.parentData?.titleId : '',
      classId: classData ? classData?._id : '',
      itemId: this.parentData?.itemId ? this.parentData?.itemId : '',
      itemName: this.parentData?.itemName ? this.parentData?.itemName : '',
      type: 'DOCUMENT',
    };


    this.dialog
      .open(DuplicateFolderDialogComponent, {
        disableClose: true,
        width: '600px',
        data: payload,
      })
      .afterClosed()
      .subscribe((resp) => {
        if(resp) {
          this.subs.sink = this.acadKitService.getFolderName(resp?.destination_folder_id).subscribe((response) => {
            const indexFoundClass = this.classSelected.findIndex(foundClass => foundClass?._id === classData?._id);
            if(!this.classSelected[indexFoundClass].folderDestinationIds?.includes(resp?.destination_folder_id)) {
              this.classSelected[indexFoundClass].navigationPath?.push([response]);
              this.classSelected[indexFoundClass].folderDestinationIds?.push(resp?.destination_folder_id);
            }
            this.checkValidity();
          })
        }
      });
  }

  getAllClass(classId) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitlesService.getAllClassByRncpTitleForAcadKit(classId).subscribe((resp) => {
      if(resp) {
        this.isWaitingForResponse = false;
        this.saveDataClasses = resp;
        this.classes = resp;
      }
    }, () => this.isWaitingForResponse = false);
  };

  selectClass(events) {
    if(events.length) {
      for(let findEvent of this.classControl.value) {
        const foundClass = this.classes?.find((oneClass) => oneClass?._id === findEvent);
        const indexFoundClass = this.classes.findIndex(idx => idx?._id === findEvent?._id);
        if(this.classSelected?.length) {
          const existingClass = this.classSelected?.find((existClass) => existClass?._id === foundClass?._id);
          if(!existingClass) {
            this.classSelected.push({ ...foundClass, navigationPath: [], folderDestinationIds: [] });
            // this.classes?.splice(indexFoundClass, 1);
          }
        } else {
          this.classSelected.push({ ...foundClass, navigationPath: [], folderDestinationIds: [] });
          // this.classes?.splice(indexFoundClass, 1);
        }
      }
    } else {
      this.classSelected = [];
      this.classes = this.saveDataClasses;
    }
    this.checkValidity();
  }

  selectedAllClasses() {
    const tempClasses = [];
    this.classes.forEach((value) => {
      tempClasses.push({ ...value, navigationPath: [], folderDestinationIds: []});
    });
    this.classSelected = tempClasses;
    const selected = tempClasses?.map((item) => item._id);
    this.classControl.patchValue(selected);
  }
  
  generatePayload() {
    const tempFolderDestinationIds = [];
    this.classSelected.forEach((val) => {
      val?.folderDestinationIds.forEach((resp) => {
        tempFolderDestinationIds?.push(resp);
      })
    });
    return { document_id: this.parentData?.itemId, folder_destination_ids: tempFolderDestinationIds }
  }

  duplicateFile() {
    this.isWaitingForResponse = true;
    const payload = this.generatePayload()
    this.subs.sink = this.acadKitService.duplicateDocumentMultipleFolder(payload?.document_id, payload?.folder_destination_ids).subscribe((resp) => {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'success',
        title: 'Bravo !',
        confirmButtonText: this.translate.instant('OK'),
      }).then(() => {
        this.dialogRef.close(true);
      });
    }, () => this.isWaitingForResponse = false);
  }

  checkValidity() {
    if (this.classSelected.length) {
      for (let oneClass of this.classSelected) {
        if (!oneClass?.folderDestinationIds.length) {
          this.isDisabled = true;
          break;
        } else {
          this.isDisabled = false;
        }
      }
    } else {
      this.isDisabled = true
    }
  }

  removeSelectedClass(event) {
    const eventIndex = this.classSelected.findIndex(foundIndex => foundIndex?._id === event?.value?._id);
    this.classSelected.splice(eventIndex, 1);
    this.checkValidity();
  }

  closeDialog() {
    this.dialogRef.close()
  }

}
