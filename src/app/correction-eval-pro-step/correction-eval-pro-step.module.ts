import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { CorrectionEvalProComponent } from './correction-eval-pro-step.component';
import { CorrectionEvalProRoutingModule } from './correction-eval-pro-step-routing.module';
import { FirstCorrectionEvalProComponent } from './first-correction-eval-pro/first-correction-eval-pro.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { NgxCaptchaModule } from 'ngx-captcha';
import { WidgetComponentModule } from 'app/widget-component/widget-component.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { MatStepperModule } from '@angular/material/stepper';

@NgModule({
  declarations: [CorrectionEvalProComponent, FirstCorrectionEvalProComponent],
  imports: [
    CommonModule,
    CorrectionEvalProRoutingModule,
    SharedModule,
    CKEditorModule,
    SlickCarouselModule,
    WidgetComponentModule,
    NgxCaptchaModule,
    MatStepperModule
  ],
})
export class CorrectionEvalProModule {}
