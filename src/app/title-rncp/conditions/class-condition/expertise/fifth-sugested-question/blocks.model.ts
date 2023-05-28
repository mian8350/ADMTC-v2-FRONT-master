export interface BlockCompetencyModel {
  _id: string;
  name: string;
  description?: string;
  note?: string;
  competence_templates_id?: CompetencyModel[];
  competence_softskill_templates_id?: CompetencyModel[];
}

export interface CompetencyModel {
  _id: string;
  name: string;
  description?: string;
  criteria_of_evaluation_templates_id?: EvaluationCriteriaModel[];
  criteria_of_evaluation_softskill_templates_id?: EvaluationCriteriaModel[];
}

export interface EvaluationCriteriaModel {
  _id: string;
  name: string;
  description?: string;
}
