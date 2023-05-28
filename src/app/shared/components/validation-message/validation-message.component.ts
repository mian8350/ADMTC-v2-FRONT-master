import { Component, OnInit, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'ms-validation-message',
  templateUrl: './validation-message.component.html',
  styleUrls: ['./validation-message.component.scss']
})
export class ValidationMessageComponent implements OnInit {

  @Input() control: AbstractControl;
  @Input() messages: any;

  constructor() { }

  ngOnInit() {
  }

  getFirstKey(object) {

    if (object) {
      const keys = Object.keys(object);
      if (keys && keys.length > 0) {
        return keys[0];
      } else {
        return null;
      }
    }
    return null;

  }

}
