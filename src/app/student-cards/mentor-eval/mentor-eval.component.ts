import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

@Component({
  selector: 'ms-mentor-eval',
  templateUrl: './mentor-eval.component.html',
  styleUrls: ['./mentor-eval.component.scss']
})
export class MentorEvalComponent implements OnInit {
  @Input() studentId = '';
  @Input() schoolId: string;
  @Output() continue = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

}
