import { registerLocaleData } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Ng5BreadcrumbModule } from 'ng5-breadcrumb';
import { NgxPermissionsModule, NgxPermissionsRestrictStubModule } from 'ngx-permissions';
import { RoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './core/guards/auth.guard';
import { CustomDatePickerAdapter, CUSTOM_DATE_FORMATS } from './date-adapters';
import { SwalErrorHandler } from './error-handler';
import { GraphQLModule } from './graphql.module';
import { AuthService } from './service/auth-service/auth.service';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router'


registerLocaleData(localeFr);
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RoutingModule,
    MatDialogModule,
    Ng5BreadcrumbModule.forRoot(),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    NgxPermissionsModule.forRoot(),
    GraphQLModule,
    NgxPermissionsRestrictStubModule,
    LoadingBarRouterModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [
    AuthService,
    AuthGuard,
    {
      provide: ErrorHandler,
      useClass: SwalErrorHandler,
    },
    { provide: DateAdapter, useClass: CustomDatePickerAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GeneAppModule {
  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon('file-upload', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-upload.svg'));
    iconRegistry.addSvgIcon('file-download', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-download.svg'));
    iconRegistry.addSvgIcon('incognito', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/incognito.svg'));
    iconRegistry.addSvgIcon('alarm-light', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/alarm-light.svg'));
    iconRegistry.addSvgIcon('file-excel', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-excel.svg'));
    iconRegistry.addSvgIcon('file-pdf', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-pdf.svg'));
    iconRegistry.addSvgIcon('account-plus', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-plus.svg'));
    iconRegistry.addSvgIcon('email-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/email-outline.svg'));
    iconRegistry.addSvgIcon('loop', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/loop.svg'));
    iconRegistry.addSvgIcon('close', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/close.svg'));
    iconRegistry.addSvgIcon('pencil', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/pencil.svg'));
    iconRegistry.addSvgIcon('bank-plus', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bank-plus.svg'));
    iconRegistry.addSvgIcon('eye', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/eye.svg'));
    iconRegistry.addSvgIcon('gavel', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/gavel.svg'));
    iconRegistry.addSvgIcon('certificate', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/certificate.svg')); // has error when open file in browser
    iconRegistry.addSvgIcon('content-copy', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/content-copy.svg'));
    iconRegistry.addSvgIcon('chevron-right', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/chevron-right.svg'));
    iconRegistry.addSvgIcon('undo-variant', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/undo-variant.svg'));
    iconRegistry.addSvgIcon('file-pdf-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-pdf-outline.svg'));
    iconRegistry.addSvgIcon('thumb-up-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/thumb-up-outline.svg'));
    iconRegistry.addSvgIcon('tick-checkbox', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/tick-checkbox.svg')); // has error when open file in browser
    iconRegistry.addSvgIcon('privacy-policy', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/privacy-policy.svg')); // has error when open file in browser
    iconRegistry.addSvgIcon('email', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/email.svg'));
    iconRegistry.addSvgIcon('receipt', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/receipt.svg'));
    iconRegistry.addSvgIcon('key', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/key.svg')); // has error when open file in browser
    iconRegistry.addSvgIcon(
      'indeterminate_check_box',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/indeterminate_check_box.svg'),
    );
    iconRegistry.addSvgIcon('account-supervisor', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-supervisor.svg')); // has error when open file in browser
    iconRegistry.addSvgIcon('attachment', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/attachment.svg'));
    iconRegistry.addSvgIcon('magnify', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/magnify.svg'));
    iconRegistry.addSvgIcon('backup-restore', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/backup-restore.svg'));
    iconRegistry.addSvgIcon('close-circle-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/close-circle-outline.svg'));
    iconRegistry.addSvgIcon('circle-edit-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/circle-edit-outline.svg'));
    iconRegistry.addSvgIcon('label_draft', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/archive-draft.svg'));
    iconRegistry.addSvgIcon('folder-open-regular', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/folder-open-regular.svg'));
    iconRegistry.addSvgIcon('library', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/library.svg'));
    iconRegistry.addSvgIcon('file-excel-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-excel-outline.svg'));
    iconRegistry.addSvgIcon(
      'checkbox-marked-outline',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/checkbox-marked-outline.svg'),
    );
    iconRegistry.addSvgIcon('check-revise', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/check-revise.svg'));
    iconRegistry.addSvgIcon('bullhorn', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bullhorn.svg'));
    iconRegistry.addSvgIcon('text-box-plus', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/text-box-plus.svg'));
    iconRegistry.addSvgIcon('account-question', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-question.svg'));
    iconRegistry.addSvgIcon('microphone', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/microphone.svg'));
    iconRegistry.addSvgIcon('microphone-plus', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/microphone-plus.svg'));
    iconRegistry.addSvgIcon('trash-can', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/trash-can.svg'));
    iconRegistry.addSvgIcon('plus', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/plus.svg'));
    iconRegistry.addSvgIcon('selection', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/selection.svg'));
    iconRegistry.addSvgIcon('reply', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/reply.svg'));
    iconRegistry.addSvgIcon('content-save', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/content-save.svg'));
    iconRegistry.addSvgIcon('account-group', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-group.svg'));
    iconRegistry.addSvgIcon('file-check', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-check.svg'));
    iconRegistry.addSvgIcon('chair-school', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/chair-school.svg'));
    iconRegistry.addSvgIcon('school', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/school.svg'));
    iconRegistry.addSvgIcon('bank', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bank.svg'));
    iconRegistry.addSvgIcon('certsvg', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/certsvg.svg'));
    iconRegistry.addSvgIcon('feather', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/feather.svg'));
    iconRegistry.addSvgIcon('bike', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bike.svg'));
    iconRegistry.addSvgIcon('briefcase', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/briefcase.svg'));
    iconRegistry.addSvgIcon('translate', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/translate.svg'));
    iconRegistry.addSvgIcon('bank-transfer', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bank-transfer.svg'));
    iconRegistry.addSvgIcon('transfer-right', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/transfer-right.svg'));
    iconRegistry.addSvgIcon('account-search', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-search.svg'));
    iconRegistry.addSvgIcon('account-tie', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-tie.svg'));
    iconRegistry.addSvgIcon('information-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/information-outline.svg'));
    iconRegistry.addSvgIcon('clipboard-check', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/clipboard-check.svg'));
    iconRegistry.addSvgIcon(
      'clipboard-check-outline',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/clipboard-check-outline.svg'),
    );
    iconRegistry.addSvgIcon('signature-freehand', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/signature-freehand.svg'));
    iconRegistry.addSvgIcon('account-child-circle', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-child-circle.svg'));
    iconRegistry.addSvgIcon(
      'card-account-mail-outline',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/card-account-mail-outline.svg'),
    );
    iconRegistry.addSvgIcon('calender-acount', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/calender-acount'));
    iconRegistry.addSvgIcon(
      'card-account-mail-outline',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/card-account-mail-outline.svg'),
    );
    iconRegistry.addSvgIcon('text-box-remove', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/text-box-remove.svg'));
    iconRegistry.addSvgIcon('bell', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bell.svg'));
    iconRegistry.addSvgIcon('file-presentation-box', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-presentation-box.svg'));
    iconRegistry.addSvgIcon('youtube', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/youtube.svg'));
    iconRegistry.addSvgIcon(
      'arrow-right-bold-circle',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/arrow-right-bold-circle.svg'),
    );
    iconRegistry.addSvgIcon(
      'format-list-bulleted-square',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/format-list-bulleted-square.svg'),
    );
    iconRegistry.addSvgIcon('book-open', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/book-open.svg'));
    iconRegistry.addSvgIcon('message-question', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/message-question.svg'));
    iconRegistry.addSvgIcon('email-send-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/email-send-outline.svg'));
    iconRegistry.addSvgIcon('file-document-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-document-outline.svg'));
    iconRegistry.addSvgIcon('calendar-plus', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/calendar-plus.svg'));
    iconRegistry.addSvgIcon('cube-send', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cube-send.svg'));
    iconRegistry.addSvgIcon('pencil-ruler', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/pencil-ruler.svg'));
    iconRegistry.addSvgIcon('lock-check-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/lock-check-outline.svg'));
    iconRegistry.addSvgIcon('map-legend', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/map-legend.svg'));
    iconRegistry.addSvgIcon('sync', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/sync.svg'));
    iconRegistry.addSvgIcon('calendar', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/calendar.svg'));
    iconRegistry.addSvgIcon('finance', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/finance.svg'));
    iconRegistry.addSvgIcon('file-document-edit', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file-document-edit.svg'));
    iconRegistry.addSvgIcon(
      'clipboard-account-outline',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/clipboard-account-outline.svg'),
    );
    iconRegistry.addSvgIcon('phone-check-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/phone-check-outline.svg'));
    iconRegistry.addSvgIcon('login', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/login.svg'));
    iconRegistry.addSvgIcon(
      'badge-account-horizontal-outline',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/badge-account-horizontal-outline.svg'),
    );
    iconRegistry.addSvgIcon('credit-card-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/credit-card-outline.svg'));
    iconRegistry.addSvgIcon('calendar-check-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/calendar-check-outline.svg'));
    iconRegistry.addSvgIcon('recycle', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/recycle.svg'));
    iconRegistry.addSvgIcon('clipboard-search-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/clipboard-search-outline.svg'));
    iconRegistry.addSvgIcon('clipboard-list-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/clipboard-list-outline.svg'));
    iconRegistry.addSvgIcon('folder-alert', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/folder-alert.svg'));
    iconRegistry.addSvgIcon('comment-question', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/comment-question.svg'));
    iconRegistry.addSvgIcon('comment-question-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/comment-question-outline.svg'));
    iconRegistry.addSvgIcon('calendar-account', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/calendar-account.svg'));
    iconRegistry.addSvgIcon('human-male-board', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/human-male-board.svg'));
    iconRegistry.addSvgIcon('office-building', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/office-building.svg'));
    iconRegistry.addSvgIcon('comment-text-multiple', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/comment-text-multiple.svg'));
    iconRegistry.addSvgIcon('clipboard-flow', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/clipboard-flow.svg'));
    iconRegistry.addSvgIcon('bullseye-arrow', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bullseye-arrow.svg'));
    iconRegistry.addSvgIcon('account-school-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-school-outline.svg'));
    iconRegistry.addSvgIcon('lock-reset', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/lock-reset.svg'));
    iconRegistry.addSvgIcon('clipboard-text-clock', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/clipboard-text-clock.svg'));
    iconRegistry.addSvgIcon('email-search', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/email-search.svg'));
    iconRegistry.addSvgIcon('account-multiple-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/account-multiple-outline.svg'));
    iconRegistry.addSvgIcon('text-search-variant', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/text-search-variant.svg'));
    iconRegistry.addSvgIcon('text-box-check-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/text-box-check-outline.svg'));
    iconRegistry.addSvgIcon('text-box-search-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/text-box-search-outline.svg'));
    iconRegistry.addSvgIcon('alert-circle-outline', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/alert-circle-outline.svg'));
  }
}
