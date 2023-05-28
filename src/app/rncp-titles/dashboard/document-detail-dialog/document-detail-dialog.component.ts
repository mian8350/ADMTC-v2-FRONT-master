import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import Swal from 'sweetalert2';
import { DocumentUploadDialogComponent } from '../document-upload-dialog/document-upload-dialog.component';
import { AcadKitDocument } from '../academic-kit.model';
import { MoveFolderDialogComponent } from '../move-folder-dialog/move-folder-dialog.component';
import { SubSink } from 'subsink';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { environment } from 'environments/environment';
import { PermissionService } from 'app/service/permission/permission.service';
import { EditExpectedDocumentDialogComponent } from 'app/shared/components/edit-expected-document-dialog/edit-expected-document-dialog.component';
import { DuplicateDetailDialogComponent } from '../duplicate-detail-dialog/duplicate-detail-dialog.component';

interface ParentData extends AcadKitDocument {
  titleId: string;
  schoolId: string;
  document_name: string;
  published_for_student: boolean;
  s3_file_name: string;
  type_of_document: string;
  document_generation_type: string;
  _id: string;
  parent_folder?: {
    folder_name: string;
  };
  parent_rncp_title?: {
    _id: string;
    short_name: string;
  }
  type?: string;
  classId?: string;
  isFolder07?: boolean;
  task_id?: {
    description: string;
  }
}

