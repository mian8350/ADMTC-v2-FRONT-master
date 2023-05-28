export class Questionnaire {
  questionnaire_name: string;
  status?: string;
  _id: string;
  questionnaire_type: string;
  mentorEvaluationFormStatus?: string;
  created_by: string;
  competence: Competence[];

  questionnaire_grid: {
    orientation: string,
    header: {
      title: string,
      text: string,
      direction: string,
      fields: {
        type: string,
        value: string,
        data_type: string,
        align: string
      }[]
    },
    footer: {
      text: string,
      text_below: boolean,
      fields: {
        type: string,
        value: string,
        data_type: string,
        align: string
      }[]
    }
  };
  is_published?: boolean;
  constructor() {
    this.questionnaire_name = '';
    this.questionnaire_type = '';
    this.is_published = false;
    this.created_by = '';
    this.questionnaire_grid = {
      orientation: 'portrait',
      header: {
        title: '',
        text: '',
        direction: '',
        fields: []
      },
      footer: {
        text: '',
        text_below: false,
        fields: []
      }
    };
    this.competence = [];
  }
}

export class Competence {
  _id: string;
  competence_name: string;
  block_type: string;
  sort_order: number;
  segment: Segment[];
  page_break?: boolean;

  constructor() {
    this._id = '';
    this.competence_name = '';
    this.sort_order = 1;
    this.block_type = '';
    this.segment = [];
  }
}

export class Segment {
  _id: string;
  segment_name: string;
  sort_order: number;
  question: Questions[];

  constructor() {
    this._id = '';
    this.segment_name = '';
    this.sort_order = 1;
    this.question = [];
  }
}

export class Questions {
  _id?: string;
  is_answer_required: boolean;
  questionnaire_field_key: string;
  is_field: boolean;
  question_name: string;
  question_type: string;
  options: any[];
  answer: string;
  answer_multiple?: string [];
  parent_child_options?: ChildOptions[];
  sort_order?: number;
  answer_type?: any;
  constructor() {
    this.is_answer_required = false;
    this.questionnaire_field_key = '';
    this.is_field = false;
    this.question_name = '';
    this.question_type = 'none';
    this.options = [];
    this.answer = '';
  }
}

export class ChildOptions {
  option_text: String;
  questions: Questions[];
  position: Number;
}

export class EmployibilitySurvey {
  _id?: string;
  surveyStatus: string;
  title: string;
  directions: string;
  firstName: string;
  lastName: string;
  postalAddress: string;
  postalCode: number;
  city: string;
  cellPhone: number;
  phone: number;
  personalMail: string;
  professionalMail: string;
  parent_surnameAndFirstName: string;
  parent_completeMailingAddress: string;
  parent_cellPhone: number;
  parent_phone: number;
  parent_personalMail: string;
  parent_professionalMail: string;
  parent_profession: string;
  experience_graduated: string;
  experience_marketingExperience: string;
  experience_lastDiploma: string;
  experience_marketingExperienceYes_jobStatus: string;
  experience_marketingExperienceYes_experienceInMonths: number;
  experience_marketingExperienceYes_positionOccupied: string;
  experience_marketingExperienceYes_practicingActivity: string;
  currentSituation_currentJob: string;
  currentSituation_comments: string;
  scholarSeasonId: {
    scholarseason: string;
  };
  schoolId: {
    shortName: string;
  };
  rncpId: {
    longName: string;
    shortName: string;
    displaySurveySet2: boolean;
    employabilitySurvey: {
      isDMOE: boolean;
      isRMO: boolean;
    };
  };
  classId: {
    name: string;
  };

  titleOfPositionHeld: string;

  contract_startDate: string;
  contract_endDate: string;
  contract_status: string;
  contract_grossSalary: number;
  contract_comissionAnually: number;
  contract_comissionInEuros: number;
  contract_companyName: string;
  contract_companyBusinessSector: string;
  contract_companyWebsite: string;

  DMOE_Q1: string;
  DMOE_Q2: string;
  DMOE_Q3: string;
  DMOE_Q4: string;
  DMOE_Q5: string;
  DMOE_Q6: string;
  DMOE_Q7: string;
  DMOE_Q8: string;
  DMOE_Q9: string;
  DMOE_Q10: string;
  DMOE_Q11: string;
  DMOE_Q12: string;
  DMOE_Q13: string;
  DMOE_Q14: string;
  DMOE_Q15: string;
  DMOE_Q16: string;
  DMOE_Q17: string;

