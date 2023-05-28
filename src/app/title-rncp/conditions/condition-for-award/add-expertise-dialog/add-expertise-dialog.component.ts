import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ms-add-expertise-dialog',
  templateUrl: './add-expertise-dialog.component.html',
  styleUrls: ['./add-expertise-dialog.component.scss']
})
export class AddExpertiseDialogComponent implements OnInit {
  form: UntypedFormGroup;
  public RNCPtitleId: string;
  public modify: boolean;
  public expertiseMarkPointStatus;
  public specializations = [];
  public selectedSpecialization = '';
  public expertiseList = [];

  title = 'Add Expertise';
  expertise;
  formSubmit = false;
  expertiseMaxPoints;
  constructor(private expertiseDialog: MatDialogRef<AddExpertiseDialogComponent>,
              private fb: UntypedFormBuilder) { }

  ngOnInit() {
    this.form = this.fb.group({
      max_point: new UntypedFormControl(this.expertiseMaxPoints ? this.expertiseMaxPoints : 0),
      min_score: new UntypedFormControl(this.expertise ? this.expertise.minscore : ''),
      count_for_title_final_score: new UntypedFormControl(this.expertise ? this.expertise.count_for_title_final_score : true),
      block_of_experise: new UntypedFormControl(this.expertise ? this.expertise.block_of_experise : '', Validators.required),
      description: new UntypedFormControl(this.expertise ? this.expertise.description : '', Validators.required),
      rncp_title: new UntypedFormControl(this.RNCPtitleId ? this.RNCPtitleId : '', Validators.required),
      id: new UntypedFormControl(this.expertise ? this.expertise._id : ''),
      is_specialization: new UntypedFormControl(this.expertise.is_specialization ? this.expertise.is_specialization : false),
      is_retake_by_block: new UntypedFormControl(this.expertise.is_retake_by_block ? this.expertise.is_retake_by_block : false),
      selected_block_retake: new UntypedFormControl(this.expertise.selected_block_retake && this.expertise.selected_block_retake._id
        ? this.expertise.selected_block_retake._id : null),
      transversal_block: new UntypedFormControl(this.expertise.transversal_block ? this.expertise.transversal_block : false),
    });

    if (!this.expertise.hasOwnProperty('count_for_title_final_score')) {
      // this.expertiseMarkPointStatus = true;
      this.form.controls.count_for_title_final_score.setValue(true);
    }
  }

  onCancel() {
    this.expertiseDialog.close();
  }

  onSubmitExpertise() {
    this.expertiseDialog.close({
      expertise: this.form.value
    })
  }

}
