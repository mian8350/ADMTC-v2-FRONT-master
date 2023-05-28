import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { Observable } from 'rxjs';

@Component({
  selector: 'ms-jury-student-form',
  templateUrl: './jury-student-form.component.html',
  styleUrls: ['./jury-student-form.component.scss']
})
export class JuryStudentFormComponent implements OnInit {
  @Input() testCorrectionForm: UntypedFormGroup;
  noData: any;
  @Input() events: Observable<void>;
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['section', 'jury1', 'jury2', 'jury3', 'mark', 'comment'];
  filterColumns: string[] = [];


  dummyJury2 = true; // for slider, need to change to real formcontrol
  dummyJury3 = true; // for slider, need to change to real formcontrol
  dummyData = [
    {
      section: 'Lorem Ipsum',
      subSection: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      directives: 'Directives',
      directivesText: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      jury1: '10',
      jury2: '5',
      jury3: '30',
      mark: '20',
      markLetter: 'Mark Letter',
      comment: 'Observation',
      commentText: 'Observation',
      studentName: 'Michael Jordan',
      markData: '5',
    },
    {
      section: 'Lorem Ipsum',
      subSection: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      directives: 'Directives',
      directivesText: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      jury1: '60',
      jury2: '44',
      jury3: '10',
      mark: '20',
      markLetter: 'Mark Letter',
      comment: 'Observation',
      commentText: 'Observation',
      studentName: 'Michael Jordan',
      markData: '5',
    },
  ];

  @Input() studentForm: any[];
  isWaitingForResponse = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();


  Editor = DecoupledEditor;
  config = {
    toolbar: [
      'bold',
      'italic',
      'Underline',
    ],
  };

  constructor(private fb: UntypedFormBuilder) { }

  onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  ngOnInit() {
    if (this.dummyData) {
      this.isWaitingForResponse = true;
      this.dataSource.data = this.dummyData;
    }
    this.isWaitingForResponse = false;
  }

  setDummyJury(event: MatSlideToggleChange, juryNumber: number) {
    if (juryNumber === 2) {
      this.dummyJury2 = event.checked;
    } else {
      this.dummyJury3 = event.checked
    }
  }

}
