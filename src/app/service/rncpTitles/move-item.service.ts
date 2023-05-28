import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare var _: any;
@Injectable({
  providedIn: 'root'
})
export class MoveItemService {

  positionStack = new BehaviorSubject<number[]>(null);
  movingStack = new BehaviorSubject<{stack: number[], type: string}>({stack: [], type : ''});

  constructor() {
  }

  updateMovingCategory(stack: number[], type: string) {
    this.movingStack.next({
      stack: stack,
      type: type
    });
    let a = [...stack];
    a.pop();
    this.positionStack.next(a);
  }

  getPositionStack() {
    return this.positionStack;
  }

  getMovingStack() {
    return this.movingStack;
  }

  updateSelectedCategory(stack: number[]) {
    this.positionStack.next(stack);
  }

}
