import { Injectable, NgZone } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

declare var annyang: any;

@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  words$ = new Subject<{[key: string]: string}>();
  errors$ = new Subject<{[key: string]: any}>();
  listening = false;

  private textSource = new BehaviorSubject<string>('');
  public textData$ = this.textSource.asObservable();

  constructor(
    private zone: NgZone,
    private translateService: TranslateService
  ) { }

  updateText(data) {
    this.textSource.next(data);
  }

  getText() {
    return this.textSource.value;
  }

  resetText() {
    this.textSource.next('');
  }

  get speechSupported(): boolean {
    return !!annyang;
  }

  init() {
    if (annyang) {
      annyang.addCallback('result', (text) => {

        if (this.getText() !== '') {
          this.textSource.next(this.getText() + ' ' + text[0]);
        } else {
          this.textSource.next(text[0]);
        }
      });
      annyang.addCallback('errorNetwork', (err) => {
        this._handleError('network', 'A network error occurred.', err);
      });

      annyang.addCallback('errorPermissionBlocked', (err) => {
        this._handleError('blocked', 'Browser blocked microphone permissions.', err);
      });

      annyang.addCallback('errorPermissionDenied', (err) => {
        this._handleError('denied', 'User denied microphone permissions.', err);
      });
    } else {
      this.swalErrorAnnyang();
    }
  }

  private _handleError(error, msg, errObj) {
    this.zone.run(() => {
      this.errors$.next({
        error: error,
        message: msg,
        obj: errObj
      });
    });
  }

  startListening() {
    if (annyang) {

      if (this.translateService.currentLang === 'fr') {
        annyang.setLanguage('fr-FR')
      } else {
        annyang.setLanguage('en-US')
      }
      annyang.start({ autoRestart: false, continuous: true });
      this.listening = true;
    } else {
      this.swalErrorAnnyang();
    }
  }

  abort() {
    if (annyang) {
      annyang.abort();
      annyang.removeCallback()
      this.listening = false;
    } else {
      this.listening = false;
    }
  }

  swalErrorAnnyang() {
    this.listening = false;
    Swal.fire({
      type: 'error',
      title: this.translateService.instant('ANYYANG_SWAL_ERR.TITLE'),
      html: this.translateService.instant('ANYYANG_SWAL_ERR.TEXT'),
      confirmButtonText: this.translateService.instant('ANYYANG_SWAL_ERR.BUTTON'),
    })
  }
}
