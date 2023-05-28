import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-title-task-builder-task-document-expected-dialog',
  templateUrl: './title-task-builder-task-document-expected-dialog.component.html',
  styleUrls: ['./title-task-builder-task-document-expected-dialog.component.scss'],
})
export class TitleTaskBuilderTaskDocumentExpectedDialogComponent implements OnInit {
  docForm: UntypedFormGroup;
  document_name_input = new UntypedFormControl('');

  timeOutVal: any;

  constructor(public dialogRef: MatDialogRef<TitleTaskBuilderTaskDocumentExpectedDialogComponent>, private fb: UntypedFormBuilder, private translate: TranslateService) {}

  ngOnInit() {
    this.initFormDoc();
  }

  initFormDoc() {
    this.docForm = this.fb.group({
      document_expected: this.fb.array([]),
    });
  }

  initDocumentExpected() {
    return this.fb.group({
      document_expected_name: [this.document_name_input.value],
      is_required: [false],
    });
  }

  getDocumentFormarray(): UntypedFormArray {
    return this.docForm.get('document_expected') as UntypedFormArray;
  }

  addDocumentExpected() {
    this.getDocumentFormarray().push(this.initDocumentExpected());
    this.document_name_input.reset();
  }

  onDeleteDocumentExpected(idx: number){
    const expectedDocumentName = this.getDocumentFormarray().at(idx).get('document_expected_name').value;
    let timeDisabled = 5;
    let confirmInterval;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.TITLE'),
      html: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.TEXT', { expectedDocumentName }),
      confirmButtonText: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON1'),
      cancelButtonText: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON2'),
      showCancelButton: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearInterval(confirmInterval);
      if (res.value) {
        this.getDocumentFormarray().removeAt(idx);
      }
    })
  }

  enterDocumentExpected(){
    const documentExpexted = this.docForm.get('document_expected').value;
    this.dialogRef.close({data:documentExpexted});
  }
  
  closeDialog() {
    this.dialogRef.close();
  }
}
