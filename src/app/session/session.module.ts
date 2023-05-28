import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { WidgetComponentModule } from '../widget-component/widget-component.module';
import { ForgotPasswordV2Component } from './forgot-passwordV2/forgot-passwordV2.component';
import { LockScreenV2Component } from './lockscreenV2/lockscreenV2.component';
import { LoginV2Component } from './loginV2/loginV2.component';
import { RegisterV2Component } from './registerV2/registerV2.component';
import { SessionRoutingModule } from './session.routing';
import { SetPasswordV2Component } from './set-passwordV2/set-passwordV2.component';
import { NgxCaptchaModule } from 'ngx-captcha';

@NgModule({
  declarations: [LoginV2Component, RegisterV2Component, LockScreenV2Component, ForgotPasswordV2Component, SetPasswordV2Component],
  imports: [CommonModule, SessionRoutingModule, SharedModule, WidgetComponentModule, NgxCaptchaModule],
})
export class SessionModule {}
