export interface ExpertiseBlockDropdown {
  _id: string;
  block_of_competence_condition: string;
}

export interface SubjectDropdown {
  _id: string;
  subject_name: string;
}

export interface TestDropdown {
  _id: string;
  evaluation: string;
}

export interface SchoolStudentTableSubject {
  _id: string;
  subject_name: string;
  order: number;
  evaluations: SchoolStudentTableEvaluation[];
}

export interface SchoolStudentTableEvaluation {
  _id: string;
  evaluation: string;
  order: number;
}

export interface JuryDecisionParameterPayload {
  rncp_id: string;
  class_id: string;
  decision_parameters:
  {
    condition_type: string;
    condition_name: string;
    parameters: ParamPayload[];
  }[];
}

export interface ParamPayload {
  correlation?: string;
  validation_type: string;
  block_parameters?: string[] | string;
  subject_parameters?: string[] | string;
  evaluation_parameters?: string[] | string;
  sign: string;
  score: number;
}

export interface JuryDecisionParameterResponseData {
  _id: string;
  decision_parameters:
  {
    condition_type: string;
    condition_name: string;
    parameters:
    {
      correlation?: string;
      validation_type: string;
      block_parameters?: { _id: string; block_of_experise: string; }[];
      subject_parameters?: { _id: string; subject_name: string; }[];
      evaluation_parameters?: { _id: string; evaluation: string; }[];
      sign: string;
      score: number;
    }[];
  }[];
}
