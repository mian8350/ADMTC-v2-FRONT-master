export class Document {
  _id?: string;
  name: string;
  type: string;
  filePath: string;
  fileName: string;
  parentCategory?: string;
  parentTest?: string;
  parentRNCPTitle?: string;
  createdAt?: Date;
  publicationDate: {
    type: 'relative',
    before: boolean,
    days: number
  } | {
    type: 'fixed',
    publicationDate: string
  };
  taskId?: string;
  documentType?: string;
  lang?: string;
  storedInS3: boolean;
  S3FileName: string;
  publishedForStudent?: boolean;
 // parentTest: any;
  uploadedForGroup?: any;
  uploadedForStudent?: any;
  uploadedForOtherUser?: any;
  constructor(rncpTitleID: string, name: string, publicationDate?: any, parentTest?: string , type?: string, path?: string, fileName?: string, documentType?: string, lang?: string, s3fileName?: string) {
    this.parentRNCPTitle = rncpTitleID;
    this.name = name;
    this.type = type;
    this.filePath = path;
    this.fileName = fileName;
    this.createdAt = new Date();
    this.publicationDate = publicationDate;
    this.documentType = documentType;
    this.lang = lang;
    this.parentTest = parentTest;
    this.S3FileName = s3fileName ? s3fileName : '';
    this.storedInS3 = s3fileName ? true : false;
  }
}
