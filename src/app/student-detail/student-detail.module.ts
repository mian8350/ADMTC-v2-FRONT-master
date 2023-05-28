import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentDetailComponent } from './student-detail/student-detail.component';
import { StudentCourseComponent } from './student-detail/student-course/student-course.component';
import { StudentIdentityComponent } from './student-detail/student-identity/student-identity.component';
import { StudentParentComponent } from './student-detail/student-parent/student-parent.component';
import { StudentCompanyComponent } from './student-detail/student-company/student-company.component';
import { StudentJobDescriptionComponent } from './student-detail/student-job-description/student-job-description.component';
import { StudentSubjectCertificationComponent } from './student-detail/student-subject-certification/student-subject-certification.component';
import { StudentDocumentsComponent } from './student-detail/student-documents/student-documents.component';
import { StudentRetakeComponent } from './student-detail/student-retake/student-retake.component';
import { StudentEmpSurveyComponent } from './student-detail/student-emp-survey/student-emp-survey.component';
import { StudentMentorEvalComponent } from './student-detail/student-mentor-eval/student-mentor-eval.component';
import { StudentProblematicComponent } from './student-detail/student-problematic/student-problematic.component';
import { StudentDiplomaComponent } from './student-detail/student-diploma/student-diploma.component';
import { StudentFinalTranscriptComponent } from './student-detail/student-final-transcript/student-final-transcript.component';
import { StudentCertificationDetailComponent } from './student-detail/student-certification-detail/student-certification-detail.component';
import { SharedModule } from 'app/shared/shared.module';
import { StudentDetailRoutingModule } from './student-detail-routing.module';



@NgModule({
  declarations: [
    StudentDetailComponent,
    StudentCourseComponent,
    StudentIdentityComponent,
    StudentParentComponent,
    StudentCompanyComponent,
    StudentJobDescriptionComponent,
    StudentSubjectCertificationComponent,
    StudentDocumentsComponent,
    StudentRetakeComponent,
    StudentEmpSurveyComponent,
    StudentMentorEvalComponent,
    StudentProblematicComponent,
    StudentDiplomaComponent,
    StudentFinalTranscriptComponent,
    StudentCertificationDetailComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    StudentDetailRoutingModule
  ]
})
export class StudentDetailModule { }
