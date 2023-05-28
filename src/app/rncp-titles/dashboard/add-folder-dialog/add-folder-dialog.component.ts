import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';

interface ParentData {
  rncpTitle: string;
  classId: string;
  folderId: string;
  parentFolderId?: string;
  isEdit: boolean
}

@Component({
  selector: 'ms-add-folder-dialog',
  templateUrl: './add-folder-dialog.component.html',
  styleUrls: ['./add-folder-dialog.component.scss']
})
export class AddFolderDialogComponent implements OnInit, OnDestroy {
  folderForm: UntypedFormGroup;
  private subs = new SubSink();
  isWaitingForResponse = false;

  constructor(
    public dialogRef: MatDialogRef<AddFolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: ParentData,
    private fb: UntypedFormBuilder,
    private acadKitService: AcademicKitService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.initFolderForm();
    if (this.parentData.isEdit) {
      this.getFolderData();
    }
  }

  initFolderForm() {
    this.folderForm = this.fb.group({
      folder_name: ['', Validators.required],
      folder_description: [''],
      parent_rncp_title: [this.parentData.rncpTitle],
      parent_folder_id: [this.parentData.isEdit ? this.parentData.parentFolderId : this.parentData.folderId],
      class: [this.parentData.classId]
    })
  }

  getFolderData() {
    this.subs.sink = this.acadKitService.getAcademicKitDetail(this.parentData.folderId).subscribe(resp => {
      this.folderForm.patchValue(resp);
    })
  }

  closeDialog() {
    this.dialogRef.close();
  }

  save() {
    this.isWaitingForResponse = true;
    if (this.parentData.isEdit) {
      const payload = _.cloneDeep(this.folderForm.value);
      if (payload.parent_folder_id && payload.parent_folder_id._id) {
        payload.parent_folder_id = payload.parent_folder_id._id;
      }
      this.subs.sink = this.acadKitService.updateAcademicKitFolder(this.parentData.folderId, payload).subscribe(resp => {
        if (resp) {
          Swal.fire({ type: 'success', title: this.translate.instant('DASHBOARD.MODIFYCATEGORYSUCCESS'),            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'), });
          this.dialogRef.close(true);
        } else {
          Swal.fire({ type: 'error', title: 'Error',            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'), });
        }
        this.isWaitingForResponse = false;
      })
    } else {
      this.subs.sink = this.acadKitService.addAcademicKitFolder(this.folderForm.value).subscribe(resp => {
        if (resp) {
          Swal.fire({ type: 'success', title: 'Bravo!',            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'), });
          this.dialogRef.close(true);
        } else {
          Swal.fire({ type: 'error', title: 'Error' ,            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'),});
        }
        this.isWaitingForResponse = false;
      })
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
