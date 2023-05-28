import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-add-edit-phrase-dialog',
  templateUrl: './add-edit-phrase-dialog.component.html',
  styleUrls: ['./add-edit-phrase-dialog.component.scss']
})
export class AddEditPhraseDialogComponent implements OnInit {
  private subs = new SubSink();
  addPhraseForm: UntypedFormGroup
  isEdit = false;
  phrasesTypes =
    [
          { value: 'pass', label: 'pass' },
          { value: 'retake', label: 'retake' },
          { value: 'fail', label: 'fail' },
          { value: 'eliminated', label: 'eliminee' },
    ];

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddEditPhraseDialogComponent>,
    private utilService: UtilityService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.initForm();


    if (this.data && this.data.type === 'edit') {
      this.isEdit = true;
      this.addPhraseForm.get('phrase_type').patchValue(this.data.phrase_type);
      this.addPhraseForm.get('name').patchValue(this.data.name);
      this.addPhraseForm.get('_id').patchValue(this.data._id);
    }

    if (this.data && this.data.block_or_competence === 'block') {
      this.addPhraseForm.get('phrase_type').setValidators([Validators.required]);
      this.addPhraseForm.get('phrase_type').updateValueAndValidity();
    }
    this.sortingDropdownFilter();
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.sortingDropdownFilter();
    });
  }

  sortingDropdownFilter() {
    this.phrasesTypes = this.phrasesTypes.sort((a, b) =>
      this.translate.instant('phrase_status.'+ a.label).toLowerCase().localeCompare(this.translate.instant('phrase_status.'+ b.label).toLowerCase()),
    );


  }
  

  initForm() {
    this.addPhraseForm = this.fb.group({
      _id: [null],
      phrase_type: [''],
      name: ['', [Validators.required, removeSpaces]],
    });
  }

  submit() {
    if (this.isUnique()) {
      // remove phrase_type if it is not for block or it is for competency phrase
      if (!this.data.block_or_competence || this.data.block_or_competence !== 'block') {
        delete this.addPhraseForm['phrase_type'];
      }
      this.dialogRef.close(this.addPhraseForm.value);
    } else {
      Swal.fire({
        type: 'error',
        title: 'Phrase name has to be unique'
      })
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  isUnique(): boolean {

    let result = true;
    if (this.data && this.data.list && this.data.list.length && this.data.type !== 'edit') {
      for (const phrase of this.data.list) {
        if (this.utilService.simplifyRegex(phrase.name) === this.utilService.simplifyRegex(this.addPhraseForm.get('name').value)) {
          result = false;
        }
        if (this.data.block_or_competence === 'block') {
          if ( this.utilService.simplifyRegex(phrase.phrase_type) === this.utilService.simplifyRegex(this.addPhraseForm.get('phrase_type').value)) {
            result = false;
          }
        }
      }
    }
    return result;
  }

}
