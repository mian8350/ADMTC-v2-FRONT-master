import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionGuard } from './service/guard/auth.guard';

const appRoutes: Routes = [
  { path: '', redirectTo: 'rncpTitles', pathMatch: 'full' },
  { path: 'rncp-titles', redirectTo: 'rncpTitles', pathMatch: 'full' },
  {
    path: 'session',
    loadChildren: () => import('./session/session.module').then((m) => m.SessionModule),
  },
  {
    path: 'correction-eval-pro-step',
    // loadChildren: () => import('./correction-eval-pro-step/correction-eval-pro-step.module').then((m) => m.CorrectionEvalProModule),
    loadChildren: () => import('app/correction-eval-pro-step/correction-eval-pro-step.module').then(m => m.CorrectionEvalProModule),
  },
  {
    path: 'join-jury',
    // loadChildren: () => import('./correction-eval-pro-step/correction-eval-pro-step.module').then((m) => m.CorrectionEvalProModule),
    loadChildren: () => import('app/auto-join-jury-room/auto-join-jury-room.module').then(m => m.AutoJoinJuryRoomModule),
  },
  {
    path: 'form-fill',
    loadChildren: () => import('./form-filling/form-filling.module').then((m) => m.FormFillingModule),
  },
  // {
  //   path: 'key-table',
  //   loadChildren: () => import('./shared/shared.module').then(m => m.SharedModule),
  // },
  {
    path: '',
    loadChildren: () => import('./main/main.module').then(m => m.MainModule),
    canActivate: [PermissionGuard],
    runGuardsAndResolvers: 'always',
  },
  { path: 'certification', redirectTo: 'jury-organization', pathMatch: 'full' },
  { path: 'parameters', redirectTo: 'title-rncp', pathMatch: 'full' },
  { path: 'history', redirectTo: 'notifications', pathMatch: 'full' },
  { path: 'process', redirectTo: 'questionnaire-tools', pathMatch: 'full' },
  { path: 'messages', redirectTo: 'alert-functionality', pathMatch: 'full' },
  { path: 'tasks', redirectTo: 'task', pathMatch: 'full' },
  { path: '**', redirectTo: 'rncpTitles', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
  providers: [],
})
export class RoutingModule {}
