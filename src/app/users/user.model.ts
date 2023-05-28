export interface UserTableData {
  _id: string;
  email: string;
  civility: string;
  first_name: string;
  last_name: string;
  entities: {
    school: {
      _id: string;
      short_name: string;
    };
    school_type: string
    assigned_rncp_title: {
      _id: string;
      short_name: string;
    };
    type: {
      _id: string;
      name: string;
    };
    entity_name: string;
  }[];
  user_status: string;
  count_document: number;
}

export interface UserDialogData {
  _id: string;
  civility: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  office_phone: string;
  direct_line: string;
  portable_phone: string;
  address;
  profile_picture;
  created_at;
  updated_at;
  entities: UserDialogEntityData[];
}

export interface UserDialogEntityData {
  entity_name: string;
  school_type: string;
  company_schools: { _id: string }[];
  group_of_schools: { _id: string }[];
  group_of_school: { _id: string };
  school: { _id: string, short_name: string };
  assigned_rncp_title: { _id: string, short_name: string };
  class: { _id: string };
  type: { _id: string };
  companies: { _id: string, company_name: string }[];
}

export interface RegisterUserResp {
  _id:string
  civility: string;
  first_name: string;
  last_name: string;
}

export interface UserProfileData {
  _id: string;
  student_id?: {_id: string};
  civility: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  office_phone: string;
  direct_line: string;
  portable_phone: string;
  profile_picture: string;
  entities: UserProfileEntities[];
}

export interface UserProfileEntities {
  entity_name: string;
  school_type: string;
  company_schools: {
    _id: string;
    short_name: string;
  };
  group_of_schools: {
    _id: string;
    short_name: string;
  };
  school: {
    _id: string;
    short_name: string;
  };
  assigned_rncp_title: {
    _id: string;
    short_name: string;
  };
  class: {
    _id: string;
    name: string;
  };
  type: {
    _id: string;
    name: string;
  };
}
