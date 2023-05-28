export interface BlockSubjectTestIdAndName {
  _id: string;
  block_of_competence_condition: string;
  block_of_tempelate_competence?: BlockTemplateCompetence;
  block_of_tempelate_soft_skill?: BlockTemplateSoftSkill;
  block_type: string;
  is_retake_by_block: boolean;
  subjects: SubjectsIdAndName[];
}

export interface DuplicateDialogData {
  duplicateFrom: string;
  classId: string;
  blockId: string;
  subjectId: string;
  evalId: string;
}

export interface BlockTemplateSoftSkill {
  name: string;
  ref_id: string;
  _id: string;
  competence_softskill_templates_id: CompetenceSoftSkillTemplate[];
}

export interface CompetenceSoftSkillTemplate {
  name: string;
  ref_id: string;
  _id: string;
  criteria_of_evaluation_softskill_templates_id: CriteriaEvaluationSoftSkillTemplate[];
}

export interface CriteriaEvaluationSoftSkillTemplate {
  name: string;
  ref_id: string;
  _id: string;
}

export interface BlockTemplateCompetence {
  name: string;
  ref_id: string;
  _id: string;
  competence_templates_id: CompetenceTemplate[];
}

export interface CompetenceTemplate {
  name: string;
  ref_id: string;
  _id: string;
  criteria_of_evaluation_templates_id?: CriteriaEvaluationTemplate[];
}

export interface CriteriaEvaluationTemplate {
  name: string;
  ref_id: string;
  _id: string;
}

export interface SubjectsIdAndName {
  _id: string;
  subject_name: string;
  coefficient: number;
  evaluations: TestsData[];
}

export interface TestsData {
  _id: string;
  evaluation: string;
  weight?: number;
  type?: string;
}

export interface TestCreationRespData {
  _id?: string;
  name?: string;
  class?: { _id?: string };
  block_type: string;
  block_of_competence_condition_id?: { _id?: string };
  subject_id?: { _id?: string };
  evaluation_id?: { _id?: string };
  weight?: number;
  type?: string;
  correction_type?: string;
  date?: TestDateUTC;
  date_type?: string;
  quality_control?: boolean;
  student_per_school_for_qc?: number;
  quality_control_difference?: number;
  controlled_test?: boolean;
  group_test?: boolean;
  schools?: SchoolTestDateResp[];
  multiple_dates?: TestDateUTC[];
  calendar: Calendar;
  correction_grid?: CorrectionGrid;
  documents?: AddedDocumentData[];
  expected_documents?: any;
  jury_max?: number;
  cross_corr_paperless?: boolean;
}

export class TestCreationPayloadData {
  // test creation variables
  _id?: string;
  is_published?: boolean;
  name?: string;
  class_id?: string;
  coefficient?: number;
  block_of_competence_condition_id?: string;
  block_type?: string;
  subject_id?: string;
  evaluation_id?: string;
  weight?: number;
  type?: string;
  correction_type?: string;
  organiser?: string;
  date?: TestDateUTC;
  send_date_to_mentor?: TestDateUTC;
  date_type?: string;
  quality_control?: boolean;
  student_per_school_for_qc?: number;
  quality_control_difference?: number;
  controlled_test?: boolean;
  with_assign_corrector?: boolean;
  group_test?: boolean;
  schools?: SchoolTestDatePayload[];
  multiple_dates?: TestDateUTC[];
  calendar?: Calendar;
  correction_grid?: CorrectionGrid;
  documents?: TestCreationDocInput[];
  expected_documents?: ExpectedDocumentForTestInput[];
  current_tab?: string;
  parent_rncp_title?: string;
  parent_category?: string;
  corrector_assigned?: any[];
  cross_corr_paperless?: boolean;

