export interface SaveScheduleOfJuryRncpTitlePayload {
  rncp_id: string;
  class_id: string;
  test_id: string;
  schools: SaveScheduleOfJuryRncpTitleSchoolPayload[];
}

export interface SaveScheduleOfJuryRncpTitleSchoolPayload {
  school: string;
  number_of_jury: number;
  retake_center: string;
  date_start: string;
  date_finish: string;
  students: string[];
  is_jury_assigned: Boolean;
  test_groups: string[];
  backup_date_start: string;
  backup_time_start: string;
  backup_date_finish: string;
  backup_time_finish: string;
  time_start: string;
  time_finish: string;
}

export interface JuryOrganizationParameter {
  _id: string;
  name: string;
  type: string;
  certifier: {
    _id: string;
  };
  is_published: boolean;
  jury_created_by: {
    _id: string;
  };
  survival_kit: {
    _id: string;
    document_name: string;
    s3_file_name: string;
  }[];
  current_status: string;
  rncp_titles: JuryOrganizationParameterTitle[];
  jury_member_required: boolean;
  online_jury_organization: boolean;
  jury_activity: string;
  is_new_flow: boolean;
}

export interface JuryOrganizationParameterTitle {
  rncp_id: {
    _id: string;
    short_name: string;
  };
  class_id: {
    _id: string;
    name: string;
  };
  test_id: {
    _id: string;
    name: string;
  };
  blocks_for_grand_oral?: any[];
  schools: JuryOrganizationParameterTitleSchool[];
}

export interface JuryOrganizationParameterTitleSchool {
  school: {
    _id: string;
    short_name: string;
    school_address: {
      city: string;
    }[];
  };
  number_of_jury: number;
  retake_center: {
    _id: string;
    short_name: string;
  };
  date_start: string;
  date_finish: string;
  students: any;
  is_jury_assigned: boolean;
  test_groups: { _id: string; name: string }[];
  backup_date_start: string;
  backup_time_start: string;
  backup_date_finish: string;
  backup_time_finish: string;
  time_start: string;
  time_finish: string;
  is_school_selected_for_grand_oral?: boolean;
}

export interface JuryMember {
  _id: string;
  jury_serial_number: string;
  date_start: string;
  school: {
    short_name: string;
    school_address: {
      city: string;
    }[];
  };
  rncp_title: {
    short_name: string;
  };
  students: {
    student_id: {
      _id: string;
    };
  }[];
  president_of_jury: any;
  presidentJury?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  professional_jury_member: any;
  professionalJury?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  academic_jury_member: any;
  academicJury?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  substitution_jury_member: any;
  substitutionJury?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
}

export interface JuryData {
  _id: string;
  first_name: string;
  last_name: string;
  entities?: JuryDataEntities[];
}

export interface JuryDataEntities {
  school: { _id: string; short_name: string };
}
