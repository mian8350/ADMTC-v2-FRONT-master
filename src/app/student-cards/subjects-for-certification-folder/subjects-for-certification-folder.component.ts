import { Component, OnInit, Output, Input, EventEmitter, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { DocumentDetailDialogComponent } from 'app/rncp-titles/dashboard/document-detail-dialog/document-detail-dialog.component';
import { AcadKitDocument, AcadKitFolder, ExpectedDocument } from 'app/rncp-titles/dashboard/academic-kit.model';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-subjects-for-certification-folder',
  templateUrl: './subjects-for-certification-folder.component.html',
  styleUrls: ['./subjects-for-certification-folder.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class SubjectsForCertificationFolderComponent implements OnInit, OnDestroy {
  @ViewChild(SubjectsForCertificationFolderComponent, { static: false }) childRef: SubjectsForCertificationFolderComponent;

  @Input() folder: any;
  @Input() isSubfolder: boolean;
  @Input() schoolId: string;
  @Input() dataSubFolder: any;
  @Input() isRootFolder: boolean;
  @Input() customRootFolderIndex: number;
  @Output() updateDocument = new EventEmitter();

  isWaitingForResponse = false;
  selectedClassId = '';
  private subs = new SubSink();
  acadKitFolders: AcadKitFolder[] = [];
  testProgressData = [];

  folderId;

  // to determine which type of folder's child is displayed
  expandFolder = {
    subFolder: false,
    folders: false,
    documents: false,
    tests: false,
    testDetail: [],
    expectedDocuments: [],
    cvDocuments: false,
    presentationDocument: false,
    grandOralPdf: false,
    grandOralResult: false,
    elementOfProofDocument: false,
    manualDocuments: false,
  };

  documentResultAutoEval: any[] = [];

  constructor(
    private schoolService: SchoolService,
    public dialog: MatDialog,
    private router: Router,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private utilService: UtilityService,
    private groupCreationService: GroupCreationService,
    private rncpTitleService: RNCPTitlesService,
    private authServ: AuthService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.documentResultAutoEval = [];
    if (this.isSubfolder && this.dataSubFolder) {
      this.folderId = _.cloneDeep(this.folder._id);

      this.getSubFolders(this.dataSubFolder);
      this.getDocumentResultAutoEval();
    }
  }

  toggleSubFolder(folderId: string) {
    this.expandFolder.subFolder = !this.expandFolder.subFolder;

    // if (this.expandFolder.subFolder) {
    //   this.getSubFolders(folderId);
    // }
  }

  toggleFolder(folder: string) {
    this.expandFolder.folders = !this.expandFolder.folders;
  }

  getSubFolders(data) {
    this.isWaitingForResponse = true;
    this.folder = {
      name: data.folder_name,
      documents: data.documents,
      tests: data.tests,
      parent_rncp_title: data.parent_rncp_title,
      school: data.school,
      type: data && data.jury_id && data.jury_id.type ? data.jury_id.type : null,
    };
    this.getExpectedDocuments(data.documents);
    this.getResultDocuments(data.documents);
    this.getCvPresentationDocuments(data.documents);
    this.getTestProgress();
    this.getGrandOralPDFDocument(data.documents);
    this.getGrandOralResultDocument(data.documents);
    this.getElementOfProofDocument(_.cloneDeep(data.documents));
    this.getManualDocuments(_.cloneDeep(data.documents));
    this.isWaitingForResponse = false;
  }

  getGrandOralPDFDocument(data) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);
    const tempDocPDF = [];
    if (documents && documents.length) {
      documents.forEach((doc) => {
        // PDF
        if (doc.type_of_document === 'grand_oral_pdf') {
          tempDocPDF.push(doc);
        }
      });
      this.folder.grand_oral_pdfs = tempDocPDF;
    }
  }

  getGrandOralResultDocument(data) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);
    const tempDocPDF = [];
    if (documents && documents.length) {
      documents.forEach((doc) => {
        // PDF
        if (doc.type_of_document === 'grand_oral_result_pdf') {
          tempDocPDF.push(doc);
        }
      });
      this.folder.grand_oral_result_pdfs = tempDocPDF;
    }
  }

  getTestProgress() {
    if (this.folder && this.folder.tests && this.folder.tests.length) {
      this.folder.tests.forEach((test, index) => {
        this.subs.sink = this.groupCreationService.getTestProgress(test._id, this.dataSubFolder.school._id).subscribe((resp) => {
          if (resp) {
            const data = _.cloneDeep(resp);
            data['is_document_expected_done'] = !!data.document_expected_done_count && data.document_expected_done_count.length;
            data['is_assign_corrector_done'] = !!data.assign_corrector_done && data.assign_corrector_done.length;
            data['is_mark_entry_done'] = !!data.mark_entry_done && data.mark_entry_done.length;
            data['is_validate_done'] = !!data.validate_done && data.validate_done.length;
            if (this.testProgressData && this.testProgressData[index]) {
              this.testProgressData[index] = data;
            } else {
              this.testProgressData.push(data);
            }
          } else {
            this.testProgressData = [];
          }
        });
      });
    }
  }

  showTestData(isFolder06, testData, testIndex) {
    const autoprotype = [
      'academic_auto_evaluation',
      'academic_pro_evaluation',
      'soft_skill_auto_evaluation',
      'soft_skill_pro_evaluation',
      'preparation_center_eval_soft_skill',
    ];
    let result = false;
    if (isFolder06 && this.testProgressData && this.testProgressData[testIndex]) {
      if (
        testData &&
        testData.correction_type !== 'admtc' &&
        (this.testProgressData[testIndex].is_assign_corrector_done || this.testProgressData[testIndex].is_mark_entry_done)
      ) {
        result = true;
      } else if (testData && testData.correction_type === 'admtc' && this.testProgressData[testIndex].is_mark_entry_done) {
        result = true;
      }
      if (testData && testData.type && autoprotype.includes(testData.type.toLowerCase())) {
        result = true;
      }
    }
    return result;
  }

  getResultDocuments(data: AcadKitDocument[]) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);

    for (const test of this.folder.tests) {
      for (const doc of documents) {
        if (doc.parent_test && doc.type_of_document !== 'documentExpected') {
          test.documents.push(doc);
          test.documents = _.uniqBy(test.documents, '_id');
        }
      }
      // For PDF Result of type B, need to come from
    }
  }

  getCvPresentationDocuments(data: AcadKitDocument[]) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);
    const tempDocsCV = [];
    const tempDocsPresentation = [];
    // create array of expected document

    if (
      documents &&
      documents.length &&
      (documents[0].type_of_document === 'student_upload_grand_oral_presentation' ||
        documents[0].type_of_document === 'student_upload_grand_oral_cv')
    ) {
      documents.forEach((doc) => {
        // Presentation
        if (doc.type_of_document === 'student_upload_grand_oral_presentation') {
          tempDocsPresentation.push(doc);
        }
        // CV
        if (doc.type_of_document === 'student_upload_grand_oral_cv') {
          tempDocsCV.push(doc);
        }
      });
      this.folder.presentationDocuments = tempDocsPresentation;
      this.folder.cvDocuments = tempDocsCV;
    }
  }

  isDocumentTimePassedCurrentTime(document: AcadKitDocument, isFolder06: boolean) {
    let validate = false;

    // ************** since subject of certification is folder 06, always show them
    return true;

    if (document) {
      const test = document.parent_test ? document.parent_test : null;
      const timeToday = moment();

      // ADMTC will always able to see the document regardless the user or the publication time
      if (this.utilService.isUserEntityADMTC() && !isFolder06) {
        return true;
      }

      // Check if user is the correct WHO in the test creation tab 3
      const data = this.utilService.checkIsCurrentUserIncluded(document.published_for_user_types_id);
      if (!data && !isFolder06) {
        return false;
      }

      if (document && document.publication_date && !isFolder06) {
        if (document.publication_date.type === 'fixed') {
          const timePublication = this.parseUTCtoLocal.transformDateInDateFormat(
            document.publication_date.publication_date.date,
            document.publication_date.publication_date.time,
          );
          if (timeToday.isSameOrAfter(timePublication)) {
            validate = true;
          }
        } else if (document.publication_date.type === 'relative') {
          if ((test && test.date_type === 'marks') || test.date_type === 'different') {
            let timePublication = this.parseUTCtoLocal.transformDateInDateFormat(test.date.date_utc, test.date.time_utc);

            if (document.publication_date.before) {
              timePublication = timePublication.subtract(document.publication_date.day, 'd');
            } else {
              timePublication = timePublication.add(document.publication_date.day, 'd');
            }
            if (timeToday.isSameOrAfter(timePublication)) {
              validate = true;
            }
          } else if (test && test.date_type === 'fixed') {
            let timePublication = this.parseUTCtoLocal.transformDateInDateFormat(test.date.date_utc, test.date.time_utc).add(3, 'days');

            if (document.publication_date.before) {
              timePublication = timePublication.subtract(document.publication_date.day, 'd');
            } else {
              timePublication = timePublication.add(document.publication_date.day, 'd');
            }

            if (timeToday.isSameOrAfter(timePublication)) {
              validate = true;
            }
          }
        }
      } else if (isFolder06) {
        validate = true;
      }
    }

    return validate;
  }

  getExpectedDocuments(data: AcadKitDocument[]) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);
    let expectedDocs: ExpectedDocument[] = [];
    // create array of expected document
    documents.forEach((doc) => {
      if (
        doc &&
        doc.status !== 'deleted' &&
        doc.parent_test &&
        doc.parent_test.expected_documents &&
        doc.parent_test.expected_documents.length
      ) {
        doc.parent_test.expected_documents.forEach((ex) => {
          expectedDocs.push({
            _id: ex._id,
            name: ex.document_name,
            documents: [],
          });
        });
      }
    });
    expectedDocs = _.uniqBy(expectedDocs, (doc: ExpectedDocument) => doc._id);
    // assign each documents to expected document array
    for (const doc of documents) {
      for (const ex of expectedDocs) {
        if (doc && doc.document_expected_id && doc.document_expected_id._id === ex._id) {
          ex.documents.push(doc);
          break;
        } else if (doc && doc.document_name && doc.document_name.includes(ex.name)) {
          ex.documents.push(doc);
          break;
        }
      }
    }
    // remove document that has type_of_document other than documentExpected
    expectedDocs.forEach((exp) => {
      exp.documents = exp.documents.filter((doc) => doc.type_of_document === 'documentExpected');
    });
    // sort documents of expected document
    for (const expectedDoc of expectedDocs) {
      if (expectedDoc.documents && expectedDoc.documents[0] && expectedDoc.documents[0].uploaded_for_other_user) {
        expectedDoc.documents.sort((a: AcadKitDocument, b: AcadKitDocument) => {
          if (!a.uploaded_for_other_user || !b.uploaded_for_other_user) {
            return 0;
          }
          const nameA = a.uploaded_for_other_user.last_name.toLowerCase().trim();
          const nameB = b.uploaded_for_other_user.last_name.toLowerCase().trim();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
      } else if (expectedDoc.documents && expectedDoc.documents[0] && expectedDoc.documents[0].uploaded_for_student) {
        expectedDoc.documents.sort((a: AcadKitDocument, b: AcadKitDocument) => {
          if (!a.uploaded_for_student || !b.uploaded_for_student) {
            return 0;
          }
          const nameA = a.uploaded_for_student.last_name.toLowerCase().trim();
          const nameB = b.uploaded_for_student.last_name.toLowerCase().trim();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
      }
    }
    this.folder.expectedDocuments = [...expectedDocs];
  }

  openDocumentDetails(document: AcadKitDocument) {
    if (document && (document.type_of_document === 'grand_oral_result_pdf' || document.type_of_document === 'grand_oral_pdf')) {
      const url = `${environment.apiUrl}/fileuploads/${document.s3_file_name}?download=true`.replace('/graphql', '');
      window.open(url, '_blank');
    } else {
      const titleId = this.schoolService.getSelectedRncpTitleId();

      this.dialog
        .open(DocumentDetailDialogComponent, {
          disableClose: true,
          width: '850px',
          data: {
            ...document,
            titleId: titleId,
            type: 'student',
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.updateDocument.emit(true);
          }
        });
    }
  }

  toggleDocuments() {
    this.expandFolder.documents = !this.expandFolder.documents;
  }

  toggleExpectedDocuments(index: number) {
    this.expandFolder.expectedDocuments[index] = !this.expandFolder.expectedDocuments[index];
  }

  toggleCVDocuments() {
    this.expandFolder.cvDocuments = !this.expandFolder.cvDocuments;
  }

  togglePresentationDocuments() {
    this.expandFolder.presentationDocument = !this.expandFolder.presentationDocument;
  }

  toggleGrandOralPdf() {
    this.expandFolder.grandOralPdf = !this.expandFolder.grandOralPdf;
  }

  toggleGrandOralResult() {
    this.expandFolder.grandOralResult = !this.expandFolder.grandOralResult;
  }

  toggleTests() {
    this.expandFolder.tests = !this.expandFolder.tests;
  }

  toggleTestDetail(testIndex: number) {
    this.expandFolder.testDetail[testIndex] = !this.expandFolder.testDetail[testIndex];
  }

  toggleElementOfProofDocument() {
    this.expandFolder.elementOfProofDocument = !this.expandFolder.elementOfProofDocument;
  }

  toggleManualDocuments() {
    this.expandFolder.manualDocuments = !this.expandFolder.manualDocuments;
  }

  downloadDocumentAdded(documentData) {
    const url = `${environment.apiUrl}/fileuploads/${documentData.s3_file_name}?download=true`.replace('/graphql', '');
    return url;
    // window.open(url, '_blank');
  }

  openTestDetails(test: any, folderData: any, isFolder06: any, testIndex?) {
    // go to test correction if from folder 06
    this.router.navigate(['/test-correction', folderData.parent_rncp_title._id, test._id], {
      queryParams: { school: folderData.school._id },
    });
  }

  getDocNameExpectedDoc(document) {
    let docName = '';
    const docFullName = document.document_name.toLowerCase().trim();

    if (document.parent_test.expected_documents.length > 1) {
      for (const expectDoc of document.parent_test.expected_documents) {
        const expectedDocName = expectDoc.document_name.toLowerCase().trim();
        if (docFullName.includes(expectedDocName)) {
          docName = expectDoc.document_name;
          break;
        }
      }
    }
    return docName ? docName : document.parent_test.expected_documents[0].document_name;
  }

  getElementOfProofDocument(data: AcadKitDocument[]) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);
    let elementOfProofDocs: AcadKitDocument[] = documents.filter(
      (doc) => doc.document_generation_type === 'elementOfProof' && doc.uploaded_for_student,
    );
    if (elementOfProofDocs && elementOfProofDocs.length) {
      // reverse to sort document by latest, then uniq so same student dont appear twice
      elementOfProofDocs = _.uniqBy(elementOfProofDocs.reverse(), 'uploaded_for_student._id');
      // sort student name alphabetically
      elementOfProofDocs.sort((a: AcadKitDocument, b: AcadKitDocument) => {
        if (!a.uploaded_for_student || !b.uploaded_for_student) {
          return 0;
        }
        const nameA = a.uploaded_for_student.last_name.toLowerCase().trim();
        const nameB = b.uploaded_for_student.last_name.toLowerCase().trim();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      this.folder.elementOfProofDocument = elementOfProofDocs;
    }
  }

  getElementOfProofDocumentName(elementOfProofDoc: AcadKitDocument) {
    let elementOfProofName = this.translate.instant('element_of_proof');
    const docName: string = elementOfProofDoc.document_name;
    if (docName) {
      let separator = '';
      if (docName.includes('Eléments de preuve')) {
        separator = 'Eléments de preuve';
      } else if (docName.includes('Elements of proof')) {
        separator = 'Elements of proof';
      }
      const re = new RegExp(`(${separator})`);
      // split to array of string
      const splitted = docName.split(re);
      // combine array of string to be a complete translated string
      elementOfProofName = splitted.reduce((acc, curr) => {
        if (curr === separator) {
          acc = acc + this.translate.instant(curr);
        } else {
          acc = acc + curr;
        }
        return acc;
      }, '');
    }
    return elementOfProofName;
  }

  getManualDocuments(data: AcadKitDocument[]) {
    let documents: AcadKitDocument[] = _.cloneDeep(data);
    // if document has no document_expected_id and parent_test, it mean this document come from manual task
    documents = documents.filter((doc) => !doc.document_expected_id && !doc.parent_test);
    // sort document by name
    this.folder.manualDocuments = documents
      .sort((a, b) => {
        if (!a.document_name || !b.document_name) {
          return 0;
        }
        const nameA = a.document_name.toLowerCase().trim();
        const nameB = b.document_name.toLowerCase().trim();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      })
      .filter((doc) => doc?.document_generation_type !== 'elementOfProof');
  }

  getDocumentResultAutoEval() {
    let tempDoc = [];
    this.folder?.tests?.forEach((test) => {
      if (test?.documents?.length) {
        test.documents.forEach((doc) => {
          tempDoc.push(doc);
        });
      }
    });
    this.documentResultAutoEval = _.uniqBy(tempDoc, '_id');
  }

  // getGrandOralPdf(grandOral){
  //   const user = this.authServ.getCurrentUser()

  //   const userType = user && user.entities.length > 0 && user.entities[0].type && user.entities[0].type._id ? user.entities[0].type._id : null

  //   this.subs.sink = this.rncpTitleService.getGrandOralPDF(grandOral.jury_organization_id._id, grandOral.uploaded_for_student._id, userType).subscribe(res => {
  //     const url = `${environment.apiUrl}/fileuploads/${res}`.replace('/graphql', '');
  //     window.open(url, 'blank');
  //   })
  // }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
