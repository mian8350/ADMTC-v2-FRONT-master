import {Observable} from 'rxjs';
export interface CanExit {
 canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}