
export class ExpectedDocuments {
    document_name: string;
    document_user_type: {
        _id: String
    }
    deadline_date: {
        type: 'relative',
        before: boolean,
        day: number
    } | {
        type: 'fixed',
        deadline: string
    };
    is_for_all_student: boolean;
    doc_upload_date_retake_exam: string;

    constructor() {
        this.document_name = '';
        this.deadline_date = null;

}

}
