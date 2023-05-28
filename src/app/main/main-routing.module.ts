import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';

const menuRoutes: Routes = [
  { path: 'guide', loadChildren: () => import('../guide/guide.module').then((m) => m.GuideModule) },
  { path: 'users', loadChildren: () => import('../users/users.module').then((m) => m.UsersModule) },
  { path: 'students', loadChildren: () => import('../students/students.module').then((m) => m.StudentsModule) },
  { path: 'rncpTitles', loadChildren: () => import('../rncp-titles/rncp-titles.module').then((m) => m.RncpTitlesModule) },
  { path: 'workProgress', loadChildren: () => import('../work-progress/work-progress.module').then((m) => m.WorkProgressModule) },
  {
    path: 'crossCorrection',
    loadChildren: () => import('../cross-correction/cross-correction.module').then((m) => m.CrossCorrectionModule),
  },
  {
    path: 'questionnaire-tools',
    loadChildren: () => import('../questionnaire-tools/questionnaire-tools.module').then((m) => m.QuestionnaireToolsModule),
  },
  {
    path: 'jury-organization',
    loadChildren: () => import('../jury-organization/jury-organization.module').then((m) => m.JuryOrganizationModule),
  },
  {
    path: 'global-jury-organization',
    loadChildren: () => import('../jury-organization/jury-organization.module').then((m) => m.JuryOrganizationModule),
  },
  { path: 'notifications', loadChildren: () => import('../history/history.module').then((m) => m.HistoryModule) },
  { path: 'tutorial', loadChildren: () => import('../tutorial/tutorial.module').then((m) => m.TutorialModule) },
  { path: 'platform', loadChildren: () => import('../platform/platform.module').then((m) => m.PlatformModule) },
  { path: 'school', loadChildren: () => import('../school/school.module').then((m) => m.SchoolModule) },
  { path: 'certidegree', loadChildren: () => import('../certi-degree/certi-degree.module').then((m) => m.CertiDegreeModule) },
  { path: 'studentDetail', loadChildren: () => import('../student-detail/student-detail.module').then((m) => m.StudentDetailModule) },
  { path: 'task', loadChildren: () => import('../task/task.module').then((m) => m.TaskModule) },
  { path: 'student-task', loadChildren: () => import('../task/task.module').then((m) => m.TaskModule) },
  { path: 'user-task', loadChildren: () => import('../task/task.module').then((m) => m.TaskModule) },
  { path: 'mailbox', loadChildren: () => import('../mailbox/mailbox.module').then((m) => m.MailboxModule) },
  { path: 'doctest', loadChildren: () => import('../doctest/doctest.module').then((m) => m.DoctestModule) },
  { path: 'tutorial-app', loadChildren: () => import('../tutorial-app/tutorial-app.module').then((m) => m.TutorialAppModule) },
  {
    path: 'transcript-builder',
    loadChildren: () => import('../transcript-builder/transcript-builder.module').then((m) => m.TranscriptBuilderModule),
  },
  { path: 'quality-control', loadChildren: () => import('../quality-control/quality-control.module').then((m) => m.QualityControlModule) },
  { path: 'ideas', loadChildren: () => import('../ideas/ideas.module').then((m) => m.IdeasModule) },
  { path: 'about', loadChildren: () => import('../version/version.module').then((m) => m.VersionModule) },
  { path: 'title-rncp', loadChildren: () => import('../title-rncp/title-rncp.module').then((m) => m.TitleRNCPModule) },
  {
    path: 'alert-functionality',
    loadChildren: () => import('../alert-functionality/alert-functionality.module').then((m) => m.AlertFunctionalityModule),
  },
  {
    path: 'create-test',
    loadChildren: () => import('../test/test.module').then((m) => m.TestModule),
  },
  {
    path: 'companies',
    loadChildren: () => import('../companies/companies.module').then((m) => m.CompaniesModule),
  },
  {
    path: 'test-correction',
    loadChildren: () => import('../test-correction/test-correction.module').then((m) => m.TestCorrectionModule),
  },
  {
    path: 'group-creation',
    loadChildren: () => import('../group-creation/group-creation.module').then((m) => m.GroupCreationModule),
  },
  { path: 'school-group', loadChildren: () => import('../school-group/school-group.module').then((m) => m.SchoolGroupModule) },
  {
    path: 'group-of-schools',
    loadChildren: () => import('../group-of-schools/group-of-schools.module').then((m) => m.GroupOfSchoolsModule),
  },
  { path: 'school-detail', loadChildren: () => import('../school/school.module').then((m) => m.SchoolModule) },
  {
    path: 'completed-students',
    loadChildren: () => import('../students-completed/students-completed.module').then((m) => m.StudentsCompletedModule),
  },
  {
    path: 'student-problematic',
    loadChildren: () => import('../students/students-problematic/students-problematic.module').then((m) => m.StudentsProblematicModule),
  },
  {
    path: 'deactivated-students',
    loadChildren: () => import('../students-deactivated/students-deactivated.module').then((m) => m.StudentsDeactivatedModule),
  },
  {
    path: 'suspended-students',
    loadChildren: () => import('../students-suspended/students-suspended.module').then((m) => m.StudentsSuspendedModule),
  },
  {
    path: 'process-management',
    loadChildren: () => import('../process-management/process-management.module').then((m) => m.ProcessManagementModule),
  },
  { path: 'students-card', loadChildren: () => import('../students-company/students-company.module').then((m) => m.StudentsCompanyModule) },
  {
    path: 'students-card-problematic',
    loadChildren: () =>
      import('../corrector-problematic-student/corrector-problematic-student.module').then((m) => m.CorrectorProblematicStudentModule),
  },
  { path: 'academic', loadChildren: () => import('../academic/academic.module').then((m) => m.AcademicModule) },
  { path: 'promo', loadChildren: () => import('../auto-promo/auto-promo.module').then((m) => m.AutoPromoModule) },
  {
    path: 'transcript-process',
    loadChildren: () => import('../transcript-process/transcript-process.module').then((m) => m.TranscriptProcessModule),
  },
  { path: 'grand-oral', loadChildren: () => import('../grand-oral/grand-oral.module').then((m) => m.GrandOralModule) },
  {
    path: 'employability-survey',
    loadChildren: () => import('../employability-survey/employability-survey.module').then((m) => m.EmployabilitySurveyModule),
  },
  { path: 'test-status', loadChildren: () => import('../test-status/test-status.module').then((m) => m.TestStatusModule) },
  {
    path: 'form-builder',
    loadChildren: () => import('../form-builder/form-builder.module').then((m) => m.FormBuilderModule),
  },
  {
    path: 'form-follow-up',
    loadChildren: () => import('../form-follow-up/form-follow-up.module').then((m) => m.FormFollowUpModule),
  },
  {
    path: 'title-manager',
    loadChildren: () => import('../title-manager/title-manager.module').then((m) => m.TitleManagerModule),
  },
  { path: 'user-permission', loadChildren: () => import('../user-permission/user-permission.module').then((m) => m.UserPermissionModule) },
];

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [...menuRoutes],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
