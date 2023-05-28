import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-add-group-dialog',
  templateUrl: './add-group-dialog.component.html',
  styleUrls: ['./add-group-dialog.component.scss']
})
export class AddGroupDialogComponent implements OnInit {
  addGroupForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddGroupDialogComponent>,
    private groupCreationService: GroupCreationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.addGroupForm = this.fb.group({
      name: ['', [Validators.required, removeSpaces]],
    })
  }

  submit() {
    this.dialogRef.close(this.addGroupForm.value);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
