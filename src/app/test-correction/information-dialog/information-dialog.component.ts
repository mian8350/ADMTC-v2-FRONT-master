import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'ms-information-dialog',
  templateUrl: './information-dialog.component.html',
  styleUrls: ['./information-dialog.component.scss'],
})
export class InformationDialogComponent implements OnInit {
  isWaitingForResponse = false;

  headerText = new UntypedFormControl('');
  footerText = new UntypedFormControl('');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<InformationDialogComponent>
    ) {}

  ngOnInit() {

  }

  getFullTextFromHtml(html: string) {
    const el = document.createElement('div');
    html = html.replace('.', '.</br>');
    el.innerHTML = html;
    let data = el.textContent || el.innerText || '';
    data = data.replace(/\s+/g, ' ');
    return data;
  }

  close() {
    this.dialogRef.close();
  }
}
