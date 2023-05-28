export interface TestCorrectionInput {
  test: string, // ID
  corrector: string, // ID
  student: string, // ID
  missing_copy: boolean,
  is_do_not_participated: boolean,
  is_justified: string, // 'yes' or 'no'
  reason_for_missing_copy: string,
  document_for_missing_copy: string[], // array of ID
  date: string // ???, need to be object
  correction_grid: TestCorrectionCorrectionGridInput,
  status?: string // 'active' or 'deleted'
  expected_documents: TestCorrectionExpectedDocumentInput[],
  jury_enabled_list: JuryEnabledListInput[],
  should_retake_test: boolean,
  mark_entry_document: string // ID
  is_cross_correction: boolean,
  final_retake: boolean,
  quality_control: boolean,
  jury_organization: boolean,
  for_retake_correction: boolean,
  is_different_notation_grid: boolean,
  is_initial_correction: boolean,
  retake_correction: string, // ID
  initial_marks_total: number // int
  initial_marks_additional_total: number // int,
  initial_correction: string, // ID
  school_id: string // ID
  element_of_proof_doc: string // ID
}

export interface TestCorrection {
  _id?: string
  is_saved: boolean,
  is_saved_as_draft: boolean,
  test: any, // ID
  corrector: any, // ID
  student: any, // ID
  missing_copy: boolean,
  is_justified: string, // 'yes' or 'no'
  is_do_not_participated?: boolean,
  reason_for_missing_copy: string,
  document_for_missing_copy: string[], // array of ID
  date: string // ???, need to be object
  correction_grid: TestCorrectionCorrectionGridInput,
  status?: string // 'active' or 'deleted'
  expected_documents: TestCorrectionExpectedDocumentInput[],
  jury_enabled_list: JuryEnabledListInput[],
  should_retake_test: boolean,
  mark_entry_document: any // ID
  is_cross_correction: boolean,
  final_retake: boolean,
  quality_control: boolean,
  jury_organization: boolean,
  for_retake_correction: boolean,
  is_different_notation_grid: boolean,
  is_initial_correction: boolean,
  retake_correction: any, // ID
  initial_marks_total: number // int
  initial_marks_additional_total: number // int,
  initial_correction: any, // ID
  school_id: any // ID
  element_of_proof_doc: any
}

export interface TestCorrectionCorrectionGridInput {
  header: TestCorrectionCorrectionGridHeaderInput,
  correction: TestCorrectionCorrectionGridCorrectionInput,
  footer: TestCorrectionCorrectionGridFooterInput
}

export interface TestCorrectionCorrectionGridHeaderInput {
  fields: TestCorrectionCorrectionGridHeaderFieldInput[],
}

export interface TestCorrectionCorrectionGridCorrectionInput {
  penalties: TestCorrectionCorrectionGridCorrectionPenaltyBonusInput[],
  bonuses: TestCorrectionCorrectionGridCorrectionPenaltyBonusInput[],
  elimination: boolean,
  elimination_reason: string,
  total: number,
  total_jury_avg_rating: number,
  additional_total: number,
  final_comment: string,
  sections: TestCorrectionCorrectionGridCorrectionSectionInput[]
  sections_evalskill: TestCorrectionCorrectionGridCorrectionSectionEvalskillInput[]
}

export interface TestCorrectionCorrectionGridFooterInput {
  fields: TestCorrectionCorrectionGridFooterFieldInput[]
}

export interface TestCorrectionCorrectionGridHeaderFieldInput {
  type: string,
  label: string
  value: string
  data_type: string
  align: string
}

export interface TestCorrectionCorrectionGridCorrectionPenaltyBonusInput {
  title: string,
  rating: number // float
}

export interface TestCorrectionCorrectionGridCorrectionSectionInput {
  title: string,
  rating?: number, // float
  comment?: string,
  sub_sections: TestCorrectionCorrectionGridCorrectionSubSectionInput[]
}

export interface TestCorrectionCorrectionGridCorrectionSubSectionInput {
  title: string
  rating?: number // float
  comments?: string
  directions?: string
  marks_number?: number // int
  marks_letter?: string
  jurys?: TestCorrectionCorrectionGridCorrectionSubSectionJuryInput[]
}

export interface TestCorrectionCorrectionGridCorrectionSectionEvalskillInput {
  ref_id?: string
  is_selected?: boolean
  title?: string,
  rating?: number, // float
  comment?: string,
  specialization_id: string
  academic_skill_competence_template_id?: string
  soft_skill_competence_template_id?: string
  academic_skill_block_template_id?: string
  soft_skill_block_template_id?: string
  sub_sections?: TestCorrectionCorrectionGridCorrectionSubSectionEvalskillInput[]
}

export interface TestCorrectionCorrectionGridCorrectionSubSectionEvalskillInput {
  ref_id?: string
  is_selected?: boolean
  title?: string
  rating?: number // float
  comments?: string
  directions?: string
  marks_number?: number // int
  marks_letter?: string
  score_conversion_id?: string
  academic_skill_criteria_of_evaluation_competence_id?: string
  soft_skill_criteria_of_evaluation_competence_id?: string
  academic_skill_competence_template_id?: string
  soft_skill_competence_template_id?: string
  jurys?: TestCorrectionCorrectionGridCorrectionSubSectionJuryInput[]
  multiple_dates?: MultipleDateCorrection[]
  is_criteria_evaluated?: boolean
}

export interface TestCorrectionCorrectionGridCorrectionSubSectionJuryInput {
  name: String
  marks: String
}

export interface TestCorrectionCorrectionGridFooterFieldInput {
  type: string
  label: string
  value: string
  data_type: string
  align: string
}

export interface TestCorrectionExpectedDocumentInput {
  document_name: string
  document: any // ID
  is_uploaded: boolean
  validation_status: string // 'validated' or 'rejected' or 'uploaded'
}

export interface JuryEnabledListInput {
  position: number // int
  state: boolean
}

export interface MultipleDateCorrection {
  date: string
  marks: number
  observation: string
  score_conversion_id: string
}
