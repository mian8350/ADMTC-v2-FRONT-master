import { Component, ElementRef, Inject, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth-service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { environment } from 'environments/environment';
import { AppPermission } from 'app/models/app-permission.model';
import { UtilityService } from 'app/service/utility/utility.service';
import { PromoService } from 'app/service/promo/promo.service';

@Component({
  selector: 'ms-forgot-password',
  templateUrl: './forgot-passwordV2-component.html',
  styleUrls: ['./forgot-passwordV2-component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ForgotPasswordV2Component implements OnInit, OnDestroy {
  private subs = new SubSink();

  slideConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1000,
    dots: false,
    arrows: false,
  };
  sessionSlider: any[] = [];
  showSessionSlider = false;

  // to store email and captcha data
  email: string;
  recaptcha: any;
  siteKey = environment.siteKey;

  // utility variables
  lang = this.translate.currentLang;
  isWaitingForResponse = false;
  appData: AppPermission;

  constructor(
    public authService: AuthService,
    public router: Router,
    private translate: TranslateService,
    private reCaptchaV3Service: ReCaptchaV3Service,
    public utilService: UtilityService,
    private promoService: PromoService,
  ) {
    this.subs.sink = this.translate.onLangChange.subscribe((e: Event) => {
      this.lang = this.translate.currentLang;
    });
  }

  /**
   * send method is used to send a reset password link into your email.
   */
  send(value) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.authService.resetPasswordV2({ lang: this.translate.currentLang, email: value.email }).subscribe(
      (resp) => {
        if (
          resp &&
          resp.errors &&
          resp.errors.length &&
          resp.errors[0] &&
          resp.errors[0].message &&
          resp.errors[0].message === 'Forgot password can only be sent one time in a day'
        ) {
          this.isWaitingForResponse = false;
          this.showErrorForgotOnceDay();
        } else {

          this.isWaitingForResponse = false;
          if (resp && resp.data) {
            Swal.fire({
              type: 'info',
              title: this.translate.instant('USER_S4B.TITLE'),
              html: this.translate.instant('USER_S4B.TEXT'),
              allowOutsideClick: false,
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('USER_S4B.BUTTON'),
            }).then((isConfirm) => {
              this.router.navigate(['/session/login']);
            });
          } else {
            this.isWaitingForResponse = false;
            if (resp.errors[0].message === 'Email that you enter is not associated with any user in the ADMTC.Pro.') {
              this.showErrorUSER_S17();
            } else {
              this.showErrorEmailInvalid();
            }
          }
        }
      },
      // (error) => {
      //   this.isWaitingForResponse = false;
      //   this.showErrorEmailInvalid();
      // },
    );
  }

  showErrorUSER_S17() {
    Swal.fire({
      allowOutsideClick: false,
      type: 'error',
      title: this.translate.instant('USER_S17.TITLE'),
      text: this.translate.instant('USER_S17.TEXT'),
      footer: `<span style="margin-left: auto">USER_S17</span>`,
      showConfirmButton: true,
      allowEnterKey: false,
      allowEscapeKey: false,
      confirmButtonText: this.translate.instant('USER_S17.OK'),
    });
  }

  showErrorEmailInvalid() {
    Swal.fire({
      allowOutsideClick: false,
      type: 'error',
      title: this.translate.instant('FORGOT_PASSWORD.TITLE'),
      text: this.translate.instant('FORGOT_PASSWORD.MESSAGE'),
      footer: `<span style="margin-left: auto">FORGOT_PASSWORD</span>`,
      showConfirmButton: true,
      allowEnterKey: false,
      allowEscapeKey: false,
      confirmButtonText: this.translate.instant('FORGOT_PASSWORD.BUTTON'),
    });
  }

  showErrorForgotOnceDay() {
    Swal.fire({
      allowOutsideClick: false,
      type: 'error',
      title: this.translate.instant('FORGOT_PASSWORD_ONCE_A_DAY.TITLE'),
      text: this.translate.instant('FORGOT_PASSWORD_ONCE_A_DAY.MESSAGE'),
      footer: `<span style="margin-left: auto">FORGOT_PASSWORD_ONCE_A_DAY</span>`,
      showConfirmButton: true,
      allowEnterKey: false,
      allowEscapeKey: false,
      confirmButtonText: this.translate.instant('FORGOT_PASSWORD_ONCE_A_DAY.BUTTON'),
    });
  }

  ngOnInit(): void {
    this.getAppData();
    this.getPromotionData();
  }

  getAppData() {
    this.utilService.getAppPermission().subscribe((resp) => {
      this.appData = resp;
    });
  }

  handleSuccess(event: string) {

    this.subs.sink = this.authService.verifRecaptcha(event).subscribe((res) => {

    });
  }

  getPromotionData() {
    this.subs.sink = this.promoService.getAllPromo().subscribe((promos) => {

      if (promos) {
        const loginPromos = promos.filter((promo) => promo.for_forgot_password_page);
        if (loginPromos && loginPromos.length > 0) {
          this.sessionSlider.push(...loginPromos);
          this.showSessionSlider = true;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
