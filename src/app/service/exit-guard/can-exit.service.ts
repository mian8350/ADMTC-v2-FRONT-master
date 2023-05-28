import { Injectable } from '@angular/core';
import {CanDeactivate} from '@angular/router';
import { CanExit } from './canExit';

@Injectable({
  providedIn: 'root'
})
export class CanExitService implements CanDeactivate<CanExit> {
  canDeactivate(component: CanExit) {
    if (component.canDeactivate) {
      return component.canDeactivate();
    }
    return true;
  }
  constructor() { }
}