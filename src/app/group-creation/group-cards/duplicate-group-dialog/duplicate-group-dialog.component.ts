import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-duplicate-group-dialog',
  templateUrl: './duplicate-group-dialog.component.html',
  styleUrls: ['./duplicate-group-dialog.component.scss']
})
export class DuplicateGroupDialogComponent implements OnInit {
  private subs = new SubSink();

  duplicateGroupForm: UntypedFormGroup;

  testList = [];

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<DuplicateGroupDialogComponent>,
    private groupCreationService: GroupCreationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.initForm();

    this.subs.sink = this.groupCreationService.getAllTest(this.data.rncp, this.data.task, this.data.school).subscribe((resp) => {

      if (resp) {
        this.testList = _.filter(resp, (test) => test._id !== this.data.test);
      }
    });
  }

  initForm() {
    this.duplicateGroupForm = this.fb.group({
      test_id: ['', Validators.required],
      school_id: [this.data.school, Validators.required]
    })
  }

  submit() {
    swal.fire({
      type: 'success',
      title: 'Bravo'
    }).then(() => {
      this.dialogRef.close(this.duplicateGroupForm.value);
    })
  }

  closeDialog() {
    this.dialogRef.close();
    this.subs.unsubscribe();
  }

}
