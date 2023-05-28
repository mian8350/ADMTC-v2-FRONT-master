import { Component, OnInit, Output, Input, EventEmitter, OnChanges } from '@angular/core';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { L } from '@angular/cdk/keycodes';

@Component({
  selector: 'ms-diploma',
  templateUrl: './diploma.component.html',
  styleUrls: ['./diploma.component.scss'],
  providers: [ParseStringDatePipe]
})
export class DiplomaComponent implements OnInit, OnChanges {
  @Input() studentId = '';
  @Input() schoolId: string;
  @Output() continue = new EventEmitter<boolean>();

  private subs = new SubSink();
  studentData;

  // ************** This variable used to check if we show view component or edit component. By default, its view
  statusViewEdit = 'view';
  diplomaIndexOnEdit = null;
  acadJourneyId;

  constructor(
    private acadJourneyService: AcademicJourneyService,
    private parseStringDatePipe: ParseStringDatePipe,
  ) { }

  ngOnInit() {


    this.checkAcadJourneyExist();
  }

  ngOnChanges() {
    this.statusViewEdit = 'view';
    this.diplomaIndexOnEdit = null;
    this.acadJourneyId = null;
    this.checkAcadJourneyExist();
  }

  updateViewEdit(event: {type: string, index: number}) {

    // *************** if add, then go to add
    if (event && event.type === 'add') {
      this.statusViewEdit = 'edit';
      this.diplomaIndexOnEdit = null
    } else if (event && event.type === 'edit') {
      this.statusViewEdit = 'edit';
      this.diplomaIndexOnEdit = event.index;
    } else if (event && event.type === 'view') {
      this.statusViewEdit = 'view';
      this.diplomaIndexOnEdit = null;
    }
  }

  checkAcadJourneyExist() {
    this.subs.sink = this.acadJourneyService.checkHasAcadJourney(this.studentId).subscribe(resp => {
      if (resp) {
        this.acadJourneyId = resp._id;
      } else {
        this.populateMyProfileFirstTime();
      }
    })
  }

  populateMyProfileFirstTime() {
    this.subs.sink = this.acadJourneyService.GetStudentDataProfileFirstTime(this.studentId).subscribe((resp) => {

      const temp = _.cloneDeep(resp);
      this.studentData = _.cloneDeep(resp);

      // *************** Start Do Formatting of the data
      if (temp && temp.student_address && temp.student_address.length) {
        temp.address = temp.student_address.find((address) => address.is_main_address);
        delete temp.student_address;
      }
      if (temp && temp.date_of_birth) {
        temp.date_of_birth = this.parseStringDatePipe.transform(temp.date_of_birth);
      }

      if (this.studentData && this.studentData.photo) {
        temp.photo = this.studentData.photo;
      }
      const payload = {
        student_id: this.studentId,
        general_presentation: temp,
      };




      // If first time, will auto save
      this.saveFirstTime(payload);
    });
  }

  saveFirstTime(payload) {
    if (this.acadJourneyId) {
      this.subs.sink = this.acadJourneyService.updateAcademicJourney(this.acadJourneyId, payload).subscribe((resp) => {
        if (resp && resp._id) {
          this.acadJourneyId = resp._id;
          this.ngOnInit();
        }
      });
    } else {
      this.subs.sink = this.acadJourneyService.createAcademicJourney(payload).subscribe((resp) => {
        if (resp && resp._id) {
          this.acadJourneyId = resp._id;
          this.ngOnInit();
        }
      });
    }
  }

}
