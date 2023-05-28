import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import Swal from 'sweetalert2';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';
import { debounceTime, startWith, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-create-class-dialog',
  templateUrl: './create-class-dialog.component.html',
  styleUrls: ['./create-class-dialog.component.scss'],
})
export class CreateClassDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  classForm: UntypedFormGroup;
  duplicateForm: UntypedFormGroup;
  isDuplicate = false;
  nameNotUnique = false;
  titleName;

  // for dropdown
  titleList = [];
  filteredTitle: Observable<any[]>;
  titleLoading = false;
  classList = [];
  filteredClass: Observable<any[]>;
  classLoading = false;

  lisSelected = false;
  isWaitingForResponse = false;

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private rncpTitleService: RNCPTitlesService,
    public dialogRef: MatDialogRef<CreateClassDialogComponent>,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.classForm = this.fb.group({
      name: ['', [Validators.required, removeSpaces]],
      parent_rncp_title: [this.data && this.data.rncpId ? this.data.rncpId : '', [Validators.required]],
      description: [''],
      allow_job_description: [false, [Validators.required]],
      allow_problematic: [false, [Validators.required]],
      allow_mentor_evaluation: [false, [Validators.required]],
      status: ['active'],
    });
    //this.classForm.markAllAsTouched();
    this.initDuplicateClass();
    this.initTitleDropdown();
    this.triggerTitleDropdown();
    this.triggerClassDropdown();
  }

  initDuplicateClass() {
    this.duplicateForm = this.fb.group({
      duplicate_from_title: [null, Validators.required],
      duplicate_from_class: [{ value: null, disabled: true }, Validators.required],
    });
  }

  onSaveClass() {
    this.isWaitingForResponse = true;
    if (this.isDuplicate) {
      const classPayload = this.classForm.value;
      delete classPayload.allow_job_description;
      delete classPayload.allow_problematic;
      delete classPayload.allow_mentor_evaluation;
      this.subs.sink = this.rncpTitleService.createNewClassDuplicate(classPayload, this.duplicateForm.value).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp && resp.data && resp.data.CreateClass && !resp.errors) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('TMCLASS_S04.TITLE'),
            text: this.translate.instant('TMCLASS_S04.TEXT', { ClassName: this.classForm.get('name').value }),
            footer: `<span style="margin-left: auto">TMCLASS_S04</span>`,
            confirmButtonText: this.translate.instant('TMCLASS_S04.BUTTON_1'),
          }).then(() => {
            this.dialogRef.close({
              classData: resp.data.CreateClass,
            });
          });
        } else if (resp.errors && resp.errors.length && resp.errors[0].message === 'Cannot create class with slash') {
          Swal.fire({
            title: this.translate.instant('ADDTITLE_SZ.TITLE'),
            text: this.translate.instant('ADDTITLE_SZ.TEXT'),
            footer: `<span style="margin-left: auto">ADDTITLE_SZ</span>`,
            confirmButtonText: this.translate.instant('ADDTITLE_SZ.BUTTON'),
            type: 'error',
            allowOutsideClick: false,
          });
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('TMCLASS_S05.TITLE'),
            text: this.translate.instant('TMCLASS_S05.TEXT', { ClassName: this.classForm.get('name').value }),
            footer: `<span style="margin-left: auto">TMCLASS_S05</span>`,
            confirmButtonText: this.translate.instant('TMCLASS_S05.BUTTON_1'),
          }).then(() => {
            this.nameNotUnique = true;
            // this.classForm.get('name').markAsTouched();
            // this.dialogRef.close();
          });
        }
      });
    } else {
      this.subs.sink = this.rncpTitleService.createNewClass(this.classForm.value).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp && resp.data && resp.data.CreateClass && !resp.errors) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('TMCLASS_S04.TITLE'),
            text: this.translate.instant('TMCLASS_S04.TEXT', { ClassName: this.classForm.get('name').value }),
            confirmButtonText: this.translate.instant('TMCLASS_S04.BUTTON_1'),
          }).then(() => {
            this.dialogRef.close({
              classData: resp.data.CreateClass,
            });
          });
        } else if (resp.errors && resp.errors.length && resp.errors[0].message === 'Cannot create class with slash') {
          Swal.fire({
            title: this.translate.instant('ADDTITLE_SZ.TITLE'),
            text: this.translate.instant('ADDTITLE_SZ.TEXT'),
            confirmButtonText: this.translate.instant('ADDTITLE_SZ.BUTTON'),
            type: 'error',
            allowOutsideClick: false,
          });
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('TMCLASS_S05.TITLE'),
            text: this.translate.instant('TMCLASS_S05.TEXT', { ClassName: this.classForm.get('name').value }),
            footer: `<span style="margin-left: auto">TMCLASS_S05</span>`,
            confirmButtonText: this.translate.instant('TMCLASS_S05.BUTTON_1'),
          }).then(() => {
            this.nameNotUnique = true;
            // this.classForm.get('name').markAsTouched();
            // this.dialogRef.close();
          });
        }
      });
    }
  }

  onCloseDialog() {
    this.dialogRef.close({});
  }

  changePublished(event: MatSlideToggleChange) {
    if (event.checked) {
      this.isDuplicate = true;
      //this.duplicateForm.markAllAsTouched();
    } else {
      this.isDuplicate = false;
      this.duplicateForm.markAsPristine();
    }
  }

  initTitleDropdown() {
    this.subs.sink = this.rncpTitleService.getTitleDropdown(true).subscribe((resp) => {
      if (resp) {
        this.titleList = _.cloneDeep(resp);
      }
    });
  }

  triggerTitleDropdown() {
    this.subs.sink = this.duplicateForm
      .get('duplicate_from_title')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((value) => {
        if (value && typeof value === 'string') {
          this.getTitleList(value);
        } else {
          this.filteredTitle = null;
        }
      });
  }

  getTitleList(search: string) {
    this.titleLoading = true;
    this.filteredTitle = this.duplicateForm.get('duplicate_from_title').valueChanges.pipe(
      startWith(search),
      map((searchVal) =>
        this.titleList.filter((opt) => {
          if (typeof searchVal === 'string') {
            return this.simpleDiacriticSensitiveRegex(opt.short_name)
              .toLowerCase()
              .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
          }
        }),
      ),
    );
    this.duplicateForm.get('duplicate_from_class').enable();
  }

  triggerClassDropdown() {
    this.subs.sink = this.duplicateForm
      .get('duplicate_from_class')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((value) => {
        if (value && typeof value === 'string' && value.length > 0) {
          this.getClassList(value);
        } else {
          this.filteredClass = null;
        }
      });
  }

  getClassList(search: string) {
    this.titleLoading = true;
    this.subs.sink = this.rncpTitleService
      .getClassDropdown(this.duplicateForm.get('duplicate_from_title').value, search)
      .subscribe((resp) => {
        if (resp) {
          this.classList = _.cloneDeep(resp);
          this.filteredClass = this.duplicateForm.get('duplicate_from_class').valueChanges.pipe(
            startWith(search),
            map((searchVal) =>
              this.classList.filter((opt) => {
                if (typeof searchVal === 'string') {
                  return this.simpleDiacriticSensitiveRegex(opt.name)
                    .toLowerCase()
                    .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
                }
              }),
            ),
          );
        } else {
          this.filteredClass = null;
        }
      });
  }

  displayTitleName(data: string): string | undefined {
    const filteredData = this.titleList.filter((title) => title._id === data);

    if (filteredData && filteredData.length > 0) {
      return filteredData[0].short_name;
    } else {
      return '';
    }
  }

  displayClassName(data: string): string | undefined {
    const filteredData = this.classList.filter((classes) => classes._id === data);

    if (filteredData && filteredData.length > 0) {
      return filteredData[0].name;
    } else {
      return '';
    }
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
