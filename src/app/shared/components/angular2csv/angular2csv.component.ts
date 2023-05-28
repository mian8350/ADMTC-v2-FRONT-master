import { Component } from '@angular/core';

@Component({
  selector: 'app-angular2csv',
  template: '<div (click)="onDownload()"><ng-content></ng-content></div>',
})
export class CustomAngular2csvComponent {
  onDownload(): void {}
}