  constructor() {
    this.is_published = false;
    this.class_id = '';
    this.block_of_competence_condition_id = '';
    this.block_type = null;
    this.subject_id = '';
    this.evaluation_id = '';
    this.weight = null;
    this.type = '';
    this.correction_type = '';
    this.organiser = 'prep_center';
    this.date = {
      date_utc: '',
      time_utc: '',
    };
    this.date_type = '';
    this.quality_control = false;
    this.student_per_school_for_qc = null;
    this.quality_control_difference = null;
    this.controlled_test = false;
    this.schools = [];
    this.multiple_dates = [];
    this.calendar = {
      steps: [],
    };
    this.group_test = false;
    this.correction_grid = {
      orientation: 'portrait',
      header: {
        text: '',
        fields: [],
      },
      group_detail: {
        header_text: '',
        no_of_student: 1,
        min_no_of_student: 1,
      },
      correction: {
        display_final_total: true,
        total_zone: {
          display_additional_total: true,
          additional_max_score: 20,
          decimal_place: 2,
        },
        show_as_list: false,
        show_final_comment: false,
        final_comment_header: 'Observations',
        show_notation_marks: true,
        comment_area: false,
        comments_header: 'Observations',
        comment_for_each_section: false,
        comment_for_each_section_header: 'Observations',
        comment_for_each_sub_section: false,
        comment_for_each_sub_section_header: 'Observations',
        show_direction_column: false,
        directions_column_header: 'Directives',
        show_number_marks_column: true,
        number_marks_column_header: 'Note',
        show_letter_marks_column: false,
        letter_marks_column_header: 'Note',
        show_phrase_marks_column: false,
        phrase_marks_column_header: 'Note',
        sections: [],
        sections_evalskill: [],
        show_penalty: false,
        penalty_header: 'Pénalités',
        penalties: [],
        show_bonus: false,
        show_elimination: false,
        bonus_header: 'Bonus',
        bonuses: [],
      },
      footer: {
        text: '',
        text_below: false,
        fields: [],
      },
    };
    this.documents = [];
    this.expected_documents = [];
    this.current_tab = 'first';
    this.cross_corr_paperless = true;
  }
}

export interface TestCreationDocInput {
  doc_id: string;
  document_user_types: string[];
  document_name?: string;
  type_of_document?: string;
  publication_date?: {
    type: string;
    before: boolean;
    day: number;
    publication_date: {
      date: string;
      time: string;
    };
  };
}

export interface ExpectedDocumentForTestInput {
  _id?: string;
  document_name: string;
  file_type: string;
  deadline_date: {
    type: string;
    before: boolean;
    day: number;
    deadline: {
      date: any;
      time: string;
    };
  };
  document_user_type: string;
  is_for_all_student: boolean;
  is_for_all_group: boolean;
  doc_upload_date_retake_exam: string;
  doc_upload_for_final_retake: string;
}

export interface Calendar {
  steps: Step[];
}

export interface Step {
  created_from?: string;
  text?: string;
  actor?: any;
  date?: {
    type?: string;
    before?: boolean;
    day?: number;
    value?: {
      date?: any;
      time?: string;
    };
  };
  sender_entity?: string;
  sender_type?: any;
  sender?: any;
  senderData?: Sender;
  isEditMode?: boolean;
  is_automatic_task?: boolean;
  task_type?: string;
  start_after?: string;
}

export interface Sender {
  _id: string;
  civility: string;
  first_name: string;
  last_name: string;
}

export interface AddedDocumentData {
  _id: string;
  document_name: string;
  type_of_document: string;
  s3_file_name: string;
  publication_date: {
    type?: string;
    before?: string;
    day?: string;
    publication_date?: {
      date?: string;
      time?: string;
    };
    relative_time?: string;
  };
  published_for_user_types_id: [
    {
      _id: string;
      name: string;
    },
  ];
}

export interface TestDateUTC {
  date_utc: any;
  time_utc: string;
}

export interface SchoolTestDateResp {
  school_id?: { _id?: string };
  test_date?: string;
}

export interface SchoolTestDatePayload {
  school_id?: string;
  test_date?: TestDateUTC;
}

export interface CorrectionGrid {
  orientation: string;
  header: {
    text: string;
    fields: {
      value: string;
      type: string;
      data_type: string;
      align: string;
      isEditMode?: boolean;
    }[];
    directive_long?: string;
  };
  group_detail: {
    header_text: string;
    no_of_student: number;
    min_no_of_student: number;
    group_allocation?: boolean;
  };
  correction: Correction;
  footer: {
    text: string;
    text_below: boolean;
    fields: {
      value: string;
      type: string;
      data_type: string;
      align: string;
      isEditMode?: boolean;
    }[];
  };
}

