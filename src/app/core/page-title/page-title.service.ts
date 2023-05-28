import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class PageTitleService {
  public title: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public icon: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public additionalInfo: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public retakeJuryData: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public grandOral: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  setTitle(value: string) {
    this.title.next(value);
  }

  setIcon(value: string) {
    this.icon.next(value);
  }

  setAdditionalInfo(value: string) {
    this.additionalInfo.next(value);
  }

  setRetakeJuryData(value: any) {
    this.retakeJuryData.next(value);
  }
  setGrandOral(value: any) {
    this.grandOral.next(value);
  }
}
