export interface QuestionnaireTemplateResponseInput {
  questionnaire_name: string,
  questionnaire_grid: QuesResponseGridInput
}

export interface QuesResponseGridInput {
  orientation: string,
  header: QuesResponseGridHeaderInput,
  footer: QuesResponseGridFooterInput
}

export interface QuesResponseGridHeaderInput {
  title: string,
  text: string,
  direction: string,
  fields: QuesResponseGridHeaderAndFooterFieldsInput[]
}

export interface QuesResponseGridFooterInput {
  text: string,
  text_below: boolean,
  fields: QuesResponseGridHeaderAndFooterFieldsInput[]
}

export interface QuesResponseGridHeaderAndFooterFieldsInput {
  type: string,
  value: string,
  data_type: string,
  align: string
}

export interface CompetenceJobDescriptionResponse {
  competence_template_id: {
    _id: string
  }
  missions_activities_autonomy: MissionsActivitiesAutonomy[]
}

export interface MissionsActivitiesAutonomy {
  activity: string
  autonomy_level: string
  mission: string
}
