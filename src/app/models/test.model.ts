import { Document } from './document.model';
import { ExpectedDocuments } from './expectedDocument.model';

export class Test {
  _id: string;
  parent_rncp_title: string;
  parent_category: string;
  incomplete_creation: boolean;
  name: string;
  type: string;
  class_id: string;
  max_score: number;
  coefficient: number;
  correction_type: string;
  organiser: string;
  date_type: string;
  group_test: boolean;
  weight: number;
  date: any;
  controlled_test: boolean;
  cross_corr_paperless?: boolean;
  linked_tests: {
    test: string;
    coefficient: number;
  }[];
  schools: [
    {
      school_details: string;
      test_date: string;
    },
  ];
  correction_grid: {
    orientation: string;
    header: {
      text: string;
      fields: {
        type: string;
        value: string;
        dataType: string;
        align: string;
      }[];
    };
    group_detail: {
      no_of_student: number;
      min_no_of_student: number;
      header_text: string;
    };
    correction: {
      display_final_total: boolean;
      total_zone: {
        display_additional_total: boolean;
        additional_max_score: number;
        decimal_place: number;
      };
      show_as_list: boolean;
      show_final_comment: boolean;
      final_comment_header: string;
      show_notation_marks: boolean;
      comment_area: boolean;
      comments_header: string;
      comment_for_each_section: boolean;
      comment_for_each_section_header: string;
      comment_for_each_sub_section: boolean;
      comment_for_each_sub_section_header: string;
      show_direction_column: boolean;
      directions_column_header: string;
      show_number_marks_column: boolean;
      number_marks_column_header: string;
      show_letter_marks_column: boolean;
      letter_marks_column_header: string;
      show_phrase_marks_column: boolean;
      phrase_marks_column_header: string;
      show_penalty: boolean;
      penalty_header: string;
      penalties: {
        title: string;
        count: number;
      }[];
      show_bonus: boolean;
      bonus_header: string;
      bonuses: {
        title: string;
        count: number;
      }[];
      show_elimination: boolean;
      sections: {
        title: string;
        maximum_rating: number;
        page_break: boolean;
        sub_section: {
          title: string;
          maximum_rating: number;
          direction: string;
        }[];
      }[];
    };
    footer: {
      text: string;
      text_below: boolean;
      fields: {
        type: string;
        value: string;
        dataType: string;
        align: string;
      }[];
    };
  };
  documents: Document[];
  expected_documents: ExpectedDocuments[];
  subject_id: string;
  evaluation_id: string;
  add_documents: {
    name: string;
    type: string;
    file_path: string;
    file_name: string;
    document_type: string;
    parent_test: string;
    created_at: string;
    publication_date: {
      type: any;
      before: boolean;
      day: any;
      publication_date: {
        year: any;
        month: null;
        date: null;
        hour: null;
        minute: null;
        time_zone: any;
      };
    };
  }[];
  calendar: {
    steps: {
      text: string;
      sender: string;
      actor: string;
      date:
        | {
            type: 'relative';
            before: boolean;
            day: number;
          }
        | {
            type: 'fixed';
            value: string;
          };
      created_from: string;
    }[];
  };
  jury_min: number;
  jury_max: number;
  added_questionnaire: boolean;
  questionnaire: string;
  allow_retake_exam: boolean;
  quality_control: boolean;
  date_retake_exam: string;
  quality_control_difference: number;
  student_per_school_for_qc: number;
  // subTestFor?: string;
  // isSubTest: boolean;
  is_retake_test: boolean;
  is_initial_test: boolean;
  is_different_notation_grid: boolean;

  constructor() {
    this.added_questionnaire = false;

    this.incomplete_creation = true;

    this.name = '';

    this.type = '';

    this.max_score = null;

    this.coefficient = 1;

    this.correction_type = '';

    this.organiser = '';

    this.date_type = '';

    this.date = {};

    this.group_test = false;

    this.controlled_test = false;

    this.linked_tests = [];

    //this.schools = null;
    this.schools = [
      {
        school_details: '',
        test_date: '',
      },
    ];

    this.correction_grid = {
      orientation: 'portrait',
      header: {
        text: '',
        fields: [],
      },
      group_detail: {
        no_of_student: 3,
        min_no_of_student: 1,
        header_text: 'Liste des élèves',
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

    this.subject_id = '';
    this.evaluation_id = '';
    this.documents = [];
    this.expected_documents = [];
    this.add_documents = [];
    this.calendar = {
      steps: [],
    };
    this.weight = 0;
    this.allow_retake_exam = false;
    this.date_retake_exam = '';
    this.is_retake_test = false;
    this.is_initial_test = true;
    this.is_different_notation_grid = false;
    this.cross_corr_paperless = true;
  }
}
