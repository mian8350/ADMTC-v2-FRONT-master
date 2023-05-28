import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { TranscriptBuilderService } from './../../service/transcript-builder/transcript-builder.service';
import { environment } from './../../../environments/environment';
import { ImageBase64 } from './image-base64';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';

// declare const tinymce: any;

@Component({
  selector: 'ms-transcript-builder',
  templateUrl: './transcript-builder.component.html',
  styleUrls: ['./transcript-builder.component.scss'],
})
export class TranscriptBuilderComponent implements OnInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  transcriptData: any;
  editorData: any;
  public config: any;
  expandJsonPanel = false;
  srudent: any;
  rncpTitle: any;
  displayedColumns: string[] = ['index', 'field', 'value', 'action'];
  dataSource = new MatTableDataSource([]);
  private subs = new SubSink();
  transcriptKeys: any;
  isWaitingForResponse = false;

  @ViewChild('pdfLink', { static: true }) pdfLink: ElementRef;

  constructor(
    private transcriptBuilderService: TranscriptBuilderService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    ) {}

  ngOnInit() {
    // this.config = {
    //   plugins:
    //     // tslint:disable-next-line: max-line-length
    //     'image print fullpage searchreplace autolink directionality visualblocks visualchars fullscreen link codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount textpattern help',
    //   toolbar:
    //     // tslint:disable-next-line: max-line-length
    //     'bold italic strikethrough forecolor backcolor permanentpen fontsizeselect | image | link pageembed | alignleft aligncenter alignright alignjustify  | numlist bullist outdent indent | removeformat',
    //   content_css: ['//fonts.googleapis.com/css?family=Lato:300,300i,400,400i', '//www.tiny.cloud/css/codepen.min.css'],
    //   importcss_append: true,
    //   height: 700,
    //   spellchecker_dialog: true,
    //   spellchecker_whitelist: ['Ephox', 'Moxiecode'],
    //   content_style:
    //     // tslint:disable-next-line: max-line-length
    //     '.mce-annotation { background: #fff0b7; } .tc-active-annotation {background: #ffe168; color: black;} .mce-content-body p { margin: 10px 0;}',
    //   image_advtab: true,
    //   file_picker_callback: function (cb, value, meta) {
    //     const input = document.createElement('input');
    //     input.setAttribute('type', 'file');
    //     input.setAttribute('accept', 'image/*');
    //     input.onchange = function () {
    //       const file = input.files[0];
    //       const reader = new FileReader();
    //       reader.onload = function () {
    //         const id = 'blobid' + new Date().getTime();
    //         const blobCache = tinymce.activeEditor.editorUpload.blobCache;
    //         const base64 = (reader.result as any).split(',')[1];
    //         const blobInfo = blobCache.create(id, file, base64);
    //         blobCache.add(blobInfo);
    //         cb(blobInfo.blobUri(), { title: file.name });
    //       };
    //       reader.readAsDataURL(file);
    //     };
    //     input.click();
    //   },
    //   /*  setup: editor => {
    //     editor.on('click', (event: ClipboardEvent) => {

    //     });
    //   }, */
    // };
    // this.getUrgentMail();
  }

  fetchKeys() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptBuilderService.getTranscriptData().subscribe((res: any) => {
      this.isWaitingForResponse = false;
      this.transcriptKeys = res;

      const data = [];

      Object.keys(res).forEach((key, index) => {
        res[key]['index'] = index + 1;
        data.push({
          index: index + 1,
          field: key,
          value: res[key].value,
        });
      });

      this.dataSource.data = data;
      this.expandJsonPanel = true;
    });
  }

  copyKey(record) {
    const val = '${' + this.transcriptKeys[record.field].index + '}';
    this.copyToClipboard(val);
  }

  copyToClipboard(val) {
    const listener = (e: ClipboardEvent) => {
      const clipboard = e.clipboardData || window['clipboardData'];
      clipboard.setData('text', val);
      e.preventDefault();
    };

    document.addEventListener('copy', listener, false);
    document.execCommand('copy');
    document.removeEventListener('copy', listener, false);
  }

  toggleJsonPanel() {
    this.expandJsonPanel = !this.expandJsonPanel;
  }

  submit() {

  }

  preView() {
    let html: string = this.editorData;

    if (this.transcriptKeys) {
      Object.keys(this.transcriptKeys).forEach((objKey, index) => {
        const key = '${' + this.transcriptKeys[objKey].index + '}';
        html = html.replace(key, this.transcriptKeys[objKey].value);
      });
    }

    html = html.replace(
      '<head>',
      `
        <head>
        <style>
            html, body {
              margin: 0;
            }
            table > tbody > tr > td[style*='background-color'] {
              -webkit-print-color-adjust: exact;
            }
            .page-break{
              page-break-before: always;
            }
        </style>
      `,
    );

    html = html.replace('<p><!-- pagebreak --></p>', `<p class="page-break"></p>`);

    this.subs.sink = this.transcriptBuilderService.generatePdf(html, 'transcript-builder.pdf').subscribe((res: any) => {
      const element = this.pdfLink.nativeElement;
      element.href = environment.PDF_SERVER_URL + res.filePath;
      element.target = '_blank';
      element.setAttribute('download', res.filename);
      element.click();
    });

    /* const wnd = window.open('about:blank', 'PRINT', '_blank');
    let data = this.editorData;
    data = data.replace('${nom}', this.transcriptData.nom);

    wnd.document.write(data);
    wnd.print();
    wnd.close(); */
  }

  // getUrgentMail() {
  //   this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailList: any[]) => {
  //     if (mailList && mailList.length) {
  //       this.subs.sink = this.dialog
  //         .open(ReplyUrgentMessageDialogComponent, {
  //           disableClose: true,
  //           width: '825px',
  //           panelClass: 'certification-rule-pop-up',
  //           data: mailList,
  //         })
  //         .afterClosed()
  //         .subscribe((resp) => {
  //           this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailUrgent: any[]) => {
  //             if (mailUrgent && mailUrgent.length) {
  //               this.replyUrgentMessageDialogComponent = this.dialog.open(ReplyUrgentMessageDialogComponent, {
  //                 disableClose: true,
  //                 width: '825px',
  //                 panelClass: 'certification-rule-pop-up',
  //                 data: mailUrgent,
  //               });
  //             }
  //           });
  //         });
  //     }
  //   });
  // }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
