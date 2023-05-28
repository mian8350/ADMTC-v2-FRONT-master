import { group } from '@angular/animations';
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TestCorrection } from 'app/test-correction/test-correction.model';
import { ScoreConversion, TestCreationPayloadData } from 'app/test/test-creation/test-creation.model';
import { combineLatest, forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import { PdfGroupDetailIndividualWithGroupComponent } from '../pdf-group-detail-individual-with-group/pdf-group-detail-individual-with-group.component';
import { PdfGroupDetailIndividualWithoutGroupComponent } from '../pdf-group-detail-individual-without-group/pdf-group-detail-individual-without-group.component';
interface FilteredGroupList {
  groupTestCorrectionId: string;
  _id: string;
  name: string;
  doc: string;
  missing_copy: boolean;
  score: number;
  is_justified: string;
  students: StudentCorrection[];
}

interface GroupCorrection {
  groupTestCorrectionId: string;
  _id: string;
  name: string;
  doc: string;
  missing_copy: boolean;
  score: number;
  is_justified: string;
  students: StudentCorrection[];
  correction_grid: any;
  isFirstSection?: boolean
  isLastSection?: boolean
}

interface StudentCorrection {
  _id: string;
  first_name: string;
  last_name: string;
  school: any;
  correction_grid?: any;
}

@Component({
  selector: 'ms-pdf-group-detail-dialog',
  templateUrl: './pdf-group-detail-dialog.component.html',
  styleUrls: ['./pdf-group-detail-dialog.component.scss']
})
export class PdfGroupDetailDialogComponent implements OnInit, AfterViewInit{
  @ViewChild(PdfGroupDetailIndividualWithGroupComponent, { static: false }) typeARef:  PdfGroupDetailIndividualWithGroupComponent;
  @ViewChild(PdfGroupDetailIndividualWithoutGroupComponent, { static: false }) typeBRef: PdfGroupDetailIndividualWithoutGroupComponent;
  private subs = new SubSink();

  payloadB: any;
  payloadA: any;
  constructor(
    private transcriptBuilderService: TranscriptBuilderService,
    private testCorectionService: TestCorrectionService,
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef <PdfGroupDetailDialogComponent> 
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.getPayloads();
  }

  //subscribe to both PayLoadA and payLoadB from children and then if both value is true, clsoe dialog
  getPayloads() {
    let typeAPayload = this.typeARef.typeAPayLoad;
    let typeBPayLoad = this.typeBRef.typeBPayLoad;
    this.subs.sink = combineLatest([typeAPayload, typeBPayLoad]).subscribe(resp => {
      if(resp[0] && resp[1]) {
        const payload = {
          pdf_result: resp[0],
          pdf_results_students_in_group: resp[1],
        }
        this.dialogRef.close(payload);
      }
    })
  }
}
