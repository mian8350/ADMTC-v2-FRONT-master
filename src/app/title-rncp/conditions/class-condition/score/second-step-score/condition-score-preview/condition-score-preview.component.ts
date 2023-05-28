import { Component, OnInit, Input, OnChanges, SimpleChanges, SimpleChange } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import * as _ from 'lodash';

@Component({
  selector: 'ms-condition-score-preview',
  templateUrl: './condition-score-preview.component.html',
  styleUrls: ['./condition-score-preview.component.scss'],
})
export class ConditionScorePreviewComponent implements OnInit, OnChanges {
  @Input() className: string;
  @Input() titleName: string;
  @Input() titleLongName: string;
  @Input() isPreviewFor: string;
  @Input() competency: any[];
  @Input() blockData: any[];
  @Input() markPointStatus: boolean;
  @Input() maxPoint: number;
  @Input() subTypeEvaluation: string;
  pdfHtml: string;
  competencyData = [];
  currentCompetency = [];
  blockCompetency = [];
  blockSoftSkill = [];
  currentPage = 0;

  showPDF = false;
  constructor(public utilService: UtilityService, public translate: TranslateService) {}

  ngOnInit() {

    this.groupingBlock();
  }

  // Next preview
  nextPreview() {
    this.currentPage += 1;
    this.currentCompetency = this.competencyData[this.currentPage];
  }

  // Previuos preview
  prevPreview() {
    this.currentPage -= 1;
    this.currentCompetency = this.competencyData[this.currentPage];
  }

  ngOnChanges(): void {
    this.competencyData = [];
    let tempCompetency = [];
    if (this.competency) {
      this.competency.forEach((comp) => {
        if (comp.page_break) {
          tempCompetency.push(comp);
          this.competencyData.push(tempCompetency);
          tempCompetency = [];
        } else {
          tempCompetency.push(comp);
        }
      });
      if (tempCompetency && tempCompetency.length > 0) {
        this.competencyData.push(tempCompetency);
      }
      this.currentCompetency = this.competencyData && this.competencyData.length > 0 ? this.competencyData[0] : [];
      this.groupingBlock();
      this.currentPage = 0;

    }
  }

  getPdfHtml() {

    const fileDoc = document.getElementById('pdf-condition-of-award-score').innerHTML;
    let html = PRINTSTYLES;
    html = html + fileDoc;
    return html;
  }

  getPdfHtmlEval() {


    const fileDoc = document.getElementById('pdf-condition-of-award-eval').innerHTML;
    let html = PRINTSTYLES;
    html = html + fileDoc;
    return html;
    // return document.getElementById('pdf-condition-of-award-eval').innerHTML;
  }

  getRefID(blockId: string): string {
    let refId = '';
    if (blockId) {
      const selectedBlock = this.blockData.find(block => block._id === blockId);
      if (selectedBlock &&
        selectedBlock.block_type === 'competence' &&
        selectedBlock.block_of_tempelate_competence &&
        selectedBlock.block_of_tempelate_competence.ref_id
      ) {
        refId = selectedBlock.block_of_tempelate_competence.ref_id + ' - ';
      } else if (selectedBlock &&
        selectedBlock.block_type === 'soft_skill' &&
        selectedBlock.block_of_tempelate_soft_skill &&
        selectedBlock.block_of_tempelate_soft_skill.ref_id
      ) {
        refId = selectedBlock.block_of_tempelate_soft_skill.ref_id + ' - ';
      }
    }
    return refId;
  }

  groupingBlock() {
    this.blockCompetency = [];
    this.blockSoftSkill = [];
    const blockManual = [];
    if (this.currentCompetency && this.currentCompetency.length) {
      this.currentCompetency.forEach((block) => {
        if (block.block_type === 'competence') {
          this.blockCompetency.push(block);
        } else if (block.block_type === 'soft_skill') {
          this.blockSoftSkill.push(block);
        } else if (block.block_type === 'manual' || block.block_type === '') {
          blockManual.push(block);
          // this.blockCompetency = this.blockCompetency.concat(blockManual);
        }
      });
      if (this.blockSoftSkill && this.blockSoftSkill.length) {
        this.blockSoftSkill = this.blockSoftSkill.concat(blockManual);
      } else {
        this.blockCompetency = this.blockCompetency.concat(blockManual);
      }
      this.blockSoftSkill = _.uniq(this.blockSoftSkill, '_id');
      this.blockCompetency = _.uniq(this.blockCompetency, '_id');
    }


  }
}