export interface Correction {
  show_as_list: boolean;
  show_notation_marks: boolean;
  show_direction_column: boolean;
  directions_column_header: string;
  show_number_marks_column: boolean;
  number_marks_column_header: string;
  show_letter_marks_column: boolean;
  letter_marks_column_header: string;
  show_phrase_marks_column: boolean;
  phrase_marks_column_header: string;
  comment_area: boolean;
  comments_header: string;
  comment_for_each_section: boolean;
  comment_for_each_section_header: string;
  comment_for_each_sub_section: boolean;
  comment_for_each_sub_section_header: string;
  show_final_comment: boolean;
  final_comment_header: string;
  display_final_total: boolean;
  total_zone: {
    display_additional_total: boolean;
    additional_max_score: number;
    decimal_place: number;
  };
  show_penalty: boolean;
  penalty_header: string;
  show_bonus: boolean;
  bonus_header: string;
  show_elimination: boolean;
  sections: Section[];
  sections_evalskill: SectionEvalskill[];
  penalties: PenaltiesBonuses[];
  bonuses: PenaltiesBonuses[];
}

export interface PenaltiesBonuses {
  title: string;
  count: number;
  isEditMode?: boolean;
}

export interface Section {
  title?: string;
  maximum_rating?: number;
  page_break?: boolean;
  sub_sections?: {
    title: string;
    maximum_rating: number;
    direction: string;
  }[];
  score_conversions?: ScoreConversion[];
}

export interface SectionEvalskill {
  ref_id: string;
  is_selected: boolean;
  title: string;
  page_break: boolean;
  specialization_id: string;
  academic_skill_competence_template_id: {
    _id: string;
  };
  soft_skill_competence_template_id: {
    _id: string;
  };
  academic_skill_block_template_id: {
    _id: string;
  };
  soft_skill_block_template_id: {
    _id: string;
  };
  sub_sections: {
    ref_id: string;
    is_selected: boolean;
    title: string;
    direction: string;
    maximum_rating: number;
    academic_skill_criteria_of_evaluation_competence_id: {
      _id: string;
    };
    soft_skill_criteria_of_evaluation_competence_id: {
      _id: string;
    };
    academic_skill_competence_template_id: {
      _id: string;
    };
    soft_skill_competence_template_id: {
      _id: string;
    };
    multiple_dates: {
      date: string;
      marks: number;
      observation: string;
    };
  }[];
  score_conversions: ScoreConversion[];
}

export interface ScoreConversion {
  _id: string;
  score: number;
  phrase: string;
  letter: string;
}

export interface HeaderFooterFieldType {
  type: string;
  data_type: string;
  view: string;
}

export interface AutomaticTask {
  tasks_list?: Task[];
}

export interface Task {
  actor: {
    _id: string;
    name: string;
  };
  task_type: string;
  reminder: {
    _id: string;
    civility: string;
    first_name: string;
    last_name: string;
  };
  date: {
    type: string;
    before: boolean;
    day: number;
    value: {
      date: string;
      time: string;
    };
  };
  description: string;
  start_after: string;
}

export interface TestProgress {
  document_expected_count: [
    {
      document_expected_id: string;
      count: number;
    },
  ];
  document_expected_done_count: [
    {
      document_expected_id: string;
      count: number;
    },
  ];
  assign_corrector: [
    {
      _id: string;
    },
  ];
  assign_corrector_done: [
    {
      _id: string;
    },
  ];
  mark_entry: [
    {
      _id: string;
    },
  ];
  mark_entry_done: [
    {
      _id: string;
    },
  ];
  validate: [
    {
      _id: string;
    },
  ];
  validate_done: [
    {
      _id: string;
    },
  ];
  create_group: [
    {
      _id: string;
      short_name: string;
    },
  ];
  create_group_done: [
    {
      _id: string;
      short_name: string;
    },
  ];
  school_count: number;
  is_document_expected_done: boolean;
  is_assign_corrector_done: boolean;
  is_mark_entry_done: boolean;
  is_validate_done: boolean;
  // current_progress: string
}

export interface BlockTemplate {
  _id: string;
  ref_id: string;
  name: string;
  competence_templates_id?: CompetenceTemplate[];
  competence_softskill_templates_id?: CompetenceSoftSkillTemplate[];
}
