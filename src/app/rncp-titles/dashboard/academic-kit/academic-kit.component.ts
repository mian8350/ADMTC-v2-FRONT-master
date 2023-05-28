import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDetailDialogComponent } from '../document-detail-dialog/document-detail-dialog.component';
import { AcadKitDocument, AcadKitFolder, AcadKitTest, ExpectedDocument } from '../academic-kit.model';
import { UtilityService } from 'app/service/utility/utility.service';
import { ViewDialogComponent } from '../test-details/view-dialog/view-dialog.component';
import { TestDetailsComponent } from '../test-details/test-details.component';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UsersService } from 'app/service/users/users.service';
import { EditExpectedDocumentDialogComponent } from 'app/shared/components/edit-expected-document-dialog/edit-expected-document-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-academic-kit',
  templateUrl: './academic-kit.component.html',
  styleUrls: ['./academic-kit.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class AcademicKitComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild(AcademicKitComponent, { static: false }) childRef: AcademicKitComponent;
  @Output() selectedRootFolderToModify = new EventEmitter<string>();

  @Input() currentFolder: AcadKitFolder; // just to store data from parent
  folder: AcadKitFolder; // variable that we use to display or manipulate folder data
  @Input() isRootFolderView: boolean;
  @Input() customRootFolderIndex: number;
  @Input() isToggleAllSubFolder: boolean;
  @Input() isFolder06: boolean;
  @Input() isFolder03: boolean;
  @Input() isFolder07: boolean;
  @Input() currentClass: any;
  @Input() qualityFormRoot: any;
  juryProcessName: any;
  @HostListener("document:click") clicked() { this.donwloadAllDocButton = false }

  test: any;
  testCreation: any;
  CurUser: any;
  isWaitingForResponse = false;
  isUserAdmtc = false;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isUserPCSchool = false;
  testProgressData = [];

  showTestVisibility = true;
  isLoadingRegenerate = false;
  isLoadingTestProgress = false;

  schoolId;

  // to determine which type of folder's child is displayed
  expandFolder = {
    subFolder: false,
    documents: false,
    documentTaskBuilder: false,
    tests: false,
    testDetail: [],
    parentExpectedDocuments: false,
    expectedDocuments: [],
    elementOfProofDocument: false,
    addedDocuments: false,
    manualDocuments: false,
    cvDocuments: false,
    presentationDocument: false,
    grandOralPDFdocument: false,
    grandOralResultdocument: false,
  };

  numberOfStudent = 0;
  presentationCvCount: any;
  grandOralPdfCount: any;
  qualityFormDocument;
  donwloadAllDocButton = false;
  taskBuilderFolder;
  nonTaskBuilderFolder;
  isDocumentElementProof: any[] = [];

  constructor(
    private acadKitService: AcademicKitService,
    public dialog: MatDialog,
    private _utilService: UtilityService,
    private route: ActivatedRoute,
    private router: Router,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private permissions: NgxPermissionsService,
    public permissionService: PermissionService,
    private groupCreationService: GroupCreationService,
    private authService: AuthService,
    private usersService: UsersService,
    private translate: TranslateService,
    private academicKitService: AcademicKitService,
  ) {}

  ngOnInit() {
    this.CurUser = this.authService.getLocalStorageUser();
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permissions.getPermission('Academic Admin');
    this.isUserPCSchool = !!this.permissions.getPermission('PC School Director');
    // Check if there is school id in query param, if true will get pending task for this school only
    if (this.route.snapshot.queryParamMap.get('schoolId')) {
      this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    }

    // use clonedeep so changing this folder variable data wont change it's parent data
    this.folder = _.cloneDeep(this.currentFolder);

    if (this.folder && this.folder.tests && this.folder.tests.length) {
      this.folder.tests.forEach((test) => this.expandFolder.testDetail.push(false));
    }
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    if (this.isRootFolderView) {
      this.isFolder06 = this.acadKitService.isRootFolder06(this.folder);
      this.isFolder03 = this.acadKitService.isRootFolder03(this.folder);
      this.isFolder07 = this.acadKitService.isRootFolder07(this.folder);
    } else {
      this.qualityFormRoot = this.folder.folder_name === 'Quality Form';
    }

    // recursively get sub folder when isToggleAllSubFolder true
    if (this.isToggleAllSubFolder) {
      this.toggleAllSubFolder(this.folder._id);
    }

    this.juryProcessName = this.currentClass?.jury_process_name ? this.currentClass?.jury_process_name : '';
    // this.subs.sink = this.academicKitService.isAcadKitRefreshedEdit$.subscribe((refreshData) => {
    //   if (refreshData) {

    //     this.getSubFolders(this.folder._id)
    //     this.academicKitService.refreshAcadKitEdit(false);
    //   }
    // });
  }

  get utilService() {
    return this._utilService;
  }

  modifyAcadKit(folderId: string) {
    this.selectedRootFolderToModify.emit(folderId);
  }

  toggleFolder(folderId: string) {
    this.expandFolder.subFolder = !this.expandFolder.subFolder;

    if (this.expandFolder.subFolder) {
      this.getSubFolders(folderId);
    }
  }

  toggleAllSubFolder(folderId: string) {
    // this will show all of the sub folder recursively when we click on eye button
    this.expandFolder.subFolder = true;
    this.expandFolder.documents = true;
    this.expandFolder.documentTaskBuilder = true;
    this.expandFolder.tests = true;
    this.expandFolder.addedDocuments = true;
    this.expandFolder.manualDocuments = true;
    this.expandFolder.parentExpectedDocuments = true;
    this.expandFolder.elementOfProofDocument = true;
    this.expandFolder.cvDocuments = true;
    this.expandFolder.presentationDocument = true;
    this.getSubFolders(folderId, true);
  }

  toggleOffAllSubFolder(folderId: string) {
    // this will show all of the sub folder recursively when we click on eye button
    this.expandFolder.subFolder = false;
    this.expandFolder.documents = false;
    this.expandFolder.documentTaskBuilder = false;
    this.expandFolder.tests = false;
    this.getSubFolders(folderId);
  }

  getSubFolders(folderId: string, isToggleSubFolder?: boolean) {
    this.isToggleAllSubFolder = isToggleSubFolder;
    this.isWaitingForResponse = true;
    // Get usertype id
    const currentUser = this.authService.getCurrentUser();
    let userTypeId = '';
    if (currentUser && currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type) {
      userTypeId = currentUser.entities[0].type._id;
    }

    // Passing isFolder06 so that passing check_visible true, otherwise will send false
    this.subs.sink = this.acadKitService.getAcademicKitSubfolders(folderId, userTypeId, this.isFolder06).subscribe(
      (resp) => {
        const data = _.cloneDeep(resp);

        // Cleaning deleted documents before formatting them
        if (data?.documents?.length) {
          data.documents = data.documents.filter(document => document?.status !== 'deleted')
        }

        if ((this.isUserAcadir || this.isUserAcadAdmin) && this.isFolder06) {
          this.showTestVisibility = data.is_visible;
        }
        if (data && data.documents && data.documents.length && (this.isUserAcadir || this.isUserAcadAdmin) && this.isFolder07) {
          data.documents = data.documents.filter((document) => document.visible_to_school === true);
        }
        if (data && data.documents && data.documents.length && !this.isFolder06) {
          data.documents = data.documents.filter((document) => document.parent_test === null);
        }
        if (data?.cv_docs?.length) {
          this.folder.cv_docs = data?.cv_docs;
        }
        if (data?.presentation_docs?.length) {
          this.folder.presentation_docs = data?.presentation_docs;
        }

        if (data) {
          // For Folder 07, if its a parent folder was opened, then we need to only display relevant school to the user
          if (this.isRootFolderView && this.isFolder07 && data?.sub_folders_id) {
            console.log('ini data yang di dapat', data);
            if (this.isUserAcadir) {
              const entity = this.CurUser.entities.filter((ent) => ent.type.name === 'Academic Director');
              const dataUnix = _.uniqBy(entity, 'school.short_name');
              data.sub_folders_id = data.sub_folders_id.filter((folder) =>
                folder.school ? folder.school._id === dataUnix[0].school._id : '',
              );
            } else if (this.isUserAcadAdmin) {
              const entity = this.CurUser.entities.filter((ent) => ent.type.name === 'Academic Admin');
              const dataUnix = _.uniqBy(entity, 'school.short_name');
              console.log('ini dataunix', dataUnix);
              data.sub_folders_id = data.sub_folders_id.filter((folder) =>
                folder.school ? folder.school._id === dataUnix[0].school._id : '',
              );
            } else if (this.isUserPCSchool) {
              const entity = this.CurUser.entities.filter((ent) => ent.type.name === 'PC School Director');
              const dataUnix = _.uniqBy(entity, 'school.short_name');
              data.sub_folders_id = data.sub_folders_id.filter((folder) =>
                folder.school ? folder.school._id === dataUnix[0].school._id : '',
              );
            }
          };

          if (data?.sub_folders_id?.length) {
            const grandOralFolderIndex = data.sub_folders_id.findIndex(folder => {
              return folder?.is_grand_oral_folder && folder?.jury_id?.type === 'grand_oral'
            })
            if (grandOralFolderIndex > -1 && this.juryProcessName) {
              const START_WITH_GRAND_ORAL_INSENSITIVE = /^grand oral/i;
              const folderRef = data.sub_folders_id[grandOralFolderIndex];
              folderRef.folder_name = String(folderRef.folder_name)
                .trim()
                .replace(START_WITH_GRAND_ORAL_INSENSITIVE, this.juryProcessName);
            }
            const retakeGrandOralFolders = data.sub_folders_id.filter(folder => {
              return folder?.is_grand_oral_folder && folder?.jury_id?.type === 'retake_grand_oral'
            })
            if (retakeGrandOralFolders?.length && this.juryProcessName) {
              for (const folder of retakeGrandOralFolders) {
                const START_WITH_RETAKE_GRAND_ORAL_INSENSITIVE = /^(rattrapage grand oral|retake grand oral)/i;
                folder.folder_name = String(folder.folder_name)
                  .trim()
                  .replace(START_WITH_RETAKE_GRAND_ORAL_INSENSITIVE, ['rattrapage', this.juryProcessName].join(' '));
              }
            }
          }
          // sort data.sub_folders_id. except for data with folder name "Certification Rules for Preparation Centres" it must be on the top (first)
          data.sub_folders_id.sort((sub_folder_a, sub_folder_b) => {
            if (!sub_folder_a.folder_name || !sub_folder_b.folder_name) {
              return 0;
            }
            const nameA = sub_folder_a.folder_name.toLowerCase().trim();
            const nameB = sub_folder_b.folder_name.toLowerCase().trim();
            
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });

          let nameCertRules = 'Certification Rules for Preparation Centres';
          nameCertRules = nameCertRules.toLowerCase().trim();

          let certRulesIndex = null;
          const certRulesData = data.sub_folders_id.find((sub_folder, index) => {
            if(sub_folder?.folder_name.toLowerCase().trim() === nameCertRules) {
              certRulesIndex = index
            }
            return sub_folder?.folder_name.toLowerCase().trim() === nameCertRules
          });

          if(certRulesData && (certRulesIndex || certRulesIndex === 0)) {
            data.sub_folders_id.splice(certRulesIndex, 1)
            data.sub_folders_id.unshift(certRulesData)
            certRulesIndex = null
          }

          // sort data.tests
          data.tests.sort((test_a, test_b) => {
            if (!test_a.name || !test_b.name) {
              return 0;
            }
            const nameA = test_a.name.toLowerCase().trim();
            const nameB = test_b.name.toLowerCase().trim();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });

          // sort data.documents
          if (data.documents && data.documents[0] && data.documents[0].uploaded_for_other_user) {
            data.documents.sort((document_a, document_b) => {
              if (
                !document_a.uploaded_for_other_user ||
                !document_a.uploaded_for_other_user.last_name ||
                !document_b.uploaded_for_other_user ||
                !document_b.uploaded_for_other_user.last_name
              ) {
                return 0;
              }
              const nameA = document_a.uploaded_for_other_user.last_name.toLowerCase().trim();
              const nameB = document_b.uploaded_for_other_user.last_name.toLowerCase().trim();
              if (nameA < nameB) {
                return -1;
              }
              if (nameA > nameB) {
                return 1;
              }
              return 0;
            });
          } else if (data.documents && data.documents[0] && data.documents[0].uploaded_for_student) {
            data.documents.sort((document_a, document_b) => {
              if (
                !document_a.uploaded_for_student ||
                !document_a.uploaded_for_student.last_name ||
                !document_b.uploaded_for_student ||
                !document_b.uploaded_for_student.last_name
              ) {
                return 0;
              }
              const nameA = document_a.uploaded_for_student.last_name.toLowerCase().trim();
              const nameB = document_b.uploaded_for_student.last_name.toLowerCase().trim();
              if (nameA < nameB) {
                return -1;
              }
              if (nameA > nameB) {
                return 1;
              }
              return 0;
            });
          } else if (data.documents && data.documents[0] && data.documents[0].uploaded_for_group) {
            data.documents.sort((document_a, document_b) => {
              if (
                !document_a.uploaded_for_group ||
                !document_a.uploaded_for_group.name ||
                !document_b.uploaded_for_group ||
                !document_b.uploaded_for_group.name
              ) {
                return 0;
              }
              const nameA = document_a.uploaded_for_group.name.toLowerCase().trim();
              const nameB = document_b.uploaded_for_group.name.toLowerCase().trim();
              if (nameA < nameB) {
                return -1;
              }
              if (nameA > nameB) {
                return 1;
              }
              return 0;
            });
          }

          this.folder.school = data.school;
          this.folder.parent_rncp_title = data.parent_rncp_title;
          this.folder.documents = data.documents;
          this.folder.sub_folders_id = data.sub_folders_id;
          this.folder.tests = data.tests;
          this.folder.class = data.class;          
          this.taskBuilderFolder = this.folder?.documents?.filter(document => document?.type_of_document === 'task_builder');
          this.nonTaskBuilderFolder = this.folder?.documents?.filter(document => document?.type_of_document !== 'task_builder');
          this.isDocumentElementProof = [];
          this.getQualityFormDocuments(_.cloneDeep(data));
          this.getAddedDocuments(data.tests);
          this.getManualDocuments(_.cloneDeep(data.documents));
          this.getExpectedDocuments(_.cloneDeep(data.documents));
          this.getElementOfProofDocument(_.cloneDeep(data.documents));
          this.getResultDocuments(_.cloneDeep(data.documents));

          if (data.grand_oral_pdfs && data.grand_oral_pdfs.length) {
            this.getGrandOralPDF(_.cloneDeep(data.grand_oral_pdfs));
            this.getGrandOralCV();
            this.getGrandOralPresentation();
            this.getShowCVandPresentation(this.folder);
            // this.getGrandOralPdfCount(this.folder);
          }
          if (data.grand_oral_result_pdfs && data.grand_oral_result_pdfs.length) {
            this.getGrandOralResult(_.cloneDeep(data.grand_oral_result_pdfs));
          }
          if (
            (data.grand_oral_pdfs && data.grand_oral_pdfs.length) ||
            data.grand_oral_result_pdfs ||
            (data.grand_oral_result_pdfs && data.grand_oral_result_pdfs.length)
          ) {
            this.getGrandOralPdfCount(this.folder);
          }
          if (this.isFolder06) {
            this.showGroupOfTest();
            this.getTestProgress();
          }
          if (this.isToggleAllSubFolder) {
            // when click eye icon, display all the test inside folder
            this.expandFolder.testDetail = [];
            this.folder.tests.forEach((test) => this.expandFolder.testDetail.push(true));
          }


        }

        this.isWaitingForResponse = false;
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  getQualityFormDocuments(data) {
    this.qualityFormDocument = _.cloneDeep(data);
  }

  getResultDocuments(data: AcadKitDocument[]) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);
    for (const test of this.folder.tests) {
      for (const doc of documents) {
        if (
          doc.parent_test &&
          test._id === doc.parent_test._id &&
          doc.status !== 'deleted' &&
          doc.document_generation_type !== 'documentExpected'
        ) {
          test.documents.push(doc);
        }
      }
    }
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

    if(this.isFolder06) {
      // hide element prof manual document prevent double document in acad kit
      this.isDocumentElementProof = documents.filter((doc) => doc.document_generation_type === 'elementOfProof')      
    }
    // if document has no document_expected_id and parent_test, it mean this document come from manual task
    documents = documents.filter((doc) => !doc.document_expected_id && !doc.parent_test);
    // sort document by name
    this.folder.manualDocuments = documents.sort((a, b) => {
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
    });
  }

  getGrandOralPDF(data: AcadKitDocument[]) {
    let documents: AcadKitDocument[] = _.cloneDeep(data);

    // if document document has grand oral pdfs
    documents = documents.filter((doc) => doc.type_of_document === 'grand_oral_pdf' && doc.status === 'active');
    // sort document by name
    this.folder.grandOralPDFDocuments = documents.sort((a, b) => {
      if (!a.document_name || !b.document_name) {
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

  getGrandOralCV() {
    // filter document by status active
    let documents = this.folder.cv_docs.filter((doc) => doc.status === 'active');
    // sort document by name
    this.folder.cv_docs = documents.sort((a, b) => {
      if (!a.document_name || !b.document_name) {
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

  getGrandOralPresentation() {
    // filter document by status active
    let documents = this.folder.presentation_docs.filter((doc) => doc.status === 'active');
    // sort document by name
    this.folder.presentation_docs = documents.sort((a, b) => {
      if (!a.document_name || !b.document_name) {
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

  getGrandOralResult(data: AcadKitDocument[]) {
    let documents: AcadKitDocument[] = _.cloneDeep(data);

    // if document document has grand oral pdfs
    documents = documents.filter((doc) => doc.type_of_document === 'grand_oral_result_pdf' && doc.status === 'active');
    // sort document by name
    this.folder.grandOralResultDocuments = documents.sort((a, b) => {
      if (!a.document_name || !b.document_name) {
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

  getExpectedDocuments(data: AcadKitDocument[]) {
    const documents: AcadKitDocument[] = _.cloneDeep(data);
    let expectedDocs: ExpectedDocument[] = [];
    // let manualTaskFolderCreated = false;
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
            is_for_all_student: ex.is_for_all_student,
            is_for_all_group: ex.is_for_all_group,
          });
        });
      }
      // update: we move the manual documents to outer folder https://zettabyte-goa.atlassian.net/browse/AV-3846
      // *************** For imported manual document expected
      // if (doc && doc.status !== 'deleted' && doc.document_generation_type === 'documentExpected' && !doc.parent_test && !manualTaskFolderCreated) {
      //   expectedDocs.push({
      //     _id: doc._id,
      //     name: 'Documents',
      //     documents: [],
      //     is_manual_expected: true,
      //   });
      //   manualTaskFolderCreated = true;
      // }
    });
    expectedDocs = _.uniqBy(expectedDocs, (doc: ExpectedDocument) => doc._id);
    // assign each documents to expected document array
    for (const doc of documents) {
      for (const ex of expectedDocs) {
        // *************** For manual task, put into 1 folder, ohterwise will be put for each document name folder
        if (ex.is_manual_expected) {
          if (doc && doc.document_generation_type === 'documentExpected' && !doc.parent_test && ex.name === 'Documents') {
            ex.documents.push(doc);
            break;
          }
        } else {
          if (doc && doc.document_generation_type === 'documentExpected') {
            const foundLocationDocumentById = expectedDocs.find(expectedDoc => expectedDoc._id === doc.document_expected_id._id);
            if (foundLocationDocumentById) {
              foundLocationDocumentById.documents.push(doc);
              break;
            } else {
              const foundLocationDocumentByName = expectedDocs.find(expectedDoc => doc.document_name.includes(expectedDoc.name))
              if (foundLocationDocumentByName) {
                foundLocationDocumentByName.documents.push(doc);
                break;
              }
            }
          }
        }
      }
    }
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
        expectedDoc['is_for_student'] = true;
      } else if (expectedDoc.documents && expectedDoc.documents[0] && expectedDoc.documents[0].uploaded_for_group) {
        expectedDoc['is_for_group'] = true;
      }
    }
    this.folder.expectedDocuments = [...expectedDocs].sort((a, b) => {
      if (!a.name || !b.name) {
        return 0;
      }
      const nameA = a.name.toLowerCase().trim();
      const nameB = b.name.toLowerCase().trim();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });


  }

  getAddedDocuments(tests: any) {
    if (tests && tests.length) {
      tests.forEach((test) => {
        if (test.documents && test.documents.length) {
          const documents: any[] = _.cloneDeep(test.documents);
          let addedDocuments: any[] = [];
          // create array of expected document
          documents.forEach((doc) => {
            if (
              doc &&
              doc.status !== 'deleted' &&
              doc.document_generation_type &&
              this.isDocumentTimePassedCurrentTime(doc, true, 'addedDocument')
            ) {
              addedDocuments.push(doc);
            }
          });
          addedDocuments = _.uniqBy(addedDocuments, (doc: AcadKitDocument) => doc._id);
          this.folder.addedDocuments = [...addedDocuments];


        }
      });
    }
  }

  getTestProgress() {
    if (this.folder && this.folder.tests && this.folder.tests.length) {
      this.isLoadingTestProgress = true
      this.folder.tests.forEach((test, index) => {
        this.subs.sink = this.groupCreationService.getTestProgress(test._id, this.folder.school._id).subscribe((resp) => {
          this.isLoadingTestProgress = false
          if (resp) {
            const data = _.cloneDeep(resp);
            data['is_document_expected_done'] = data.document_expected_done_count && data.document_expected_done_count.length;
            data['is_assign_corrector_done'] = data.assign_corrector_done && data.assign_corrector_done.length;
            data['is_mark_entry_done'] = data.mark_entry_done && data.mark_entry_done.length;
            data['is_validate_done'] = data.validate_done && data.validate_done.length;
            if (this.testProgressData && this.testProgressData[index]) {
              this.testProgressData[index] = data;
            } else {
              this.testProgressData.push(data);
            }
            this.getNumberofStudentandGroup();
          } else {
            this.testProgressData = [];
          }
        });
      });
    }
  }

  toggleDocuments(from?: string) {
    if(from === 'task_builder') {
      this.expandFolder.documentTaskBuilder = !this.expandFolder.documentTaskBuilder;
    }else {
      this.expandFolder.documents = !this.expandFolder.documents;
    }
  }

  toggleExpectedDocuments(index: number) {
    this.expandFolder.expectedDocuments[index] = !this.expandFolder.expectedDocuments[index];
  }

  toggleAddedDocuments() {
    this.expandFolder.addedDocuments = !this.expandFolder.addedDocuments;
  }

  toggleManualDocuments() {
    this.expandFolder.manualDocuments = !this.expandFolder.manualDocuments;
  }

  toggleGrandOralPDFDocuments() {
    this.expandFolder.grandOralPDFdocument = !this.expandFolder.grandOralPDFdocument;
  }

  toggleGrandOralResultDocuments() {
    this.expandFolder.grandOralResultdocument = !this.expandFolder.grandOralResultdocument;
  }

  toggleParentExpectedDocuments() {
    this.expandFolder.parentExpectedDocuments = !this.expandFolder.parentExpectedDocuments;
  }

  toggleCVDocuments() {
    this.expandFolder.cvDocuments = !this.expandFolder.cvDocuments;
  }

  togglePresentationDocuments() {
    this.expandFolder.presentationDocument = !this.expandFolder.presentationDocument;
  }

  toggleElementOfProofDocument() {
    this.expandFolder.elementOfProofDocument = !this.expandFolder.elementOfProofDocument;
  }

  toggleTests() {
    this.expandFolder.tests = !this.expandFolder.tests;
  }

  toggleTestDetail(testIndex: number) {
    this.expandFolder.testDetail[testIndex] = !this.expandFolder.testDetail[testIndex];
  }

  openDownloadDocument(event) {
    event.preventDefault();
    this.donwloadAllDocButton = true;
  }

  downloadAllDocuments(id) {
    this.acadKitService.loadingSubject.next(true);
    this.acadKitService.downloadFolderDocumentsAsZip(id).subscribe(resp => {
      const url = `${environment.apiUrl}/fileuploads/${resp.pathName}?download=true`.replace('/graphql', '');

      const element = document.createElement('a');
      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', resp.pathName);
      this.acadKitService.loadingSubject.next(false);
      element.click();
    },
    (err) => {
      this.acadKitService.loadingSubject.next(false);

      swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    });
  }

  isAssignCorrectorDone(testData: any, testIndex: number): boolean {
    // free_continuous_control dont have task "assign corrector", so we let it pass
    let isDone = false;
    if (testData && testData.type && testData.type === 'free_continuous_control') {
      if (testData.with_assign_corrector) {
        isDone = this.testProgressData[testIndex].is_assign_corrector_done ? true : isDone;
      } else {
        isDone = true;
      }
    } else {
      if (this.testProgressData[testIndex].is_assign_corrector_done) {
        isDone = true;
      }
    }
    return isDone;
  }

  showTestData(isFolder06, testData, testIndex) {
    const autoprotype = ['academic_auto_evaluation', 'academic_pro_evaluation', 'soft_skill_auto_evaluation', 'soft_skill_pro_evaluation', 'preparation_center_eval_soft_skill'];
    let result = false;
    if (isFolder06 && this.testProgressData && this.testProgressData[testIndex]) {
      // seperating condition for show test data
      if (testData && testData.type && autoprotype.includes(testData.type.toLowerCase())) {
        result = true;
      } else {
        // This is condition for non-auto evaluation
        if (
          testData &&
          testData.correction_type !== 'admtc' &&
          (this.isAssignCorrectorDone(testData, testIndex) || this.testProgressData[testIndex].is_mark_entry_done)
        ) {
          result = true;
        } else if (testData && testData.correction_type === 'admtc' && this.testProgressData[testIndex].is_mark_entry_done) {
          result = true;
        }
      }
    }
    return result;
  }

  isAutoEvaluation(testData, isFolder06) {
    let result = false;
    const autoprotype = ['academic_auto_evaluation', 'academic_pro_evaluation', 'soft_skill_auto_evaluation', 'soft_skill_pro_evaluation', 'preparation_center_eval_soft_skill'];
    // Update Condition, for autoPrototype, acad dir will have save access as admtc, they can go to mark entry for auto evaluation
    if (
      isFolder06 &&
      testData &&
      testData.type &&
      autoprotype.includes(testData.type.toLowerCase()) &&
      (this.isUserAcadir || this.isUserAcadAdmin)
    ) {
      result = true;
    }
    return result;
  }

  openDocumentDetails(document: AcadKitDocument) {

    this.subs.sink = this.route.paramMap.subscribe((param) => {
      const titleId = param.get('titleId');

      // if (document && document.type_of_document === 'grand_oral_pdf') {
      //   // Get user type of user
      //   const currentUser = this.authService.getCurrentUser();
      //   if (
      //     currentUser &&
      //     currentUser.entities &&
      //     currentUser.entities[0] &&
      //     currentUser.entities[0].type &&
      //     currentUser.entities[0].type._id &&
      //     document['jury_organization_id'] &&
      //     document['jury_organization_id']['_id']
      //   ) {
      //     const userType = currentUser.entities[0].type._id;

      //     this.subs.sink = this.acadKitService
      //       .getGrandOralPDF(document['jury_organization_id']['_id'], document.uploaded_for_student._id, userType)
      //       .subscribe((resp) => {

      //         const url = `${environment.apiUrl}/fileuploads/${resp}`.replace('/graphql', '');
      //         window.open(url, '_blank');
      //       });
      //   }
      // } else
      if (document && (document.type_of_document === 'grand_oral_result_pdf' || document.type_of_document === 'grand_oral_pdf')) {
        const url = `${environment.apiUrl}/fileuploads/${document.s3_file_name}?download=true`.replace('/graphql', '');
        window.open(url, '_blank');
      } 
      else if(document && document.type_of_document === 'quality_form') {
        this.openQualityDocument(document);
      } else {
        this.dialog
          .open(DocumentDetailDialogComponent, {
            disableClose: true,
            width: '850px',
            data: {
              ...document,
              titleId: titleId,
              classId: this.currentClass._id,
              isFolder07: this.isFolder07,
              schoolId: this.folder?.school?._id,              
            },
          })
          .afterClosed()
          .subscribe((resp) => {
            if (resp) {
              this.getSubFolders(this.folder._id);
            }
          });
      }

      // if (document && document.document_generation_type === 'documentExpected') {
      //   this.dialog
      //   .open(EditExpectedDocumentDialogComponent, {
      //     width: '700px',
      //     disableClose: true,
      //     data: document._id,
      //     panelClass: 'expected-doc-task',
      //   })
      //   .afterClosed()
      //   .subscribe((result) => {
      //     if (result) {
      //       // refresh acadkit and mytasktable
      //       // this.getMyTask();
      //     }
      //   });
      // } else {
      //   this.dialog.open(DocumentDetailDialogComponent, {
      //     disableClose: true,
      //     width: '850px',
      //     data: {
      //       ...document,
      //       titleId: titleId,
      //     },
      //   });
      // }
    });
  }

  openTestDetails(test: any, folderData: any, isFolder06: any, testIndex?) {



    // go to test correction if from folder 06
    if (isFolder06) {
      // this.router.navigate(['/test-correction', folderData.parent_rncp_title._id, test._id], {
      //   queryParams: { school: folderData.school._id },
      // });
      const url = `/test-correction/${folderData.parent_rncp_title._id}/${test._id}?school=${folderData.school._id}`;
      window.open(url, '_blank');
    } else {
      // open test detail if not in folder 06
      this.dialog.open(TestDetailsComponent, {
        width: '600px',
        disableClose: true,
        data: test,
      });
    }
  }

  showGroupOfTest() {
    const loggedInUserType = this.authService.getPermission();
    this.folder.tests.forEach((test) => {
      if (loggedInUserType[0] && test.group_test) {
        this.usersService.getUserTypeId(loggedInUserType[0]).subscribe((userType) => {
          if (userType && userType[0] && userType[0]._id) {
            const filter = {
              is_not_parent_task: true,
              description: 'Create Groups',
              rncp_title: this.folder.parent_rncp_title._id,
              test_id: test._id,
              school_id: this.folder.school._id,
            };
            // when login as ADMTC, dont need to send user_login_type in query GetAllTasks
            const userTypeId = this.utilService.isUserEntityADMTC() ? null : userType[0]._id;
            this.subs.sink = this.acadKitService.getTaskIdForAcadKit(filter, userTypeId).subscribe((tasks) => {

              if (tasks && tasks.length) {
                // if there is "Create Groups" task, display group icon in acadkit to redirect user to group creation page.
                test['task_id'] = tasks[0]._id;
              }
            });
          }
        });
      }
    });
  }

  redirectToGroupCreationPage(test: AcadKitTest) {    
    // ************** titles id for RM2C, IDA, MRW
    const blockedTitle = ['605858ef8eca3a5b4acdb9c6', '61f2c1d73436980f7b1cefbf', '61f2afc83436980f7b1cb417']; 
    const schoolType = this.authService.getCurrentUser()?.entities[0]?.school_type;

    if(blockedTitle.includes(this.folder?.parent_rncp_title?._id) && schoolType === 'preparation_center') {
      swal.fire({
        title: this.translate.instant('BLOCK_GROUPS.TITLE'),
        html: this.translate.instant('BLOCK_GROUPS.TEXT'),
        confirmButtonText: this.translate.instant('BLOCK_GROUPS.BUTTON'),
        type: 'warning',
        allowOutsideClick: false,
      });
    } else {
      if (test?._id && test?.task_id) {  
        // this.router.navigate(['/group-creation', this.folder.parent_rncp_title._id, test._id, test.task_id]);
        const url = `/group-creation/${this.folder.parent_rncp_title._id}/${test._id}/${test.task_id}`;
        window.open(url, '_blank');
      }
    }
  }

  openQualityForm(processId, userId) {
    const domainUrl = this.router.url.split('/')[0];
    const userTypeId = this.authService.getCurrentUser().entities[0].type._id;
    window.open(
      `${domainUrl}/form-fill?formId=${processId}&formType=quality_form&userId=${userId}&userTypeId=${userTypeId}`,
      '_blank',
    );
  }

  openQualityDocument(document) {
    this.dialog
    .open(DocumentDetailDialogComponent, {
      disableClose: true,
      width: '850px',
      data: {
        document_name: document.document_name,
        s3_file_name: document.s3_file_name,
        type_of_document: document.type_of_document
      },
    })
    .afterClosed()
    .subscribe((resp) => {
      if (resp) {
        this.getSubFolders(this.folder._id);
      }
    });
  }


  // redirectToGroupCreation(folderData: any, testIndex: number) {
  //   const loggedInUserType = this.authService.getPermission();
  //   if (loggedInUserType[0]) {
  //     this.usersService.getUserTypeId(loggedInUserType[0]).subscribe(resp => {
  //       if (resp && resp[0] && resp[0]._id) {
  //         this.getTaskAndRedirectToGroup(folderData, testIndex, resp[0]._id);
  //       } else {
  //         this.getTaskAndRedirectToGroup(folderData, testIndex);
  //       }
  //     })
  //   } else {
  //     this.getTaskAndRedirectToGroup(folderData, testIndex);
  //   }
  // }

  // getTaskAndRedirectToGroup(folderData: any, testIndex: number, userLoginType?: string) {
  //   const filter = {
  //     is_not_parent_task: true,
  //     description: 'Create Groups',
  //     rncp_title: folderData.parent_rncp_title._id,
  //     test_id: folderData.tests[testIndex]._id,
  //     school_id: folderData.school._id,
  //   };
  //   this.subs.sink = this.acadKitService.getTaskIdForAcadKit(filter, userLoginType).subscribe((resp) => {
  //     if (resp && resp.length) {
  //       const taskId = resp[0]._id;
  //       this.router.navigate(['/group-creation', folderData.parent_rncp_title._id, folderData.tests[testIndex]._id, taskId]);
  //     } else {
  //       swal.fire({
  //         type: 'error',
  //         title: 'Error',
  //       });
  //     }
  //   });
  // }

  isDocumentTimePassedCurrentTime(document: any, isFolder06: boolean, type?) {
    let validate = false;

    if (document) {
      const test = document.parent_test ? document.parent_test : null;
      const timeToday = moment();

      // ************** Dont display added document inside folder result of 06
      if (isFolder06 && document.document_generation_type === 'uploadedFromTestCreation' && type !== 'addedDocument') {
        return false;
      }

      // ************** ADMTC will always able to see the document regardless the user or the publication time
      if (this.utilService.isUserEntityADMTC()) {
        return true;
      }

      // ************** Always display test result in folder 06
      if (isFolder06 && type === 'testResult') {
        return true;
      }

      // ************** Check if user is the correct WHO in the test creation tab 3, but for folder 03 all PC Staff is bypassed only checking the date time.
      // if (!(this.isFolder03 && this.utilService.isUserLoginPCStaff())) {


      const data = this.utilService.checkIsCurrentUserAssigned(document.published_for_user_types_id);

      if (!data) {
        return false;
      }
      // }

      if (document && document.publication_date) {
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
            if (document.publication_date.relative_time) {
              const localDate = this.parseUTCtoLocal.transformDate(test.date.date_utc, test.date.time_utc);
              const localRelativeTime = this.parseUTCtoLocal.transform(document.publication_date.relative_time);
              timePublication = moment(localDate + localRelativeTime, 'DD/MM/YYYYHH:mm');
            }

            const schools = this.utilService.getUserAllAssignedSchool();
            let school = '';
            if (schools && schools.length) {
              school = schools[0];
            }
            if (test.date_type === 'different') {
              const tempDateSchool = test.schools;
              const foundSchool = tempDateSchool.find(
                (schoolData) => schoolData && schoolData.school_id && schoolData.school_id._id && schoolData.school_id._id === school,
              );
              if (foundSchool && foundSchool.test_date) {
                let schoolTime = foundSchool.test_date.time_utc;
                if (document.publication_date.relative_time) {
                  schoolTime = document.publication_date.relative_time;
                  const localDate = this.parseUTCtoLocal.transformDate(foundSchool.test_date.date_utc, foundSchool.test_date.time_utc);
                  const localRelativeTime = this.parseUTCtoLocal.transform(document.publication_date.relative_time);

                  timePublication = moment(localDate + localRelativeTime, 'DD/MM/YYYYHH:mm');
                } else {
                  timePublication = this.parseUTCtoLocal.transformDateInDateFormat(
                    foundSchool.test_date.date_utc,
                    foundSchool.test_date.time_utc,
                  );
                }
              }

              if (document.publication_date_for_schools && document.publication_date_for_schools.length) {
                const foundSchoolPublish = document.publication_date_for_schools.find(
                  (schoolData) => schoolData && schoolData.school && schoolData.school._id && schoolData.school._id === school,
                );

                if (foundSchoolPublish && foundSchoolPublish.date) {
                  // timePublication = this.parseUTCtoLocal.transformDateInDateFormat(
                  //   foundSchoolPublish.date.date,
                  //   foundSchoolPublish.date.time,
                  // );
                  // if (document.publication_date.relative_time) {
                  const localDate = this.parseUTCtoLocal.transformDate(foundSchoolPublish.date.date, foundSchoolPublish.date.time);
                  const localRelativeTime = this.parseUTCtoLocal.transform(foundSchoolPublish.date.time);
                  timePublication = moment(localDate + localRelativeTime, 'DD/MM/YYYYHH:mm');
                  // if (document.publication_date.before) {
                  //   timePublication = publication.subtract(document.publication_date.day, 'd');
                  // } else {
                  //   timePublication = publication.add(document.publication_date.day, 'd');
                  // }
                  // timePublication = moment(publication, 'ddd MMM D YYYY HH:mm:ss');

                  let allow = false;
                  if (timeToday.isSameOrAfter(timePublication)) {

                    allow = true;
                  } else {
                    allow = false;
                  }
                  return allow;
                  // }
                }
              }
            }

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

            if (document.publication_date.relative_time) {
              const localDate = this.parseUTCtoLocal.transformDate(test.date.date_utc, test.date.time_utc);
              const localRelativeTime = this.parseUTCtoLocal.transform(document.publication_date.relative_time);
              timePublication = moment(localDate + localRelativeTime, 'DD/MM/YYYYHH:mm');
            }

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
      } else if (isFolder06 && document.document_generation_type !== 'uploadedFromTestCreation') {
        validate = true;
      }
    }

    return validate;
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

  isPublishedTestExist(tests, isFolder06) {
    // *************** If its folder 06, mean its test result, not test creation detail
    if (isFolder06) {
      return true;
    }

    // *************** Only admtc can see unpublished test
    if (this.isUserAdmtc) {
      return true;
    } else {
      if (tests && tests.length) {
        const filteredPublishedTest = tests.filter((test) => test && test.is_published);
        if (filteredPublishedTest && filteredPublishedTest.length) {
          return true;
        }
      }
    }

    return false;
  }

  allowedToSeeUnpublishedTest(test, isFolder06) {


    // *************** If its folder 06, mean its test result, not test creation detail
    if (isFolder06) {
      return true;
    }

    // *************** Only admtc can see unpublished test
    if (this.isUserAdmtc) {
      return true;
    } else {
      if (test && test.is_published) {
        return true;
      }
    }

    return false;
  }

  getNumberofStudentandGroup() {
    this.subs.sink = this.acadKitService
      .getNumberofStudentandGroup(this.folder.school._id, this.folder.class._id, this.folder.tests[0]._id)
      .subscribe((resp) => {
        if (resp.number_of_group) {
          this.numberOfStudent = resp.number_of_group;
        } else {
          this.numberOfStudent = resp.number_of_student;
        }
      });
  }

  getShowCVandPresentation(folder) {
    if (folder.is_grand_oral_folder) {
      this.subs.sink = this.acadKitService
        .getPresentationCvCount(folder.jury_id._id, folder.parent_rncp_title._id, folder.school._id)
        .subscribe((res) => {
          this.presentationCvCount = res;
        });
    }
  }

  showVisibility(test) {


    const userTypeCase = this.isUserAcadir || this.isUserAcadAdmin;
    if (userTypeCase && test && test.evaluation_id && test.evaluation_id.result_visibility === 'never_visible') {
      return false;
    } else if (userTypeCase && test && test.evaluation_id && test.evaluation_id.result_visibility === 'after_correction') {
      return true;
    } else if (userTypeCase) {
      /// for after_jury_decision
      return true;
    } else {
      return true;
    }
  }

  getGrandOralPdfCount(folder) {
    if (folder.is_grand_oral_folder) {
      this.subs.sink = this.acadKitService
        .getGrandOralPDFCount(folder.jury_id._id, folder.parent_rncp_title._id, folder.school._id)
        .subscribe((res) => {

          this.grandOralPdfCount = res;
        });
    }
  }

  regenerateGrandOralPDFResult() {
    const juryId = this.folder.jury_id._id;
    const schoolId = this.folder.school._id;
    const classId = this.folder.class._id;
    const titleId = this.folder.parent_rncp_title._id;
    this.isLoadingRegenerate = true;
    this.subs.sink = this.acadKitService.regenerateGrandOralResultPdf(juryId, schoolId, classId, titleId)
      .subscribe((resp) => {
        if (resp) {
          this.isLoadingRegenerate = false;
          swal.fire({
            title: this.translate.instant('GO_S8.TITLE'),
            html: this.translate.instant('GO_S8.TEXT'),
            confirmButtonText: this.translate.instant('GO_S8.BUTTON'),
            footer: `<span style="margin-left: auto">GO_S8</span>`,
            type: 'success',
            allowOutsideClick: false,
          });
        }
      }, (err) => {
        this.isLoadingRegenerate = false;
        if (err['message'] === 'GraphQL error: Sorry, the process of regenerating grand oral result is still in process') {
          swal.fire({
            title: this.translate.instant('GO_S9.TITLE'),
            html: this.translate.instant('GO_S9.TEXT'),
            confirmButtonText: this.translate.instant('GO_S9.BUTTON'),
            footer: `<span style="margin-left: auto">GO_S9</span>`,
            type: 'warning',
            allowOutsideClick: false,
          });
        }
      })
  }

  filterDocumentLength(documents, isFolder06, testType?: string){
    let dataDoc;
    if (documents && isFolder06) {
      dataDoc = documents.filter((data) => this.isDocumentTimePassedCurrentTime(data, isFolder06, testType));
    } else {
      dataDoc = documents;
    }
    return dataDoc.length;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
