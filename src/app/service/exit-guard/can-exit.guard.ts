import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import { CanExit } from './canExit';

@Injectable()
export class CanExitGuard implements CanDeactivate<CanExit> {
 canDeactivate(component: CanExit) {
   if (component.canDeactivate) {
     return component.canDeactivate();
   }
   return true;
 }
}
