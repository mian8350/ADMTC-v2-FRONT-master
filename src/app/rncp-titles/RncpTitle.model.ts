export interface RncpTitleIdAndName {
  _id: string;
  short_name: string;
}

export interface ClassIdAndName {
  _id: string;
  name: string;
  type_evaluation?: string;
  already_have_jury_decision?: boolean;
}

export interface ClassData {
  type_evaluation: string;
  allow_job_description: boolean;
  allow_mentor_evaluation: boolean;
  allow_problematic: boolean;
  description: string;
  max_score_competency: number;
  max_score_soft_skill: number;
  name: string;
  score_conversions_competency: ScoreConversionCompetencySoftSkill[];
  score_conversions_soft_skill: ScoreConversionCompetencySoftSkill[];
  _id: string;
}

export interface ScoreConversionCompetencySoftSkill {
  _id: string;
  sign: string;
  score: number;
  phrase: string;
  letter: string;
}

export interface ClassInput {
  name?: string;
  parent_rncp_title: string; // rncp title ID
  description?: string;
  job_description?: boolean;
  problematic?: boolean;
  mentor_evaluation?: boolean;
  status?: string; // active or deleted
  origin_class?: string;
  class_duplication_status?: string;
  is_task_builder_selected?: boolean;
  is_task_builder_generated?: boolean;
}

export interface RncpTitleCardData {
  _id?: string;
  short_name?: string;
  long_name?: string;
  rncp_level?: string;
  is_published?: string;
  certifier: {
    _id?: string;
    logo?: string;
    short_name?: string;
  };
  admtc_dir_responsible: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  academic_kit?: {
    is_created: boolean;
  };
  rncp_logo: string;
}
