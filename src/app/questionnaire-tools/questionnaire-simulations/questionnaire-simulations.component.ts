import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SubSink } from 'subsink';
import { QuetionaireService } from '../quetionaire.service';

@Component({
  selector: 'ms-questionnaire-simulations',
  templateUrl: './questionnaire-simulations.component.html',
  styleUrls: ['./questionnaire-simulations.component.scss']
})
export class QuestionnaireSimulationsComponent implements OnInit {
  private subs = new SubSink();

  templateId;
  selectedQuestionnaire;

  constructor(
    public questionnaireservice: QuetionaireService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.getParamRoute();
    this.getTemplateData();
  }

  getParamRoute() {
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;

      this.templateId = params && params.templateId ? params.templateId : '';

    }
  }

  getTemplateData() {
    this.subs.sink = this.questionnaireservice.getOneQuestionnaireTemplateById(this.templateId).subscribe(questionnaire => {

      this.selectedQuestionnaire = questionnaire;
    });
  }

}
