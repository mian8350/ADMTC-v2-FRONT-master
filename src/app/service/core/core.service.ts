import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  public tutorialData: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  collapseSidebar = false;
  collapseSidebarStatus: boolean;
  sidenavMode = 'side';
  sidenavTutorialMode = 'side';
  sidenavOpen = true;
  sidenavTutorialOpen = false;
  horizontalSideNavMode = 'over';
  horizontalSideNavOpen = false;
  projectDetailsContent: any;
  editProductData: any;

  setTutorialView(value: any) {
    this.tutorialData.next(value);
  }
  isSidenavOpen() {
    return this.sidenavOpen;
  }
  constructor() {}
}
