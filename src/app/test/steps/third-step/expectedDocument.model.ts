
export class ExpectedDocuments {
    documentName: string;
    documentUserType: string;
    deadlineDate: {
        type: 'relative',
        before: boolean,
        days: number
    } | {
        type: 'fixed',
        deadline: string
    };
    isForAllStudents: boolean;
    docUploadDateRetakeExam: string;

    constructor() {
        this.documentName = '';
        this.documentUserType = '';
        this.deadlineDate = null;

}

}