  RMO_Q1: string;
  RMO_Q2: string;
  RMO_Q3: string;
  RMO_Q4: string;
  RMO_Q5: string;
  RMO_Q6: string;
  RMO_Q7: string;
  RMO_Q8: string;
  RMO_Q9: string;
  RMO_Q10: string;
  RMO_Q11: string;
  RMO_Q12: string;
  RMO_Q13: string;
  RMO_Q14: string;
  questionnaireId: string;
  questionnaireResponseId: string;
  rejectionDetails: [{
    date: Date,
    reason: '',
  }];
  updatedAt: any;

  constructor() {
    this._id = '';
    this.surveyStatus = '';
    this.title = '';
    this.directions = '';
    this.firstName = '';
    this.lastName = '';
    this.postalAddress = '';
    this.postalCode = 0;
    this.city = '';
    this.cellPhone = 0;
    this.phone = 0;
    this.personalMail = '';
    this.professionalMail = '';
    this.parent_surnameAndFirstName = '';
    this.parent_completeMailingAddress = '';
    this.parent_cellPhone = 0;
    this.parent_phone = 0;
    this.parent_personalMail = '';
    this.parent_professionalMail = '';
    this.parent_profession = '';
    this.experience_graduated = '';
    this.experience_marketingExperience = '';
    this.experience_marketingExperienceYes_jobStatus = '';
    this.experience_lastDiploma = '';
    this.experience_marketingExperienceYes_experienceInMonths = 0;
    this.experience_marketingExperienceYes_positionOccupied = '';
    this.experience_marketingExperienceYes_practicingActivity = '';
    this.currentSituation_currentJob = '';
    this.currentSituation_comments = '';
    this.questionnaireResponseId = '';
    this.questionnaireId = '';
  }
}

export const QuestionnaireConsts = {

  fieldTypes: [
      {
        value: 'date',
        view: 'Date'
      },
      {
        value: 'text',
        view: 'Text'
      },
      {
        value: 'number',
        view: 'Number'
      },
      {
        value: 'pfereferal',
        view: 'PFE Referal'
      },
      {
        value: 'jurymember',
        view: 'Jury Member'
      },
      {
        value: 'longtext',
        view: 'Long Text'
      },
      {
        value: 'signature',
        view: 'Signature'
      },
      {
        value: 'correctername',
        view: 'Corrector Name'
      }
    ],
    requiredFieldsTypes: [
      {
        value: 'eventName',
        view: 'Name of the Event',
        type: 'text',
        removed: false
      },
      {
        value: 'dateRange',
        view: 'Date Range',
        type: 'date',
        removed: false
      },
      {
        value: 'dateFixed',
        view: 'Date Fixed',
        type: 'date',
        removed: false
      },
      {
        value: 'titleName',
        view: 'Title Name',
        type: 'text',
        removed: false
      },
      {
        value: 'status',
        view: 'Status',
        type: 'text',
        removed: false
      }
    ],
    questionnaireFields: [
      'STUDENT_CIVILITY',
      'STUDENT_FIRST_NAME',
      'STUDENT_LAST_NAME',
      'STUDENT_ADDR_1',
      'STUDENT_ADDR_2',
      'STUDENT_POSTAL_CODE',
      'STUDENT_CITY',
      'STUDENT_COUNTRY',
      'STUDENT_MOBILE',
      'STUDENT_FIX_PHONE',
      'STUDENT_PERSONAL_EMAIL',
      'STUDENT_PROFESSIONAL_EMAIL',
      'STUDENT_DIPLOMA',
      'STUDENT_SCHOOL',
      'PARENT_RELATION',
      'PARENT_CIVILITY',
      'PARENT_FIRST_NAME',
      'PARENT_LAST_NAME',
      'PARENT_ADDR_1',
      'PARENT_ADDR_2',
      'PARENT_POSTAL_CODE',
      'PARENT_CITY',
      'PARENT_COUNTRY',
      'PARENT_MOBILE',
      'PARENT_JOB',
      'PARENT_PERSONAL_EMAIL',
      'PARENT_PROFESSIONAL_EMAIL'
    ],

    questionAnswerTypes: [
      {name: 'NUMERIC', key: 'numeric'},
      {name: 'DATE', key: 'date'},
      {name: 'FREE_TEXT', key: 'free_text'},
      {name: 'SINGLE_OPTION', key: 'single_option'},
      {name: 'MULTIPLE_OPTION', key: 'multiple_option'},
      {name: 'EMAIL', key: 'email'},
      {name: 'PARENT_AND_CHILD', key: 'parent_child'},
      {name: 'MULTIPLE_TEXTBOX', key: 'multiple_textbox'},
      {name: 'MISSION_ACTIVITY', key: 'mission_activity'},
    ]
}