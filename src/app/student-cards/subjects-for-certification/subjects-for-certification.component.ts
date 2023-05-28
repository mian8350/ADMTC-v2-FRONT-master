import { Component, OnInit, Output, Input, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';

@Component({
  selector: 'ms-subjects-for-certification',
  templateUrl: './subjects-for-certification.component.html',
  styleUrls: ['./subjects-for-certification.component.scss'],
})
export class SubjectsForCertificationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() studentId = '';
  @Input() studentPrevCourseData?: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Output() continue = new EventEmitter<boolean>();
  isWaitingForResponse = false;
  private subs = new SubSink();
  rootFolders = [];
  customRootFolderIndex: number;
  allDocs;

  constructor(private rncpTitleService: RNCPTitlesService, private schoolService: SchoolService) {}

  ngOnInit() {}
  ngOnChanges() {
    this.getSubjectRootFolder();
  }

  getSubjectRootFolder() {
    this.isWaitingForResponse = true;
    // get all root Folders data from academic Kit of this title
    const studentUserTypeId = '5a067bba1c0217218c75f8ab';
    const is_from_student_card = true;
    this.subs.sink = this.rncpTitleService.GetAllDocs(this.titleId, this.studentId, studentUserTypeId, this.classId, is_from_student_card).subscribe((resp) => {
      if (resp) {
        resp = _.cloneDeep(resp.filter((doc) => doc.parent_folder !== null && doc.status !== 'deleted'));
        const data = _.cloneDeep(resp);
        this.allDocs = _.cloneDeep(resp);
        const tempResultDocs = this.formatDocs(this.allDocs);


        // We need to split GO Document with Non GO Document because the grouping is different
        // GO need group from parent_folder._id while Non GO from parent_folder.parent_folder._id
        const grandOralDocsType = [
          'student_upload_grand_oral_cv',
          'student_upload_grand_oral_presentation',
          'grand_oral_pdf',
          'grand_oral_result_pdf',
        ];
        const tempResulBeforeSplit = _.cloneDeep(tempResultDocs);
        const docsNonGO = tempResulBeforeSplit.filter(doc => !grandOralDocsType.includes(doc?.document_generation_type));
        const docsGO = tempResulBeforeSplit.filter(doc => grandOralDocsType.includes(doc?.document_generation_type));

        // map all document to their folder
        const foldersNonGO = _.chain(docsNonGO)
          .groupBy('parent_folder.parent_folder_id._id')
          .map((value, key) => {

            const grandOralDocsType = [
              'student_upload_grand_oral_cv',
              'student_upload_grand_oral_presentation',
              'grand_oral_pdf',
              'grand_oral_result_pdf',
            ];
            const isGrandOral = grandOralDocsType.includes(value[0].document_generation_type);
            return {
              _id: key,
              folder: value,
              name: isGrandOral ? value[0].parent_folder.folder_name : value[0].parent_folder.parent_folder_id.folder_name,
              is_default_folder: value[0].parent_folder.parent_folder_id.is_default_folder,
            };
          })
          .value();

        const foldersGO = _.chain(docsGO)
          .groupBy('parent_folder._id')
          .map((value, key) => {

            const grandOralDocsType = [
              'student_upload_grand_oral_cv',
              'student_upload_grand_oral_presentation',
              'grand_oral_pdf',
              'grand_oral_result_pdf',
            ];
            const isGrandOral = grandOralDocsType.includes(value[0].document_generation_type);
            return {
              _id: key,
              folder: value,
              name: isGrandOral ? value[0].parent_folder.folder_name : value[0].parent_folder.parent_folder_id.folder_name,
              is_default_folder: value[0].parent_folder.parent_folder_id.is_default_folder,
            };
          })
          .value();
        
        const folders = [...foldersNonGO, ...foldersGO];

        // merge 2 subfolder that has same name so it will not duplicated
        folders.forEach((docFolder) => {
          const mergedSubFolder = [];
          docFolder.folder.forEach((subFolder) => {
            // Replace documents to show if its cv or presentation

            if (subFolder.document_generation_type === 'student_upload_grand_oral_presentation') {

              subFolder.parent_folder.documents = subFolder.parent_folder.presentation_docs;
              if (subFolder.parent_folder.documents && subFolder.parent_folder.documents.length) {
                subFolder.parent_folder.documents = subFolder.parent_folder.documents.filter((doc) => doc._id === subFolder._id);
              }
            } else if (subFolder.document_generation_type === 'student_upload_grand_oral_cv') {

              subFolder.parent_folder.documents = subFolder.parent_folder.cv_docs;
              if (subFolder.parent_folder.documents && subFolder.parent_folder.documents.length) {
                subFolder.parent_folder.documents = subFolder.parent_folder.documents.filter((doc) => doc._id === subFolder._id);
              }
            } else if (subFolder.document_generation_type === 'grand_oral_pdf') {

              subFolder.parent_folder.documents = subFolder.parent_folder.grand_oral_pdfs;
              if (subFolder.parent_folder.documents && subFolder.parent_folder.documents.length) {
                subFolder.parent_folder.documents = subFolder.parent_folder.documents.filter((doc) => doc && doc._id === subFolder._id);
              }
            } else if (subFolder.document_generation_type === 'grand_oral_result_pdf') {

              subFolder.parent_folder.documents = subFolder.parent_folder.grand_oral_result_pdfs;
              if (subFolder.parent_folder.documents && subFolder.parent_folder.documents.length) {
                subFolder.parent_folder.documents = subFolder.parent_folder.documents.filter((doc) => doc && doc._id === subFolder._id);
              }
            }

            // For type B document in group test(Test Result for individual in group). Take from type_b_documents
            if (
              subFolder &&
              subFolder.parent_folder &&
              subFolder.parent_folder.type_b_documents &&
              subFolder.parent_folder.type_b_documents.length
            ) {
              subFolder.parent_folder.documents.push(...subFolder.parent_folder.type_b_documents);
            }

            const subFolderExist = mergedSubFolder.find((subf) => subf.parent_folder.folder_name === subFolder.parent_folder.folder_name);
            if (subFolderExist) {
              subFolderExist.parent_folder.documents.push(...subFolder.parent_folder.documents);
            } else {
              mergedSubFolder.push(subFolder);
            }
          });
          docFolder.folder = mergedSubFolder;
        });

        const tempResultFolder = this.formatFolder(folders);
        this.rootFolders = tempResultFolder;

      }
      this.isWaitingForResponse = false;
    });
  }

  getCustomRootFolderIndex(folderIndex: number) {
    // to get index of newly created custom folder other than default folder "01. ADMISSIONS" to "07. ARCHIVES"
    if (folderIndex + 1 > 7) {
      this.customRootFolderIndex = folderIndex + 1;
      return this.customRootFolderIndex;
    }
    return null;
  }

  formatDocs(allDocs) {
    const tempFormattedDocs = allDocs;

    if (tempFormattedDocs && tempFormattedDocs.length) {
      tempFormattedDocs.forEach((docs) => {
        if (docs && docs.parent_folder && docs.parent_folder.documents && docs.parent_folder.documents.length) {
          docs.parent_folder.documents = _.filter(docs.parent_folder.documents, (doc_folder) => doc_folder && doc_folder._id === docs._id);
        }
        if (docs && docs.parent_folder && docs.parent_folder.type_b_documents && docs.parent_folder.type_b_documents.length) {
          docs.parent_folder.type_b_documents = _.filter(
            docs.parent_folder.type_b_documents,
            (doc_folder) => doc_folder && doc_folder._id === docs._id,
          );
        }
      });
    }


    return tempFormattedDocs;
  }

  formatFolder(allFolder) {
    const tempFormattedFolders = allFolder;

    if (tempFormattedFolders && tempFormattedFolders.length) {
      tempFormattedFolders.forEach((folder) => {
        // *************** filter out test that only have documents
        // if (folder && folder.tests && folder.tests.length) {
        //   folder.tests = _.filter(folder.tests, (test) => test && test.documents && test.documents.length);
        // }
      });
    }


    return tempFormattedFolders;
  }

  updateDocument(event) {

    if (event) {
      // this.getSubjectRootFolder();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
