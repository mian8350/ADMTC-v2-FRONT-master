import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { SubSink } from 'subsink';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { debounceTime, map, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';

interface Keys {
  key: string;
  description: string;
}

@Component({
  selector: 'ms-contract-template-step-detail',
  templateUrl: './contract-template-step-detail.component.html',
  styleUrls: ['./contract-template-step-detail.component.scss']
})
export class ContractTemplateStepDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() templateId;
  @Input() stepId;
  @Input() templateType;
  @Input() stepIndex: number;
  @Input() isPublished: boolean;
  @Input() finalValidation: boolean;
  @Input() takenUniqueStep: string[];
  isWaitingForResponse = false;
  isTopWaitingForResponse = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel<any>(true, []);
  contract_template_published = new UntypedFormControl(false);
  contract_template_text: string;
  editor: any;
  dataCount = 0;
  private subs = new SubSink();
  scholarPeriodCount;
  titleData: any;
  public Editor = DecoupledEditor;
  public config = {
    toolbar: [
      'heading',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      'todoList',
      '|',
      'indent',
      'outdent',
      '|',
      'link',
      'blockQuote',
      'imageUpload',
      'insertTable',
      'horizontalLine',
      'pageBreak',
      '|',
      'undo',
      'redo',
    ],
    link: {
      addTargetToExternalLinks: true,
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
    },
  };
  noData: any;
  isReset: Boolean = false;
  dataLoaded: Boolean = false;
  sortValue = null;
  initialData: any;
  displayedColumns: string[] = ['key', 'description', 'action'];
  filterColumns: string[] = ['keyFilter', 'descriptionFilter', 'actionFilter'];
  filteredValues: Keys = {
    key: null,
    description: null,
  };
  keyDropdown = [];
  descDropdown = [];
  keyFilter = new UntypedFormControl('');
  descriptionFilter = new UntypedFormControl('');

  isKeyUP = false;

  pdfId;

  dummyData: Keys[] = [
    {
      key: '${user_civility}',
      description: 'description of civility',
    },
    {
      key: '${user_first_name}',
      description: 'description of user first name',
    },
    {
      key: '${user_last_name}',
      description: 'description of user last name',
    },
  ];

  constructor(private translate: TranslateService, private router: Router, private formBuilderService: FormBuilderService,) {}

  ngOnInit() {
    this.subs.sink = this.translate.onLangChange.pipe().subscribe((result) => {
      if (result) {
        // this.getKeysDropdown();
        this.fetchKeysAndPopulateTable();
      }
    });
    this.initFilter();
    this.fetchKeysAndPopulateTable();
    // this.getKeysDropdown();
  }

  initFilter() {
    this.subs.sink = this.keyFilter.valueChanges.pipe(debounceTime(400)).subscribe((text) => {
      this.filteredValues.key = text;
      this.paginator.pageIndex = 0;
      this.fetchKeysAndPopulateTable();

    });

    this.subs.sink = this.descriptionFilter.valueChanges.pipe(debounceTime(400)).subscribe((text) => {
      this.filteredValues.description = text;
      this.paginator.pageIndex = 0;
      this.fetchKeysAndPopulateTable();

    });
  }

  resetSelection() {
    this.paginator.pageIndex = 0;
    // this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      key: null,
      description: null,
    };

    this.keyFilter.setValue('', { emitEvent: false });
    this.descriptionFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;

    this.fetchKeysAndPopulateTable();
  }

  getKeysDropdown() {
    // this.subs.sink = this.contractService.getContractTemplateKeysDropdown().subscribe((resp) => {
    //   this.keyDropdown = resp;
    //   this.descDropdown = resp;
    // }, (err) => {
    //   Swal.fire({
    //     type: 'error',
    //     title: 'Error',
    //     text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
    //     confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    //   });
    // });
  }

  getContractTemplateData() {
    if (this.templateId) {
      this.subs.sink = this.formBuilderService.getOneFormBuilderStep(this.stepId).subscribe((resp) => {
        if (resp) {
          if (resp.contract_template_pdf) {
            this.editor.setData(resp.contract_template_pdf);
            this.initialData = resp.contract_template_pdf;
          }
        }
      }, (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
    }
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        tap(() => {
          if (!this.isReset) {
            this.fetchKeysAndPopulateTable();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();

    this.initEditor();
  }

  initEditor() {
    this.subs.sink = DecoupledEditor.create(document.querySelector('.doc-editor__editable'), this.config)
      .then((editor) => {
        const toolbarContainer = document.querySelector('.doc-editor__toolbar');
        toolbarContainer.appendChild(editor.ui.view.toolbar.element);
        this.editor = editor;
        this.initialData = this.editor.getData();
        // editor.model.document.on('change:data', (evt, data) => { //can listen to input type event or just get final input with editor.getData() on save

        //   this.contract_template_text = editor.getData();
        // });
        // editor.on( 'paste', async () => { //listen to pasting event from clipboard
        //   return await navigator.clipboard.readText()
        // });
        this.getContractTemplateData();

        document.querySelector('.doc-editor__editable').addEventListener('keyup', () => {
          this.isKeyUP = true;
          this.isFormUnchanged();
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  fetchKeysAndPopulateTable() {
    this.isWaitingForResponse = true;
    const filter = {
      ...this.filteredValues,
      form_builder_step_id: this.stepId
    }
    this.subs.sink = this.formBuilderService.getAllFormBuilderKey(filter, this.translate.currentLang, this.stepId, this.sortValue,)
      .subscribe((resp) => {
        this.isWaitingForResponse = false;
        this.dataSource.data = resp;
        this.dataCount = resp.length;
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.dataSource.paginator = this.paginator;
      }, (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
  }

  resetTable() {
    this.isReset = true;
    this.fetchKeysAndPopulateTable();
  }

  // handle copying click event
  async onCopyToClipBoard(element: { key: string; description: string }) {
    if (navigator.clipboard) {
      return await navigator.clipboard.writeText(element.key);
    }
  }

  publishPreContractForm(event: MatSlideToggleChange) {

    if (event && event.checked) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Are you sure?'),
        text: this.translate.instant('This will publish the pre-contract form'),
        confirmButtonText: this.translate.instant('Yes'),
        cancelButtonText: this.translate.instant('No'),
        showCancelButton: true,
      }).then((result) => {
        return;
      });
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Are you sure?'),
        text: this.translate.instant('This will unpublish the pre-contract form'),
        confirmButtonText: this.translate.instant('Yes'),
        cancelButtonText: this.translate.instant('No'),
        showCancelButton: true,
      }).then((result) => {
        return;
      });
    }
  }

  onSave(forPreview?) {
    // if (this.isPublished && !forPreview) {
    //   Swal.fire({
    //     type: 'error',
    //     title: this.translate.instant('UserForm_S18.TITLE'),
    //     text: this.translate.instant('UserForm_S18.TEXT'),
    //     confirmButtonText: this.translate.instant('UserForm_S18.CONFIRM'),
    //   });
    // } else {
    this.isTopWaitingForResponse = true;
    const payload = {
      _id: this.stepId,
      contract_template_pdf: this.editor.getData(),
    };

    if (this.stepId) {
      this.subs.sink = this.formBuilderService.createUpdateFormBuilderStep(payload).subscribe((resp) => {
        this.isTopWaitingForResponse = false;
        this.initialData = this.editor.getData();
        // If forPreview, meaning its triggered from preview button, we need to save then call the preview.
        if (forPreview) {
          this.onPreview();
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo!'),
            confirmButtonText: this.translate.instant('OK'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((res) => {
            this.ngOnInit();
            this.formBuilderService.childrenFormValidationStatus = true;
            this.getContractTemplateData();
          });
        }
      }, (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
    } 
  }

  onPreview() {
    this.isTopWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.generateFormBuilderContractTemplatePDF(this.stepId, this.translate.currentLang).subscribe((resp) => {
      if (resp) {
        this.isTopWaitingForResponse = false;
        this.downloadDoc(resp);
      }
    }, (err) => {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    });
  }

  sortData(sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    this.fetchKeysAndPopulateTable();
  }

  isFormUnchanged() {
    // if (!this.editor) {
    //   return;
    // }

    // if (!this.initialData) {
    //   return false;
    // }

    const initialData = this.initialData;
    const currentData = this.editor.getData();



    if (initialData === currentData || !this.isKeyUP) {
      this.formBuilderService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.formBuilderService.childrenFormValidationStatus = false;
      return false;
    }
  }

  downloadDoc(filename: string) {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${filename}?download=true`.replace('/graphql', '');
    a.download = filename;
    a.click();
    a.remove();
  }

  leave() {
    this.checkIfAnyChildrenFormInvalid();
  }

  checkIfAnyChildrenFormInvalid() {
    const validForm = this.isFormUnchanged();

    if (!this.formBuilderService.childrenFormValidationStatus) {
      this.fireUnsavedDataWarningSwal();
    } else {
      this.router.navigate(['form-builder']);
    }
  }

  fireUnsavedDataWarningSwal() {
    if (!this.isPublished) {
      return Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          // I will save first
          return;
        } else {
          // discard changes
          this.formBuilderService.childrenFormValidationStatus = true;
          this.router.navigate(['form-builder']);;
        }
      });
    } else {
      // discard changes
      this.formBuilderService.childrenFormValidationStatus = true;
      this.router.navigate(['form-builder']);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