@Component({
  selector: 'ms-document-detail-dialog',
  templateUrl: './document-detail-dialog.component.html',
  styleUrls: ['./document-detail-dialog.component.scss'],
})
export class DocumentDetailDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  isUserAdmtc = false;
  isUserStudent = false;
  isUserAcadir = false;
  private intVal: any;
  private timeOutVal: any;
  isDocumentAddedType = false;
  isGrandOralCVorPresentation = false;
  isEditAbleOperator = false;
  isEditAbleStudent = false;
  isEditAbleAcadDir = false;
  isWaitingForResponse = false;

  deletePerm = false;
  editPerm = false;
  movePerm = false;

  constructor(
    public dialogRef: MatDialogRef<DocumentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: ParentData,
    private translate: TranslateService,
    private acadKitService: AcademicKitService,
    public dialog: MatDialog,
    private rncpTitlesService: RNCPTitlesService,
    private utilService: UtilityService,
    public permissionService: PermissionService,
  ) { }

  ngOnInit() {
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.isUserStudent = this.utilService.isUserStudent();
    this.isUserAcadir = this.utilService.isUserAcadir();

    // restore old validation before doc expected, go cv, and go presentation is created
    const validation =
      this.parentData.document_generation_type === 'uploadedFromTestCreation' ||
      this.parentData.document_generation_type === 'StudentTestCorrection' ||
      this.parentData.type_of_document === 'documentExpected' ||
      this.parentData.type_of_document === 'student_upload_grand_oral_presentation' ||
      this.parentData.type_of_document === 'student_upload_grand_oral_cv'
    if (validation) {
      this.isDocumentAddedType = true;
    }

    // If open from subject of certification, then consider the access from student
    if (this.parentData && this.parentData.type === 'student') {
      this.isUserStudent = true;
    }


    const validationGrandOral =
      this.parentData.type_of_document === 'student_upload_grand_oral_presentation' ||
      this.parentData.type_of_document === 'student_upload_grand_oral_cv';
    if (validationGrandOral) {
      this.isGrandOralCVorPresentation = true;
    }


    if (
      this.parentData &&
      (this.parentData.type_of_document === 'documentExpected' ||
        this.parentData.type_of_document === 'student_upload_grand_oral_presentation' ||
        this.parentData.type_of_document === 'student_upload_grand_oral_cv')
    ) {
      this.getLimititation();
    } else {
      this.checkValidation();
    }
  }

  getLimititation() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitlesService.getLimitationForDocument(this.parentData._id).subscribe((res) => {
      this.isWaitingForResponse = false;

      if (this.isUserAdmtc) {
        this.isEditAbleOperator = res.operator_allow;
      } else if (this.isUserStudent) {
        this.isEditAbleStudent = res.student_allow;
      } else if (this.isUserAcadir) {
        this.isEditAbleAcadDir = res.acad_allow;
      }
      this.checkValidation('limitation');
    }, (err) => this.swalError(err));
  }

  deleteDoc() {

    let timeDisabled = 5;

    const docName = this.parentData && this.parentData.document_name ? this.parentData.document_name : '';
    const folderName =
      this.parentData && this.parentData.parent_folder && this.parentData.parent_folder.folder_name
        ? this.parentData.parent_folder.folder_name
        : '';

    Swal.fire({
      allowOutsideClick: false,
      type: 'warning',
      title: this.translate.instant('DELETEDOC_S1.TITLE'),
      html: this.translate.instant('DELETEDOC_S1.TEXT', { DOCNAME: docName, FOLDERNAME: folderName }),
      footer: `<span style="margin-left: auto">DELETEDOC_S1</span>`,
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DELETEDOC_S1.BUTTON_CANCEL'),
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        clearInterval(this.timeOutVal);
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
        if (this.isGrandOralCVorPresentation) {
          this.isWaitingForResponse = true;
          this.subs.sink = this.acadKitService.validateOrRejectCvAndPresentation(this.parentData._id, 'rejected').subscribe((result) => {
            this.isWaitingForResponse = false;
            if (result) {
              Swal.fire({
                type: 'success',
                title: 'Bravo!',
                text: this.translate.instant('REMOVEDOCUMENTSUCCESS'),
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('OK'),
              }).then(swalRes => {

                this.acadKitService.refreshAcadKit(true);
                this.dialogRef.close(true);
              })
            }
          }, (err) => this.swalError(err));
        } else {
          this.isWaitingForResponse = true;
          this.subs.sink = this.acadKitService.deleteAcadDoc(this.parentData._id).subscribe((resp) => {
            this.isWaitingForResponse = false;
            if (resp) {
              Swal.fire({
                type: 'success',
                title: 'Bravo!',
                text: this.translate.instant('REMOVEDOCUMENTSUCCESS'),
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('OK'),
              }).then(swalRes => {
                this.acadKitService.refreshAcadKit(true);
                this.dialogRef.close(true);
              })
            }
          }, (err) => this.swalError(err));
        }
      }
    });

    // Swal.fire({
    //   type: 'question',
    //   allowOutsideClick: false,
    //   title: this.translate.instant('DELETEDOC_S1.TITLE'),
    //   html: this.translate.instant('DELETEDOC_S1.TEXT', { DOCNAME: this.parentData.document_name }),
    //   confirmButtonText: this.translate.instant('Yes'),
    //   cancelButtonText: this.translate.instant('No'),
    // }).then((result) => {});
  }

  closePopUp() {
    this.dialogRef.close();
  }

  moveDoc() {
    this.subs.sink = this.dialog
      .open(MoveFolderDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          rncpTitle: this.parentData.titleId,
          classId: this.parentData.classId,
          itemId: this.parentData._id,
          itemName: this.parentData.document_name,
          type: 'DOCUMENT',
        },
      })
      .afterClosed()
      .subscribe((result) => {

        if (result) {
          this.acadKitService.refreshAcadKit(true);
          this.dialogRef.close(true);
        }
      });
  }

  // if type document certification rule get signed , name, date , time  accept certification rule 
  getCertificationRuleSigned(type: string){
    this.isWaitingForResponse = true;
      this.subs.sink = this.rncpTitlesService.DownloadDocumentCertificationRuleForUser(this.parentData.titleId, this.parentData.classId, this.parentData.schoolId, this.parentData.s3_file_name).subscribe(
        resp => {
          this.isWaitingForResponse = false;
          const fileNameDownload = resp;          
          const a = document.createElement('a');
          a.target = 'blank';
          if(type === 'download') {
            a.href = `${environment.apiUrl}/fileuploads/${fileNameDownload}?download=true`.replace('/graphql', '');
            a.download = fileNameDownload;
          } else if(type === 'view') {
            a.href = `${environment.apiUrl}/fileuploads/${fileNameDownload}`.replace('/graphql', '');
          }
          a.click();
          a.remove();
        },        
        (error) => {
          this.isWaitingForResponse = false;

        },
      )
  }

  duplicateDoc() {
    if(this.parentData?.titleId) {
      this.dialog
        .open(DuplicateDetailDialogComponent, {
          disableClose: true,
          width: '750px',
          data: { 
            titleId: this.parentData?.titleId,
            itemId: this.parentData?._id,
            itemName: this.parentData?.document_name,
          },
        })
        .afterClosed()
        .subscribe((resp) => {
          if(resp) {
            this.dialogRef.close(true);
          }
        });
    }
  }

  downloadDoc() {    
    if(this.parentData.type_of_document === 'certification_rule') {
      this.getCertificationRuleSigned('download');
    } else {
      const a = document.createElement('a');
      a.target = 'blank';
      a.href = `${environment.apiUrl}/fileuploads/${this.parentData.s3_file_name}?download=true`.replace('/graphql', '');
      a.download = this.parentData.s3_file_name;
      a.click();
      a.remove();
    }
  }

  ViewDoc() {
    if(this.parentData.type_of_document === 'certification_rule') {
      this.getCertificationRuleSigned('view');
    } else {
      const a = document.createElement('a');
      a.target = 'blank';
      a.href = `${environment.apiUrl}/fileuploads/${this.parentData.s3_file_name}`.replace('/graphql', '');
      a.click();
      a.remove();
    }    
  }

  editDoc() {

    if (this.parentData && this.parentData.document_generation_type === 'documentExpected') {
      this.dialog
        .open(EditExpectedDocumentDialogComponent, {
          width: '700px',
          disableClose: true,
          data: this.parentData._id,
          panelClass: 'expected-doc-task',
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            // this.acadKitService.refreshAcadKit(true);
            this.dialogRef.close(true);
            // refresh acadkit and mytasktable
            // this.getMyTask();
          }
        });
    } else {
      this.subs.sink = this.dialog
        .open(DocumentUploadDialogComponent, {
          panelClass: 'custom-dialog-container-publishable-doc',
          disableClose: true,
          width: '600px',
          data: {
            document: this.parentData,
            titleId: this.parentData?.titleId,
            classId: this.parentData?.classId,
            isUpdate: true,
            isFolder07: this.parentData?.isFolder07
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            // this.acadKitService.refreshAcadKit(true);
            this.dialogRef.close(true);
          }
        });
    }
  }

  getMessage(data) {
    if (data) {
      if (data && data.includes('Student Upload Grand Oral Presentation')) {
        data = data.replaceAll('Student Upload Grand Oral Presentation', 'Grand Oral Presentation');
      }
      if (data && data.includes('Student Upload Grand Oral CV')) {
        data = data.replaceAll('Student Upload Grand Oral CV', 'Grand Oral CV');
      }
      if (data && data.includes('Student Upload Retake Grand Oral Certification passport')) {
        data = `${this.translate.instant('Student Upload Retake Grand Oral Certification passport')} ${this.parentData?.parent_rncp_title?.short_name ? '- ' + this.parentData?.parent_rncp_title?.short_name : '' }`
      }
      if (data && data.includes('Student Upload Retake Grand Oral CV')) {
        data = `${this.translate.instant('Student Upload Retake Grand Oral CV')} ${this.parentData?.parent_rncp_title?.short_name} `
      }
      return data;
    } else {
      return '';
    }
  }

  checkValidation(type?) {
    // if there is type, meaning coming from limitation. its used for doc expected, go cv, and go presentation.
    // if there is no type, meaning its normal doc. use old validation.

    if (type) {
      if (this.isUserAdmtc && this.isEditAbleOperator) {
        this.movePerm = false;
        this.editPerm = true;
        this.deletePerm = true;
      } else if (this.isUserAcadir && this.isEditAbleAcadDir) {
        this.movePerm = false;
        this.editPerm = true;
        this.deletePerm = true;
      } else if (this.isUserStudent && this.isEditAbleStudent) {
        this.movePerm = false;
        this.editPerm = true;
        this.deletePerm = false;
      }
    } else {
      if (this.isUserAdmtc && !this.isDocumentAddedType && this.permissionService.editAcadKitNot06Perm()) {
        this.movePerm = true;
        this.editPerm = true;
        this.deletePerm = true;
      }
    }
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
