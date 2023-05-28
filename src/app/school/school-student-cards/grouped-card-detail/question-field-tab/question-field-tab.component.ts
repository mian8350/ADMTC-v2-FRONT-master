import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { StudentsService } from 'app/service/students/students.service';
import Swal from 'sweetalert2';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';

@Component({
  selector: 'ms-question-field-tab',
  templateUrl: './question-field-tab.component.html',
  styleUrls: ['./question-field-tab.component.scss']
})
export class QuestionFieldTabComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() studentId;
  private subs = new SubSink();

  dataSource = new MatTableDataSource([]);
  noData;
  questionCount = 0;
  isWaitingForResponse = false;
  sortValue;

  displayedColumns = ['question', 'answer'];
  filterColumns = ['questionFilter', 'answerFilter'];
  filteredValues = {
    question_label: '',
    answer: ''
  }

  questionAnswerList = [];
  questionFilter = new FormControl(null);
  answerFilter = new FormControl(null);

  defaultQuestions;

  constructor(public translate: TranslateService, private studentService: StudentsService, private formBuilderService: FormBuilderService) { }

  ngOnInit(): void {
    this.initFilter();
    this.populateTableData();
    const questionnaireConsts = this.formBuilderService.getQuestionnaireConst();
    this.defaultQuestions = questionnaireConsts.questionnaireFields;
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        tap(() => {
          this.populateTableData();
        }),
      )
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // To reset previous data table and get query data when input student id changed
    this.reset();
  }

  populateTableData() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.getAllFormBuilderFieldTypes(this.studentId, pagination, this.filteredValues, this.sortValue).subscribe(
      (resp) => {
        if(resp){
          this.isWaitingForResponse = false;
          this.questionAnswerList = _.cloneDeep(resp);
          this.dataSource.data = this.questionAnswerList;
          this.questionCount = this.questionAnswerList?.length ? this.questionAnswerList[0].count_document : 0;
        } else {
          this.isWaitingForResponse = false;
          this.dataSource.data = [];
          this.questionCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      }
    )
  }

  initFilter() {
    this.subs.sink = this.questionFilter.valueChanges.pipe(debounceTime(500)).subscribe((question) => {
      this.filteredValues.question_label = question ? question.toLowerCase() : '';
      this.paginator.pageIndex = 0;
      this.populateTableData();
    }); 
  
    this.subs.sink = this.answerFilter.valueChanges.pipe(debounceTime(500)).subscribe((answer) => {
      this.filteredValues.answer = answer ? answer.toLowerCase() : '';
      this.paginator.pageIndex = 0;
      this.populateTableData();
    });
  }

  sortData(sort: Sort) {
    if (sort.active === 'question_label') {
      this.sortValue = sort.direction ? { question_label: sort.direction } : null;
    } else if (sort.active === 'answer') {
      this.sortValue = sort.direction ? { answer: sort.direction } : null;
    }
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

  reset() {
    this.questionFilter.setValue('', {emitEvent: false});
    this.answerFilter.setValue('', {emitEvent: false});
    this.filteredValues = {
      question_label: '',
      answer: '',
    };
    this.paginator.pageIndex = 0;
    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.populateTableData();
  }

  translateLabel(question) {
    if(this.defaultQuestions.includes(question)) {
      return this.translate.instant('FORM_BUILDER_FIELD.' + question)
    } else {
      return question;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
