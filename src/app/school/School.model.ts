export interface School {
  _id: string;
  shortName: string;
}

export interface SchoolIdAndShortName {
  _id: string;
  short_name: string;
}

export interface SchoolPreparationCenterAndCertifierTable {
  _id: string;
  short_name: string;
  long_name: string;
  type: string[];
  specializations: {
    _id: string;
    name: string;
  }[];
  class_id: {
    _id: string;
    name: string;
  }
}

export interface Title {
  _id: string;
  short_name: string;
  specializations: Specialization[];
}

export interface Specialization {
  _id: string;
  name: string;
}
