import { UntypedFormControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';

@Component({
  selector: 'ms-title-task-builder-task-preview',
  templateUrl: './title-task-builder-task-preview.component.html',
  styleUrls: ['./title-task-builder-task-preview.component.scss'],
})
export class TitleTaskBuilderTaskPreviewComponent implements OnInit {
  isRequired = false;
  public Editor = DecoupledEditor;
  public config = {
    toolbar: [
      'heading',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'highlight:redPen',
      'highlight:greenPen',
      'removeHighlight',
      'numberedList',
      'bulletedList',
      'link',
      'undo',
      'redo',
    ],
  };
  actionToken = new UntypedFormControl('');

  @Input() taskFormValue: any;

  constructor() {}

  ngOnInit() {}

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  transformNameIfADMTCDir(name) {
    if (name && name === 'ADMTC Director') return 'Title Manager';
    return name;
  }
}
