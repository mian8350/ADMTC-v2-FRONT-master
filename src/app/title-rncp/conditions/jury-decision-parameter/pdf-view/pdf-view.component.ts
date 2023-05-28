import { Component, OnInit, Input } from '@angular/core';
import {
  JuryDecisionParameterPayload,
  ExpertiseBlockDropdown,
  SubjectDropdown,
  TestDropdown,
  ParamPayload,
} from '../jury-decision-parameter.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-pdf-view',
  templateUrl: './pdf-view.component.html',
  styleUrls: ['./pdf-view.component.scss'],
})
export class PdfViewComponent implements OnInit {
  @Input() juryDecisionparameterData: JuryDecisionParameterPayload;
  @Input() selectedRncpTitleName: string;
  @Input() selectedRncpTitleLongName: string;
  @Input() selectedClassName: string;

  @Input() expertises: ExpertiseBlockDropdown[];
  @Input() subjects: SubjectDropdown[];
  @Input() tests: TestDropdown[];

  constructor(
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  getParameterData(validationType, paramData: ParamPayload) {
    switch (validationType) {
      case 'block':
        if (this.expertises) {
          const blockFilteredData = this.expertises.filter(exp => exp._id === paramData.block_parameters);
          return blockFilteredData.length > 0 ? blockFilteredData[0].block_of_competence_condition : '';
        } else {
          return '';
        }

      case 'subject':
        const subjectFilteredData = this.subjects.filter(sub => sub._id === paramData.subject_parameters);
        return subjectFilteredData.length > 0 ? subjectFilteredData[0].subject_name : '';

      case 'test':
        const testFilteredData = this.tests.filter(test => test._id === paramData.evaluation_parameters);
        return testFilteredData.length > 0 ? testFilteredData[0].evaluation : '';

      case 'average_block':
        let avgBlockString = '';
        // to convert block_parameters that has only one element to be an array
        const blockParams = [].concat(paramData.block_parameters);

        for (const block of blockParams) {
          const dataFound = this.expertises.filter(exp => exp._id === block);
          avgBlockString = dataFound ? avgBlockString + dataFound[0].block_of_competence_condition + ', ' : '';
        }
        return avgBlockString;

      case 'average_subject':
        let avgSubjectString = '';
        const subjectParams = [].concat(paramData.subject_parameters);

        for (const subj of subjectParams) {
          const dataFound = this.subjects.filter(sub => sub._id === subj);
          avgSubjectString = dataFound ? avgSubjectString + dataFound[0].subject_name + ', ' : '';
        }
        return avgSubjectString;

      case 'average_test':
        let avgTestString = '';
        const testParams = [].concat(paramData.evaluation_parameters);

        for (const test of testParams) {
          const dataFound = this.tests.filter(tst => tst._id === test);
          avgTestString = dataFound ? avgTestString + dataFound[0].evaluation + ', ' : '';
        }
        return avgTestString;

      case 'overall_average':
        return this.translate.instant('overall_average');
    }
  }
}
