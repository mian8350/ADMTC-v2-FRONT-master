import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

@Component({
  selector: 'ms-retake-during-the-year',
  templateUrl: './retake-during-the-year.component.html',
  styleUrls: ['./retake-during-the-year.component.scss']
})
export class RetakeDuringTheYearComponent implements OnInit {
  @Input() studentId = '';
  @Input() schoolId: string;
  @Output() continue = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

}
