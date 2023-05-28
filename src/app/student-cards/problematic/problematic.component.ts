import { Component, OnInit, Output, Input, EventEmitter, OnChanges } from '@angular/core';
import { ProblematicService } from 'app/service/problematic/problematic.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-problematic',
  templateUrl: './problematic.component.html',
  styleUrls: ['./problematic.component.scss'],
})
export class ProblematicComponent implements OnInit, OnChanges {
  private subs = new SubSink();

  @Input() studentId = '';
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() problematicId: string;
  @Input() studentPrevCourseData: any;
  @Output() continue = new EventEmitter<boolean>();

  problematicData;
  isImported = false;
  historyData = '';

  constructor(private problematicService: ProblematicService) {}

  ngOnInit() {
    this.getDataProblematic();
  }

  ngOnChanges() {
    this.problematicData = null;
    this.getDataProblematic();
  }

  getDataProblematic() {
    if (this.studentPrevCourseData) {
      this.subs.sink = this.problematicService
        .getStudentsPrevCourseProblematic(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((resp_student) => {
          // student's previous course data
          if (resp_student && resp_student[0]) {
            this.setDataProblematic(resp_student[0]);
          }
        });
    } else {
      this.subs.sink = this.problematicService.getStudentsDataForProblematic(this.studentId).subscribe((resp_student) => {
        this.setDataProblematic(resp_student);
      });
    }
  }

  setDataProblematic(resp_student) {
    if (this.problematicId) {
      this.historyData = 'history';
      this.subs.sink = this.problematicService.getOneProblematic(this.problematicId).subscribe((resp_problematic) => {

        this.problematicData = resp_problematic;
        if (
          this.problematicData &&
          this.problematicData.questionnaire_template_response_id &&
          this.problematicData.questionnaire_template_response_id._id
        ) {
          this.isImported = false;
        } else {
          this.isImported = true;
        }
      });
    } else {
      if (resp_student && resp_student.problematic_id && resp_student.problematic_id._id) {
        this.subs.sink = this.problematicService.getOneProblematic(resp_student.problematic_id._id).subscribe((resp_problematic) => {

          this.problematicData = resp_problematic;
          if (
            this.problematicData &&
            this.problematicData.questionnaire_template_response_id &&
            this.problematicData.questionnaire_template_response_id._id
          ) {
            this.isImported = false;
          } else {
            this.isImported = true;
          }
        });
      }
    }
  }
}
