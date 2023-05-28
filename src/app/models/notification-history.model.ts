export interface NotificationHistory {
  count_document: number;
  _id: string;
  sent_date: {
    date_utc: String;
    time_utc: String;
  };
  notification_reference: string;
  notification_subject: string;
  notification_message: string;
  rncp_titles: {
    _id: string;
    short_name: string;
  };
  schools: {
    _id: string;
    short_name: string;
  };
  from: {
    last_name: string;
    first_name: string;
    civility: string;
  };
  to: {
    last_name: string;
    first_name: string;
    civility: string;
  };
  subject: {
    subject_name: string;
  };
  test: {
    name: string;
  };
}
