import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-certificate-issuance-process-dialog',
  templateUrl: './certificate-issuance-process-dialog.component.html',
  styleUrls: ['./certificate-issuance-process-dialog.component.scss'],
})
export class CertificateIssuanceProcessDialogComponent implements OnInit {
  private subs = new SubSink();
  titleControl = new UntypedFormControl('');
  titleList: any;
  titleListFilter: Observable<any[]>;
  classControl = new UntypedFormControl('');
  classList: any;
  classListFilter: Observable<any[]>;
  selectedTitle: any;
  selectedClass: any;
  selectedCertifierId: any;
  isWaitingForResponse = false;
  selectedTitleName: any;
  selectedClassName: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    public dialogRef: MatDialogRef<CertificateIssuanceProcessDialogComponent>,
    private rncpTitleService: RNCPTitlesService,
    private juryService: JuryOrganizationService,
  ) {}

  ngOnInit() {
    this.setTitleDropdown();
  }

  setTitleDropdown() {
    this.titleList = this.parentData.titles;
    this.titleListFilter = this.titleControl.valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        this.titleList
          .filter((title) => (title ? title.short_name.toLowerCase().includes(searchText.toLowerCase()) : false))
          .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
      ),
    );
  }

  getClassDropdown(title) {
    if (typeof title === 'string') {
      return;
    }
    this.classList = title.classes;
    this.classListFilter = this.classControl.valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        this.classList
          .filter((classes) => (classes ? classes.name.toLowerCase().includes(searchText.toLowerCase()) : false))
          .sort((a: any, b: any) => a.name.localeCompare(b.name)),
      ),
    );
  }

  selectTitle(title) {
    if (title !== 'none') {
      this.selectedTitle = title._id;
      this.selectedTitleName = title.short_name;
      this.selectedCertifierId = title.certifier._id;
      this.selectedClass = null;
      this.getClassDropdown(title);
    } else {
      this.selectedTitle = null;
      this.selectedCertifierId = null;
    }
  }

  selectClass(selectedClass) {
    if (selectedClass !== 'none') {

      this.selectedClass = selectedClass._id;
      this.selectedClassName = selectedClass.name;
    } else {
      this.selectedClass = null;
    }
  }

  disableSave() {
    if (this.selectedTitle && this.selectedClass) {
      return false;
    } else {
      return true;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  onSave() {
    const payload = {
      rncp_id: this.selectedTitle,
      class_id: this.selectedClass,
      certifier_school_id: this.selectedCertifierId,
    };
    const data = {
      payload: payload,
      selectedTitleName: this.selectedTitleName,
      selectedClassName: this.selectedClassName,
    };
    this.dialogRef.close(data);
  }
}
