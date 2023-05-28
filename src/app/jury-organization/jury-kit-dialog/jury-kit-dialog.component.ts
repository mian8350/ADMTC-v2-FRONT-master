import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-jury-kit-dialog',
  templateUrl: './jury-kit-dialog.component.html',
  styleUrls: ['./jury-kit-dialog.component.scss'],
})
export class JuryKitDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  types = [];
  type: any;
  isPublishable: boolean;
  uploadDocForm: UntypedFormGroup;
  juryKitForm: UntypedFormGroup;
  selectedFile: any;
  acadKitEditedIndex: number;
  initialJuryKitFormData: any;

  isPendingAchieved = false;
  isWaitingForResponse = false;

  constructor(
    private fb: UntypedFormBuilder,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public juryOrgData: JuryOrganizationParameter,
    public dialogRef: MatDialogRef<JuryKitDialogComponent>,
    private acadKitService: AcademicKitService,
    private juryOrgService: JuryOrganizationService
  ) {}

  ngOnInit() {

    this.initUploadDocForm();
    this.initJuryKitForm();
    this.populateJuryKitForm();
  }

  initUploadDocForm() {
    this.uploadDocForm = this.fb.group({
      _id: [''],
      document_name: [''],
      s3_file_name: ['']
    })
  }

  initJuryKitForm() {
    this.juryKitForm = this.fb.group({
      jury_organization_id: [''],
      survival_kit: this.fb.array([])
    });
  }

  populateJuryKitForm() {
    this.juryKitForm.get('jury_organization_id').patchValue(this.juryOrgData._id);
    this.juryOrgData.survival_kit.forEach(kit => this.addSurvivalKitDocForm())
    this.getSurvivalKitDocForm().patchValue(this.juryOrgData.survival_kit);
    this.initialJuryKitFormData = this.juryKitForm.value;

  }

  initSurvivalKitDocForm() {
    return this.fb.group({
      _id: [''],
      document_name: [''],
      s3_file_name: ['']
    })
  }

  getSurvivalKitDocForm(): UntypedFormArray {
    return this.juryKitForm.get('survival_kit') as UntypedFormArray;
  }

  addSurvivalKitDocForm() {
    this.getSurvivalKitDocForm().push(this.initSurvivalKitDocForm());
  }

  deleteSurvivalKitDocForm(index: number) {
    const docName = this.getSurvivalKitDocForm().at(index).get('document_name').value;
    Swal.fire({
      type: 'question',
      title: this.translate.instant('CERTIFICATION_RULE.DELETE_DOCUMENT.TITLE'),
      text: this.translate.instant('CERTIFICATION_RULE.DELETE_DOCUMENT.TEXT', {
        DocumentName: docName
      }),
      footer: `<span style="margin-left: auto">DELETE_DOCUMENT</span>`,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('CERTIFICATION_RULE.DELETE_DOCUMENT.CANCELBTN'),
      confirmButtonText: this.translate.instant('CERTIFICATION_RULE.DELETE_DOCUMENT.CONFIRMBTN')
    }).then(result => {
      if (result.value) {
        this.getSurvivalKitDocForm().removeAt(index);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('CERTIFICATION_RULE.AFTER_DELETE_DOCUMENT.TITLE'),
          text: this.translate.instant('CERTIFICATION_RULE.AFTER_DELETE_DOCUMENT.TEXT', {
            DocumentName: docName
          }),
          footer: `<span style="margin-left: auto">AFTER_DELETE_DOCUMENT</span>`,
          confirmButtonText: this.translate.instant('CERTIFICATION_RULE.AFTER_DELETE_DOCUMENT.CONFIRMBTN')
        })
      }
    })
  }

  editSurvivalKitDocForm(index: number) {
    this.acadKitEditedIndex = index;
    this.uploadDocForm.patchValue(this.getSurvivalKitDocForm().at(index).value);
  }

  downloadSurvivalKitDocForm(index: number) {
    const fileUrl = this.getSurvivalKitDocForm().at(index).get('s3_file_name').value;
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  chooseFile(fileInput: Event) {
    this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];

  }

  removeFile() {
    this.selectedFile = null;
    this.uploadDocForm.get('s3_file_name').setValue('');
  }

  uploadFile() {
    this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe((resp) => {
      this.uploadDocForm.get('s3_file_name').setValue(resp.s3_file_name);
      this.selectedFile = null;
      if (this.uploadDocForm.get('_id').value) {
        this.updateAcadDoc();
      } else {
        this.createAcadDoc();
      }
    });
  }

  updateAcadDoc() {
    const payload = this.uploadDocForm.value;
    const docId = payload._id;
    delete payload._id;
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadKitService.updateAcadDoc(docId, payload).subscribe((resp) => {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'success',
        title: 'Bravo !',
      }).then(result => {
        this.getSurvivalKitDocForm().at(this.acadKitEditedIndex).patchValue(this.uploadDocForm.value);
        this.uploadDocForm.reset();
        this.acadKitEditedIndex = null;
      })
    });
  }

  createAcadDoc() {
    const payload = this.uploadDocForm.value;
    delete payload._id;
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadKitService.createAcadDoc(payload).subscribe((resp) => {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'success',
        title: 'Bravo !',
      }).then(result => {
        this.addSurvivalKitDocForm();
        this.uploadDocForm.get('_id').setValue(resp._id);
        this.getSurvivalKitDocForm().at(this.getSurvivalKitDocForm().length - 1).patchValue(this.uploadDocForm.value);
        this.uploadDocForm.reset();
      })
    });
  }

  createJuryOrganizationSurvivalKit() {
    const juryOrgId = this.juryOrgData._id;
    const survivalKits = this.getSurvivalKitDocForm().value ? this.getSurvivalKitDocForm().value : [];
    const survivalKitIds = survivalKits.map(kit => kit._id)
    this.isWaitingForResponse = true;
    this.juryOrgService.CreateJuryOrganizationSurvivalKit(juryOrgId, survivalKitIds).subscribe(resp => {
      this.isWaitingForResponse = false;

      Swal.fire({
        type: 'success',
        title: 'Bravo!'
      }).then(res => this.dialogRef.close(true))
    })
  }

  isUploadedFileExist() {
    return this.selectedFile || this.uploadDocForm.get('s3_file_name').value;
  }

  isDataChanged(): boolean {
    let isChanged = false;
    const oldData = JSON.stringify(this.initialJuryKitFormData);
    const currentData = JSON.stringify(this.juryKitForm.value);
    if (oldData !== currentData) {
      isChanged = true
    }
    return isChanged;
  }

  closeDialog() {
    if(this.isDataChanged()){  
      Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          footer: `<span style="margin-left: auto">TMTC_S01</span>`,
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
          } else {
            this.dialogRef.close();
          }
        });
    } else {
      this.dialogRef.close();
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
