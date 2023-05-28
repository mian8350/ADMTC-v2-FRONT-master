import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import swal from 'sweetalert2'
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormControl, Validators, UntypedFormGroup } from '@angular/forms';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import * as _ from 'lodash';


@Component({
  selector: 'ms-export-es-csv-dialog',
  templateUrl: './export-es-csv-dialog.component.html',
  styleUrls: ['./export-es-csv-dialog.component.scss']
})
export class ExportEsCsvDialogComponent implements OnInit {
  form: UntypedFormGroup;
  rncpTitleList = [{shortname: "S-RMO 2019", id: "12"}];
  classList = [{class: 'Class RMO 2019', id: "23"}];
  scholarSeasonList = [{season: '2018-2019', id: "13"}];
  schoolsList = [{name: "C3 INSTITUTE", id: "34"}];
  questionnaireList = [{questionnaireName: "Enquête d'employabilité pour les RMO 2019", _id: "5d26ff3acf98ff6a54208d9c"}];
  classes = [];
  scholarSeason = [];
  questionnaire = [];
  schools = [];
  titleID;
  classID;
  seasonID;
  schoolID;
  titleList: any;
  originalTitleList: any;
  currUser: any;
  constructor(public dialogRef: MatDialogRef<ExportEsCsvDialogComponent>,
    private translate: TranslateService,
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) { }
    
    ngOnInit() {

    this.form =this.fb.group({
      rncpTitleList: new UntypedFormControl('', [Validators.required]),
      classes: new UntypedFormControl('', [Validators.required]),
      scholarSeason: new UntypedFormControl('', [Validators.required]),
      schools: new UntypedFormControl('', [Validators.required]),
      questionnaire: new UntypedFormControl('', [Validators.required]),
    })
    this.getTitleRNCP();
  }
  
  titleSelected(id) {
    if(id) {
      this.classes = this.classList;
    }
  }

  classSelected(id) {
    if(id) {
      this.scholarSeason = this.scholarSeasonList;
    }
  }

  seasonSelected(id) {
    if(id) {
      this.schools = this.schoolsList;
    }
  }

  schoolSelected(id) {
    if(id) {
      this.questionnaire = this.questionnaireList;
    }
  }

  downloadCSV() {
    swal.fire({
      type: 'success',
      title: this.translate.instant('SUCCESS'),
      allowEscapeKey: true,
      confirmButtonText: 'OK'
    });
  }

  getTitleRNCP() {

    const listEntity = this.currUser.entities.filter((ent) => ent.type.name === 'CR School Director');
    const dataUnix = _.uniqBy(listEntity, 'assigned_rncp_title.short_name');
    const rncpArray = dataUnix.map(title => ({ _id: title.assigned_rncp_title._id, short_name: title.assigned_rncp_title.short_name }));
    this.titleList = rncpArray;
    this.originalTitleList = rncpArray;
  }

cancelDelete() {
  this.dialogRef.close(false);
}

}
