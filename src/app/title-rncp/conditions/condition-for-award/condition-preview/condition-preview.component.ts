import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'ms-condition-preview',
  templateUrl: './condition-preview.component.html',
  styleUrls: ['./condition-preview.component.scss'],
})
export class ConditionPreviewComponent implements OnInit, OnChanges {

  @Input() expertise: any[];
  @Input() rncpTitle;
  @Input() classData;
  @Input() markPointStatus: boolean;
  @Input() maxPoint: number;
  expertiseData = [];
  currentExpertise = [];
  currentPage = 0;

  constructor() {
  }

  ngOnInit() {
  }

  // Next preview
  nextPreview() {
    this.currentPage += 1;
    this.currentExpertise = this.expertiseData[this.currentPage];
  }

  // Previuos preview
  prevPreview() {
    this.currentPage -= 1;
    this.currentExpertise = this.expertiseData[this.currentPage];
  }

  ngOnChanges(): void {
    this.expertiseData = [];
    let tempExpertise = [];
    this.expertise.forEach(exp => {
      if (exp.page_break) {
        tempExpertise.push(exp);
        this.expertiseData.push(tempExpertise);
        tempExpertise = [];
      } else {
        tempExpertise.push(exp);
      }
    });
    if (tempExpertise && tempExpertise.length > 0) {
      this.expertiseData.push(tempExpertise);
    }
    this.currentExpertise = this.expertiseData && this.expertiseData.length > 0 ? this.expertiseData[0] : [];
    this.currentPage = 0;
  }
}
