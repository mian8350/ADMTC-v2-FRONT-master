import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { QuestionnaireGlobalComponent } from './questionnaire-global/questionnaire-global.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { QuestionaireTemplateFormComponent } from './questionaire-template-form/questionaire-template-form.component';
import { QuestionnaireSimulationsComponent } from './questionnaire-simulations/questionnaire-simulations.component';


export const routes: Routes = [
  {
    path: '',
    component: QuestionnaireGlobalComponent,
    pathMatch: 'full',
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.ques_tools.show_perm'
    },
  },
  {
    path: 'form',
    component: QuestionaireTemplateFormComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.ques_tools.add_perm'
    },
  },
  {
    path: 'form/:templateId',
    component: QuestionaireTemplateFormComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.ques_tools.actions.edit_perm'
    },
  },
  {
    path: 'simulation/:templateId',
    component: QuestionnaireSimulationsComponent,
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class QuestionnaireToolsRoutingModule { }
