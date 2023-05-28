import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService, TranslateParser } from '@ngx-translate/core';
import { Injectable } from '@angular/core';

@Injectable()
export class CustomMatPaginatorIntl extends MatPaginatorIntl {
  private rangeLabel: string;

  public constructor(private translate: TranslateService, private translateParser: TranslateParser) {
    super();

    this.translate.onLangChange.subscribe((e: Event) => {
      this.translateLabels();
    });

    this.translateLabels();
  }

  translateLabels() {
    this.translate.get([
      'ITEMSPERPAGE',
      'RANGE',
    ])
      .subscribe(translation => {
        this.itemsPerPageLabel = translation['ITEMSPERPAGE'];
        this.rangeLabel = translation['RANGE'];
        this.firstPageLabel = this.translate.instant('First Page');
        this.previousPageLabel = this.translate.instant('Previous Page');
        this.nextPageLabel = this.translate.instant('Next Page');
        this.lastPageLabel = this.translate.instant('Last Page');
        this.changes.next();
      });
  }

  getRangeLabel = (page, pageSize, length) => {
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ?
      Math.min(startIndex + pageSize, length) :
      startIndex + pageSize;
    return this.translateParser.interpolate(startIndex + 1 + ' - ' + endIndex + this.rangeLabel + length, { startIndex, endIndex, length });
  };
}
