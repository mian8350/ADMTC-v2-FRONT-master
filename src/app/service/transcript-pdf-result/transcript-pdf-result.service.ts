import { Component, Injectable, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ImageBase64 } from 'app/transcript-builder/transcript-builder/image-base64';
import { PdfRDC } from 'app/transcript-process/transcript-pdf-result/pdf-rdc';
import * as moment from 'moment';
// import { Observable } from 'apollo-link';
import { BehaviorSubject, Observable } from 'rxjs';
import { PdfDMOE2021 } from 'app/transcript-process/transcript-pdf-result/pdf-dmoe';
import { PdfRMO2020 } from 'app/transcript-process/transcript-pdf-result/pdf-rmo';
import { PdfCPEB } from 'app/transcript-process/transcript-pdf-result/pdf-cpeb';
import { PdfAGIR2020 } from 'app/transcript-process/transcript-pdf-result/pdf-agir';
import { PdfRGP2020 } from 'app/transcript-process/transcript-pdf-result/pdf-rgp';
import { PdfCPEA } from 'app/transcript-process/transcript-pdf-result/pdf-cpea';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { TranscriptBuilderService } from '../transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';
import { RNCPTitlesService } from '../rncpTitles/rncp-titles.service';
import { PdfCDCM2020 } from 'app/transcript-process/transcript-pdf-result/pdf-cdcm';
import { PdfDefaultScore } from 'app/transcript-process/transcript-pdf-result/pdf-default-score';
import { PdfDefaultPoint } from 'app/transcript-process/transcript-pdf-result/pdf-default-point';

@Injectable({
  providedIn: 'root',
})
export class PDFResultService {
  private isWaitingResponseSource = new BehaviorSubject<boolean>(false);
  public isWaitingResponseChange$ = this.isWaitingResponseSource.asObservable();
  // private academictUrl = AppSettings.urls.academic;
  private headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });
  Print = 'https://zetta-pdf.net/';
  private student: any;
  private juryDescision = '';
  private htmlNTitle: any = null;
  private hasJuryDecidedFlag = false;
  private expertise: any;
  private journalText: string;
  private RDC_DECALE_FEV_2021 = '5e2ec4ef120f86385ffd0fd2'; // id for title "RDC DECALE FEV 2021"
  private DMOE_DECALE_2021 = '5c372e7a7f2fad35e41a398e'; // id for title "DMOE DECALE 2021"
  private RMO_2020 = '5cde777c5bdb94110a93e681'; // id for title "RMO 2020"
  private RMO_2021 = '5ea82465d85a96250046121f'; // id for title "RMO 2021"

  private RGPDecaleId = '5b37845fa8ac2c0f97824f32'; // id for title "RGP DECALE 2019"
  private CPCId = '5b3e06e827a41d7a83376067'; // id for title "CPC 2019"
  private MSCId = '5b3e4b5727a41d7a8337937c'; // id for title "MSC 1 AN 2019"
  private RGPId = '5b3f7e311bd78c73bf2f11b3'; // id for title "RGP 2019"
  private DRHId = '5b8fb77bb9b61844f93ead94'; // id for title "DRH 2019"
  private RABId = '5b791476d9dfe135d5461145'; // id for title "RAB 2019"
  private RDCId = '5b3b7be2e9a880184ecc5c73'; // id for title "RDC 2019"
  private RDC2020 = '5d0b63460b24e17f3bb73fe5'; // id for title "RDC 2020"
  private RDC2021 = '5f19a7cbb5cf0b47b2c49257'; // id for title "RDC 2021"
  private RDC_DECALE_JUIN_2020 = '5cee35ded07b8124e4878554'; // id for title "RDC DECALE JUIN 2020"
  private DMOE_DECALE_JUIN_2021 = '5cf3fcd559b76650ecf88865'; // id for title "RDC DECALE JUIN 2020"
  private RDC_DECALE_FEV_2020 = '5c47126ee174b27384b062ad'; // id for title "RDC DECALE FEV 2020"
  private CPEBId = '5b69dc6f81935943d24d2696'; // id for title "CPEB 2019"
  private MPIId = '5baa3316293eb71d0162c69e'; // id for title "MPI 2019"
  private MPIDigitalANSId = '5b3e174527a41d7a83376782'; // id for title "MPI Digital 1 ANS 2019"
  private RRHId = '5b69e61e81935943d24d26bb'; // id for title "RRH 2019"
  private RRH2020Id = '5d1dfaa62cf1f335ce12de34'; // id for title "RRH 2020"F
  private DRH2020Id = '5b825d5dc9797239bd708249'; // id for title "DRH 2020"
  private DRH2021Id = '5d5bfc74406c855a675b8f59'; // id for title "DRH 2021"
  private RAB2020Id = '5d7a209c3690f75c78fa7869'; // id for title "RAB 2020"
  private RGP2020Id = '5d03a940bc8cf462569c85cf'; // id for title "RGP 2020"
  private RMO2020Id = '5cde777c5bdb94110a93e681'; // id for title "RMO 2020"
  private CPCD2020Id = '5d66629077ef432f084f4dc2'; // id for title "CPCD 2020"
  private CPCD2021Id = '5ea2c054c274950f5a34e142'; // id for title "CPCD 2021"
  private CDCM2020Id = '5d712ba3d6f9a1159ae4119d'; // id for title "CDCM 2020"
  private BANCASSURANCE2020Id = '5c503955eb9f9272f18c64bf'; // id for title "BANCASSURANCE 2020"
  private BANCASSURANCE2020IDAICId = '5dd526ab965b293633330b23'; // id for title "BANCASSURANCE 2020 IDAIC"
  private MSC1AN2020 = '5cd05bc678434b65df41870f'; // id for title "MSC 1 AN 2020"
  private MSC2AN2020 = '5b4ddad0eaf3af61dae1aca3'; // id for title "MSC 2 AN 2020"
  private MPI2020 = '5b69c87581935943d24d25c7'; // id for title "MPI 2020"
  private MPI2020E = '5da8900225a0ba09f97b16d9'; // id for title "MPI 2020 E"
  private MPIDIGITAL1AN2020 = '5c7e8e7803eff177b469409f'; // id for title "MPI DIGITAL 1 AN 2020"
  private DMOE2020 = '5b3dfce527a41d7a83375b65'; // id for title "DMOE 2020"
  private DMOE2021 = '5c98fd155c92023e22f07948'; // id for title "DMOE 2021"
  private DMOEPIGIER2020 = '5c6533c86df34f18eb3ab99b'; // id for title "DMOE PIGIER 2020"
  private AGIRGL2020 = '5d76db8095ce5527322227da'; // id for title "AGIR GL 2020"
  private AGIRSR2020 = '5d76de2395ce55273222281a'; // id for title "AGIR SR 2020"
  private CPEBBLOC2020 = '5d67c89d124f9915d4afa186'; // id for title "CPEB BLOC 2020"
  private CPEBBLOC2021 = '5e96c02c2fbac73c9e039929'; // id for title "CPEB BLOC 2021"
  private CPCBLOC2020 = '5d87d0e5e840c2245768452f'; // id for title "CPC BLOC 2020"
  private CDCM2021Id = '5e4d5d62775f9c38e9d7c648'; // id for title "CDCM 2020"
  private CDCMBA2021Id = '5f4552f9522a442498bd05dc'; // id for title "CDCM 2020"
  private CDCMENC2021Id = '5fd36b32a48c9a620e65861b'; // id for title "CDCM 2020"
  private CGRHP2021Id = '5e58d816c9ec3b127b6a716b'; // id for title "CGRHP 2021"
  private DMOE2020Data: any;

  private handleError(error: Response) {
    console.error('Error :', error);
    return Observable.throw(error);
  }

  constructor(
    private httpClient: HttpClient,
    private translate: TranslateService,
    private rncp_titleService: RNCPTitlesService,
    private transcriptBuilderService: TranscriptBuilderService,
  ) {}

  getPDF(html: string, filename: string, landscape: boolean, Margin = false) {}

  private generatePdf(html, filename, isLandscape) {
    const fileDoc = html;
    const fullHtml = fileDoc;
    const htmls = fullHtml;
    this.transcriptBuilderService.generatePdf(htmls, filename).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
      this.setIsWaitingResponse(false);
    });
  }

  getStudentResultDetails(student, titleId, classId, schoolId, studentTranscript) {

    this.getDataTranscriptResult(titleId, classId, student, student, studentTranscript);

    if (studentTranscript) {
      this.juryDescision = studentTranscript.decision_school_board
    }
  }

  getStudentResultDetailsPoint(student, titleId, classId, schoolId, studentTranscript) {

    this.getDataTranscriptResultPoint(titleId, classId, student, student, studentTranscript);

    if (studentTranscript) {
      this.juryDescision = studentTranscript.decision_school_board
    }
  }

  setIsWaitingResponse(isWaiting: boolean) {
    this.isWaitingResponseSource.next(isWaiting);
  }

  getDataTranscriptResult(titleId, classId, studentId, student, studentTranscript) {
    this.setIsWaitingResponse(true);
    this.rncp_titleService.getAllFinalTranscriptResult(titleId, classId, studentId._id).subscribe((resp) => {
      if (resp && resp.length) {
        const titleWithRetake = [
          this.RMO_2020,
          this.RMO_2021,
          this.DMOE2020,
          this.DMOE2021,
          this.DMOEPIGIER2020,
          this.CDCM2020Id,
          this.CDCM2021Id,
          this.CDCMBA2021Id,
          this.CDCMENC2021Id,
          this.CGRHP2021Id,
          this.RMO2020Id,
          this.RDCId,
          this.RDC_DECALE_FEV_2020,
          this.RDC_DECALE_FEV_2021,
          this.RDC2020,
          this.RDC2021,
          this.DMOE_DECALE_2021,
          this.RDC_DECALE_JUIN_2020,
          this.DMOE_DECALE_JUIN_2021,
          this.RGP2020Id,
          this.DRHId,
          this.DRH2020Id,
          this.DRH2021Id,
          this.CPCD2020Id,
          this.CPCD2021Id,
          this.BANCASSURANCE2020Id,
          this.BANCASSURANCE2020IDAICId,
          this.CPCBLOC2020,
          this.CPEBBLOC2020,
          this.CPEBBLOC2021,
        ];
        this.DMOE2020Data = resp[0];
        student.rncp_title = resp[0].rncp_id;
        student.school = resp[0].school_id;
        // Get main address of certifier
        if (
          student &&
          student.rncp_title &&
          student.rncp_title.certifier &&
          student.rncp_title.certifier.school_address &&
          student.rncp_title.certifier.school_address.length
        ) {
          student.rncp_title.certifier.school_address = student.rncp_title.certifier.school_address.find(
            (address) => address && address.is_main_address,
          );
        }
        this.journalText = this.DMOE2020Data.rncp_id.journal_text;

        this.htmlNTitle = this.formatResultDetailstoHTML(false, student, this.DMOE2020Data, studentTranscript);
        // if (titleWithRetake.includes(titleId)) {




        //   this.htmlNTitle = this.formatResultDetailstoHTML(false, student, this.DMOE2020Data, studentTranscript);
        //   // this.generatePdf(this.htmlNTitle.html, this.htmlNTitle.filename, false);
        // }
      }
    });
  }

  getDataTranscriptResultPoint(titleId, classId, studentId, student, studentTranscript) {
    this.setIsWaitingResponse(true);
    this.rncp_titleService.getAllFinalTranscriptResult(titleId, classId, studentId._id).subscribe((resp) => {
      if (resp && resp.length) {
        this.DMOE2020Data = resp[0];
        student.rncp_title = resp[0].rncp_id;
        student.school = resp[0].school_id;
        // Get main address of certifier
        if (
          student &&
          student.rncp_title &&
          student.rncp_title.certifier &&
          student.rncp_title.certifier.school_address &&
          student.rncp_title.certifier.school_address.length
        ) {
          student.rncp_title.certifier.school_address = student.rncp_title.certifier.school_address.find(
            (address) => address && address.is_main_address,
          );
        }
        this.journalText = this.DMOE2020Data.rncp_id.journal_text;

        this.htmlNTitle = this.formatResultDetailsToHTMLPoint(false, student, this.DMOE2020Data, studentTranscript);
      }
    });
  }

  formatResultDetailstoHTML(returnHTML?: boolean, student?, resultDetails?, studentTranscript?) {
    // let PdfHtml = '';
    // let subjectcontinousControlRGP2019 = ``;
    // let expertiseBlock = ``;
    // let numberOfTest = 0;
    // let addMargin = false;
    if (student && student.rncp_title && student.rncp_title._id) {
      this.student = student;
    }

    this.expertise = resultDetails;



    const checkIfNumber = (total) => {
      if (total < 10) {
        return '&nbsp;&nbsp;' + total;
      }
      return total.toString();
    };

    let htmlToGenerate = ``;
    htmlToGenerate =
      this.styleConditionCompute() +
      PdfDefaultScore.computePDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    // if (
    //   this.student.rncp_title._id === this.RDC_DECALE_FEV_2021 ||
    //   this.student.rncp_title._id === this.RDCId ||
    //   this.student.rncp_title._id === this.RDC_DECALE_FEV_2020 ||
    //   this.student.rncp_title._id === this.RDC2020 ||
    //   this.student.rncp_title._id === this.RDC2021 ||
    //   this.student.rncp_title._id === this.RDC_DECALE_JUIN_2020
    // ) {
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfRDC.computerRDCPDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    //   // PdfRDC.computerRDCPDF(this.student, resultDetails, this.expertise);
    // } else if (
    //   this.student.rncp_title._id === this.DMOE_DECALE_2021 ||
    //   this.student.rncp_title._id === this.DMOE_DECALE_JUIN_2021 ||
    //   this.student.rncp_title._id === this.DMOE2020 ||
    //   this.student.rncp_title._id === this.DMOE2021 ||
    //   this.student.rncp_title._id === this.DMOEPIGIER2020
    // ) {
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfDMOE2021.computerRDCPDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    // } else if (this.student.rncp_title._id === this.RMO_2020 || this.student.rncp_title._id === this.RMO_2021) {
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfRMO2020.computerRDCPDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    // } else if (this.student.rncp_title._id === this.AGIRGL2020 || this.student.rncp_title._id === this.AGIRSR2020) {
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfAGIR2020.computerRDCPDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    // } else if (
    //   this.student.rncp_title._id === this.CPEBId ||
    //   this.student.rncp_title._id === this.CPEBBLOC2020 ||
    //   this.student.rncp_title._id === this.CPEBBLOC2021 ||
    //   this.student.rncp_title._id === this.MPIDigitalANSId ||
    //   this.student.rncp_title._id === this.RRHId ||
    //   this.student.rncp_title._id === this.RRH2020Id ||
    //   this.student.rncp_title._id === this.MPIId ||
    //   this.student.rncp_title._id === this.MPI2020 ||
    //   this.student.rncp_title._id === this.MPI2020E ||
    //   this.student.rncp_title._id === this.MPIDIGITAL1AN2020
    // ) {
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfCPEB.computeHeadPartPdf(this.student, resultDetails) +
    //     PdfCPEB.greyAreaTop(this.student.rncp_title._id) +
    //     PdfCPEB.computeFirstBodyPart(this.expertise, this.student, resultDetails) +
    //     PdfCPEB.computeHeadPartPdf(this.student, resultDetails) +
    //     PdfCPEB.greyAreaBottom(this.student.rncp_title._id) +
    //     PdfCPEB.computeSecondBodyPart(this.expertise, resultDetails, this.student.rncp_title._id, this.DMOE2020Data);
    //   // } else if (this.student.rncp_title._id === this.RABId || student.rncp_title._id === this.RAB2020Id) {
    //   //   htmlToGenerate = this.styleConditionCompute() + PdfCPEA.computerCPEAPDF(this.student, resultDetails, this.expertise);
    // } else if (
    //   this.student.rncp_title._id === this.RGP2020Id ||
    //   this.student.rncp_title._id === this.DRH2021Id ||
    //   this.student.rncp_title._id === this.DRH2020Id ||
    //   this.student.rncp_title._id === this.DRHId ||
    //   this.student.rncp_title._id === this.CPCD2021Id ||
    //   this.student.rncp_title._id === this.CPCD2020Id
    // ) {
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfRGP2020.computerRDCPDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    // } else if (
    //   this.student.rncp_title._id === this.CDCM2020Id ||
    //   this.student.rncp_title._id === this.CDCM2021Id ||
    //   this.student.rncp_title._id === this.CDCMENC2021Id ||
    //   this.student.rncp_title._id === this.CGRHP2021Id ||
    //   this.student.rncp_title._id === this.CDCMBA2021Id
    // ) {
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfCDCM2020.computerRDCPDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    // } else {
    //   // htmlToGenerate = this.styleConditionComputeMain() + this.computeHeadPartPdf() + PdfHtml;
    //   htmlToGenerate =
    //     this.styleConditionCompute() +
    //     PdfRGP2020.computerRDCPDF(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);
    // }

    const filename = `${this.student.last_name}-${this.student.first_name}-${
      this.student.rncp_title ? this.student.rncp_title.rncp_level + ' ' + this.student.rncp_title.long_name : ''
    }-${this.student.school ? this.student.school.short_name : ''}`;

    if (!returnHTML) {
      this.generatePdf(htmlToGenerate, filename, false);
    } else {
      this.setIsWaitingResponse(false);
    }

    return {
      html: htmlToGenerate,
      fileName: filename,
    };
  }

  formatResultDetailsToHTMLPoint(returnHTML?: boolean, student?, resultDetails?, studentTranscript?) {
    if (student && student.rncp_title && student.rncp_title._id) {
      this.student = student;
    }

    this.expertise = resultDetails;



    const checkIfNumber = (total) => {
      if (total < 10) {
        return '&nbsp;&nbsp;' + total;
      }
      return total.toString();
    };

    let htmlToGenerate = ``;
    htmlToGenerate =
      this.styleConditionComputePoint() +
      PdfDefaultPoint.computePDFPage1(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);

    htmlToGenerate +=
      this.styleConditionComputePoint() +
      PdfDefaultPoint.computePDFPage2(this.student, resultDetails, this.expertise, this.journalText, this.DMOE2020Data, studentTranscript);

    const filename = `${this.student.last_name}-${this.student.first_name}-${
      this.student.rncp_title ? this.student.rncp_title.rncp_level + ' ' + this.student.rncp_title.long_name : ''
    }-${this.student.school ? this.student.school.short_name : ''}`;

    if (!returnHTML) {
      this.generatePdf(htmlToGenerate, filename, false);
    } else {
      this.setIsWaitingResponse(false);
    }

    return {
      html: htmlToGenerate,
      fileName: filename,
    };
  }

  private styleConditionCompute() {
    let headerPx = {
      test: 0,
      mark: 0,
      coeff: 0,
      credit: 0,
      horiLine: 0,
    };

    let subjectPx = {
      test: 0,
      markTotal: 0,
      credits: 0,
      creditDisp: 'none',
      subMark: 420,
      subCoef: 130,
      disCoefTotal: 'inline',
    };

    let retakeDisp = 'none';
    if (this.juryDescision === 'pass' || this.juryDescision === 'PASS') {
      headerPx = {
        test: 270,
        mark: 110,
        coeff: 110,
        credit: 70,
        horiLine: 85,
      };
      subjectPx = {
        test: 285,
        markTotal: 110,
        credits: 80,
        creditDisp: 'inline',
        subMark: 440,
        subCoef: 110,
        disCoefTotal: 'inline',
      };
    } else {
      headerPx = {
        test: 310,
        mark: 130,
        coeff: 130,
        credit: 0,
        horiLine: 98,
      };

      subjectPx = {
        test: 325,
        markTotal: 130,
        credits: 0,
        creditDisp: 'none',
        subMark: 510,
        subCoef: 120,
        disCoefTotal: 'none',
      };

      if (this.juryDescision === 'retaking' || this.juryDescision === 'retake') {
        retakeDisp = 'inline';
      }

      // if (this.hasJuryDecidedFlag) {
      //   retakeDisp = 'none';
      // }
    }
    const pdfStyles = `
      <style>

          html, body {
            height: 99%;
          }

        .retake-stamp-wrapper {
          position: relative;
        }

        .retake-stamp {
          display: ${retakeDisp};
        }

        .main-container {
          width: 75%;
          margin: 0% auto;
          font-size: 10px;
          font-family: Roboto,sans-serif;
        }

        .main-container-rgp {
          width: 95%;
          margin: 1% auto;
          font-size: 10px;
          font-family: Roboto,sans-serif;
        }
        .p {
          padding: 0px !important;
          margin: 0px !important;
        }
        .main-container-dmoe {
          width: 95%;
          margin: 5px auto;
          font-size: 10px;
          font-family: Roboto,sans-serif;
        }

        .tr-cpc td, .tr-cpc th {
          border: 1px solid black;
          padding: 3px;
        }

        .con-65 {
          width: 65%;
          float: left;
        }

        .second-head-cpc {
          text-align: center;
          margin: 5px 0;
          width: 100%;
          background-color: #d8d8d8!important;
          -webkit-print-color-adjust: exact;
          display: block;
          border: 1px solid black;
        }

        .gray-background {
          background-color: #d8d8d8;
          -webkit-print-color-adjust: exact;
        }

        .con-35 {
          width: 35%;
          float: left;
        }

        .stud-detail-para {
          margin: 5px 0 5px 30px
        }

        .result-container {
          width: 99%;
          padding: 10px 7px;
          margin: 10px 0 10px 0;
          overflow: auto;
        }

        .result-text-container {
          width: 100%;
          color: white;
          height: 55px;
          font-weight: bold;
          font-size: 15px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }

        .upper-container{
          width: 100%;
          display: block;
          height: 140px;
        }

        .header-card {
          color: white;
          font-weight: bold;
          float: left;
          text-align: center;
          height: 55px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }

        .header-card-dmoe {
          color: white;
          font-weight: 700;
          float: left;
          text-align: center;
          height: 15px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }
        .header-card-rmo {
          color: white;
          font-weight: 700;
          float: left;
          text-align: center;
          height: 25px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }

        .test-width {
          width: ${headerPx.test}px;
          margin: 0px 0px 0px 5px;
        }
        .mark-width {
          width: ${headerPx.mark}px;
          margin: 0px 0px 0px 5px;
        }
        .coeff-width {
          width: ${headerPx.coeff}px;
          margin: 0px 0px 0px 5px;
        }
        .credit-width {
          width: ${headerPx.credit}px;
          margin: 0px 0px 0px 5px;
        }
        .result-test {
          width: 85%;
          float: left;
          text-align: center;
        }

        .result-mark {
          width: 15%;
          float: left;
          text-align: center;
          display: ${subjectPx.disCoefTotal};
        }

        .subject-container {
          margin-left: 5px;
          width:100%;
        }

        .subject-name-coeff {
          width: 100%;
          font-weight: bold;
          float: left;
          margin-bottom: -10px;
        }
        .test-name-con {
          width: 100%;
          float: left;
          margin: -13px 0px -13px 0px;
          page-break-before: always
        }
        .subject-name {
          width:${subjectPx.subMark}px;
          float: left;
        }
        .subject-coeff {
          width ${subjectPx.subCoef}px;
          float: left;
          text-align: center;
        }

        .subject-mark-total {
          float: left;
          width: ${subjectPx.markTotal}px;
          margin-right: ${subjectPx.markTotal}px;
          text-align: center;
        }

        .subject-mark-coeff {
          float: left;
          width: ${subjectPx.credits}px;
          display: ${subjectPx.creditDisp};
          text-align: center;
        }

        .subject-total-mark {
          width: 100%;
          font-weight: bold;
          float: left;
          font-style: italic;
          font-size: 12px;
          margin-top: 5px;
        }
        .horizontal-line {
          width: ${headerPx.horiLine}%;
          float: left;
          border: 1px solid black;
        }

        .continous-control-title-line {
          width: 90%;
          float: left;
          border-bottom: "2px solid black";
        }

        .subject-mark-text {
          width: 100%;
          margin-top: -7px;
        }

        .subject-total-text {
          width: ${subjectPx.test}px;
          float: left;
        }

        .text-mark-row {
          float: left;
          width:100%;
        }
        .test-name {
          width: ${headerPx.test}px;
          float: left;
          margin: 0px 0px 0px 5px;
        }

        .test-mark-coeff{
          width: ${headerPx.coeff}px;
          float: left;
          margin: 0px 0px 0px 5px;
          text-align: center;
        }

        .test-mark-coeff-total {
          width: ${headerPx.coeff}px;
          float: left;
          margin: 0px 0px 0px 5px;
          text-align: center;
          display: inline-block;
        }

        .total-mark {
          margin:auto;
          margin-top: 15px;
          width: 30px;
          text-align: left;
        }

        .margin-top-remove {
          margin-top: -10px;
        }

        .margin-down-remove {
          margin-bottom: -20px;
        }

        .border-botttom td{
          border-bottom: 1px solid black;
        }
        .right-border td:nth-child(odd),th:nth-child(odd){
          border-right: 0px solid black;
        }
      </style>`;

    return pdfStyles;
  }

  private styleConditionComputePoint() {
    let headerPx = {
      test: 0,
      mark: 0,
      coeff: 0,
      credit: 0,
      horiLine: 0,
    };

    let subjectPx = {
      test: 0,
      markTotal: 0,
      credits: 0,
      creditDisp: 'none',
      subMark: 420,
      subCoef: 130,
      disCoefTotal: 'inline',
    };

    let retakeDisp = 'none';
    if (this.juryDescision === 'pass' || this.juryDescision === 'PASS') {
      headerPx = {
        test: 270,
        mark: 110,
        coeff: 110,
        credit: 70,
        horiLine: 85,
      };
      subjectPx = {
        test: 285,
        markTotal: 110,
        credits: 80,
        creditDisp: 'inline',
        subMark: 440,
        subCoef: 110,
        disCoefTotal: 'inline',
      };
    } else {
      headerPx = {
        test: 310,
        mark: 130,
        coeff: 130,
        credit: 0,
        horiLine: 98,
      };

      subjectPx = {
        test: 325,
        markTotal: 130,
        credits: 0,
        creditDisp: 'none',
        subMark: 510,
        subCoef: 120,
        disCoefTotal: 'none',
      };

      if (this.juryDescision === 'retaking' || this.juryDescision === 'retake') {
        retakeDisp = 'inline';
      }

      // if (this.hasJuryDecidedFlag) {
      //   retakeDisp = 'none';
      // }
    }
    const pdfStyles = `
      <style>

          html, body {
            height: 99%;
          }

        .retake-stamp-wrapper {
          position: relative;
        }

        .retake-stamp {
          display: ${retakeDisp};
        }

        .main-container {
          width: 75%;
          margin: 0% auto;
          font-size: 10px;
          font-family: Roboto,sans-serif;
        }

        .main-container-rgp {
          width: 95%;
          margin: 1% auto;
          font-size: 10px;
          font-family: Roboto,sans-serif;
        }
        .p {
          padding: 0px !important;
          margin: 0px !important;
        }
        .main-container-dmoe {
          width: 95%;
          margin: 5px auto;
          font-size: 10px;
          font-family: Roboto,sans-serif;
        }

        .tr-cpc td, .tr-cpc th {
          border: 1px solid #686868 !important;
          padding: 3px;
        }

        .con-65 {
          width: 65%;
          float: left;
        }

        .second-head-cpc {
          text-align: center;
          margin: 5px 0;
          width: 100%;
          background-color: #d8d8d8!important;
          -webkit-print-color-adjust: exact;
          display: block;
          border: 1px solid #686868 !important;
        }

        .gray-background {
          background-color: #d8d8d8;
          -webkit-print-color-adjust: exact;
        }

        .con-35 {
          width: 35%;
          float: left;
        }

        .stud-detail-para {
          margin: 5px 0 5px 30px
        }

        .result-container {
          width: 99%;
          padding: 10px 7px;
          margin: 10px 0 10px 0;
          overflow: auto;
        }

        .result-text-container {
          width: 100%;
          color: white;
          height: 55px;
          font-weight: bold;
          font-size: 15px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }

        .upper-container{
          width: 100%;
          display: block;
          height: 140px;
        }

        .header-card {
          color: white;
          font-weight: bold;
          float: left;
          text-align: center;
          height: 55px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }

        .header-card-dmoe {
          color: white;
          font-weight: 700;
          float: left;
          text-align: center;
          height: 15px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }
        .header-card-rmo {
          color: white;
          font-weight: 700;
          float: left;
          text-align: center;
          height: 25px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }

        .test-width {
          width: ${headerPx.test}px;
          margin: 0px 0px 0px 5px;
        }
        .mark-width {
          width: ${headerPx.mark}px;
          margin: 0px 0px 0px 5px;
        }
        .coeff-width {
          width: ${headerPx.coeff}px;
          margin: 0px 0px 0px 5px;
        }
        .credit-width {
          width: ${headerPx.credit}px;
          margin: 0px 0px 0px 5px;
        }
        .result-test {
          width: 85%;
          float: left;
          text-align: center;
        }

        .result-mark {
          width: 15%;
          float: left;
          text-align: center;
          display: ${subjectPx.disCoefTotal};
        }

        .subject-container {
          margin-left: 5px;
          width:100%;
        }

        .subject-name-coeff {
          width: 100%;
          font-weight: bold;
          float: left;
          margin-bottom: -10px;
        }
        .test-name-con {
          width: 100%;
          float: left;
          margin: -13px 0px -13px 0px;
          page-break-before: always
        }
        .subject-name {
          width:${subjectPx.subMark}px;
          float: left;
        }
        .subject-coeff {
          width ${subjectPx.subCoef}px;
          float: left;
          text-align: center;
        }

        .subject-mark-total {
          float: left;
          width: ${subjectPx.markTotal}px;
          margin-right: ${subjectPx.markTotal}px;
          text-align: center;
        }

        .subject-mark-coeff {
          float: left;
          width: ${subjectPx.credits}px;
          display: ${subjectPx.creditDisp};
          text-align: center;
        }

        .subject-total-mark {
          width: 100%;
          font-weight: bold;
          float: left;
          font-style: italic;
          font-size: 12px;
          margin-top: 5px;
        }
        .horizontal-line {
          width: ${headerPx.horiLine}%;
          float: left;
          border: 1px solid #686868 !important;
        }

        .continous-control-title-line {
          width: 90%;
          float: left;
          border-bottom: 2px solid #686868 !important;
        }

        .subject-mark-text {
          width: 100%;
          margin-top: -7px;
        }

        .subject-total-text {
          width: ${subjectPx.test}px;
          float: left;
        }

        .text-mark-row {
          float: left;
          width:100%;
        }
        .test-name {
          width: ${headerPx.test}px;
          float: left;
          margin: 0px 0px 0px 5px;
        }

        .test-mark-coeff{
          width: ${headerPx.coeff}px;
          float: left;
          margin: 0px 0px 0px 5px;
          text-align: center;
        }

        .test-mark-coeff-total {
          width: ${headerPx.coeff}px;
          float: left;
          margin: 0px 0px 0px 5px;
          text-align: center;
          display: inline-block;
        }

        .total-mark {
          margin:auto;
          margin-top: 15px;
          width: 30px;
          text-align: left;
        }

        .margin-top-remove {
          margin-top: -10px;
        }

        .margin-down-remove {
          margin-bottom: -20px;
        }

        .border-botttom td{
          border-bottom: 1px solid #686868 !important;
        }
        .right-border td {
          border-right: 0px solid #686868 !important;
        }
      </style>`;

    return pdfStyles;
  }

  private styleConditionComputeMain() {
    let headerPx = {
      test: 0,
      mark: 0,
      coeff: 0,
      credit: 0,
      horiLine: 0,
    };

    let subjectPx = {
      test: 0,
      markTotal: 0,
      credits: 0,
      creditDisp: 'none',
      subMark: 420,
      subCoef: 130,
      disCoefTotal: 'inline',
    };

    let retakeDisp = 'none';
    if (this.juryDescision === 'pass' || this.juryDescision === 'PASS') {
      headerPx = {
        test: 270,
        mark: 110,
        coeff: 110,
        credit: 70,
        horiLine: 85,
      };
      subjectPx = {
        test: 285,
        markTotal: 110,
        credits: 80,
        creditDisp: 'inline',
        subMark: 440,
        subCoef: 110,
        disCoefTotal: 'inline',
      };
    } else {
      headerPx = {
        test: 310,
        mark: 130,
        coeff: 130,
        credit: 0,
        horiLine: 98,
      };

      subjectPx = {
        test: 325,
        markTotal: 130,
        credits: 0,
        creditDisp: 'none',
        subMark: 510,
        subCoef: 120,
        disCoefTotal: 'none',
      };

      if (this.juryDescision === 'retaking' || this.juryDescision === 'retake') {
        retakeDisp = 'inline';
      }

      // if (this.hasJuryDecidedFlag) {
      //   retakeDisp = 'none';
      // }
    }
    const pdfStyles = `
      <style>
          html, body {
            height: 99%;
          }
        .retake-stamp {
          display: ${retakeDisp};
        }
        .main-container {
          width: 75%;
          margin: 2% auto;
          font-size: 13px;
          font-family: Roboto,sans-serif;
        }
        .main-container-rgp {
          width: 95%;
          margin: 1% auto;
          font-size: 11px;
          font-family: Roboto,sans-serif;
        }
        .tr-cpc td, .tr-cpc th {
          border: 1px solid black;
          padding: 3px;
        }
        .con-65 {
          width: 65%;
          float: left;
        }
        .second-head-cpc {
          text-align: center;
          margin: 20px 0;
          width: 100%;
          background-color: #d8d8d8!important;
          -webkit-print-color-adjust: exact;
          display: block;
          border: 1px solid black;
        }
        .gray-background {
          background-color: #d8d8d8!important;
          -webkit-print-color-adjust: exact;
        }
        .con-35 {
          width: 35%;
          float: left;
        }
        .stud-detail-para {
          margin: 5px 0 5px 30px
        }
        .result-container {
          width: 99%;
          padding: 10px 7px;
          margin: 10px 0 10px 0;
          overflow: auto;
        }
        .result-text-container {
          width: 100%;
          color: white;
          height: 55px;
          font-weight: bold;
          font-size: 15px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }
        .upper-container{
          width: 100%;
          display: block;
          height: 140px;
        }
        .header-card {
          color: white;
          font-weight: bold;
          float: left;
          text-align: center;
          height: 55px;
          background-color: #17365d!important;
          -webkit-print-color-adjust: exact;
        }
        .test-width {
          width: ${headerPx.test}px;
          margin: 0px 0px 0px 5px;
        }
        .mark-width {
          width: ${headerPx.mark}px;
          margin: 0px 0px 0px 5px;
        }
        .coeff-width {
          width: ${headerPx.coeff}px;
          margin: 0px 0px 0px 5px;
        }
        .credit-width {
          width: ${headerPx.credit}px;
          margin: 0px 0px 0px 5px;
        }
        .result-test {
          width: 85%;
          float: left;
          text-align: center;
        }
        .result-mark {
          width: 15%;
          float: left;
          text-align: center;
          display: ${subjectPx.disCoefTotal};
        }
        .subject-container {
          margin-left: 5px;
          width:100%;
        }
        .subject-name-coeff {
          width: 100%;
          font-weight: bold;
          float: left;
          margin-bottom: -10px;
        }
        .test-name-con {
          width: 100%;
          float: left;
          margin: -13px 0px -13px 0px;
          page-break-before: always
        }
        .subject-name {
          width:${subjectPx.subMark}px;
          float: left;
        }
        .subject-coeff {
          width ${subjectPx.subCoef}px;
          float: left;
          text-align: center;
        }
        .subject-mark-total {
          float: left;
          width: ${subjectPx.markTotal}px;
          margin-right: ${subjectPx.markTotal}px;
          text-align: center;
        }
        .subject-mark-coeff {
          float: left;
          width: ${subjectPx.credits}px;
          display: ${subjectPx.creditDisp};
          text-align: center;
        }
        .subject-total-mark {
          width: 100%;
          font-weight: bold;
          float: left;
          font-style: italic;
          font-size: 12px;
          margin-top: 5px;
        }
        .horizontal-line {
          width: ${headerPx.horiLine}%;
          float: left;
          border: 1px solid black;
        }
        .continous-control-title-line {
          width: 90%;
          float: left;
          border-bottom: "2px solid black";
        }
        .subject-mark-text {
          width: 100%;
          margin-top: -7px;
        }
        .subject-total-text {
          width: ${subjectPx.test}px;
          float: left;
        }
        .text-mark-row {
          float: left;
          width:100%;
        }
        .test-name {
          width: ${headerPx.test}px;
          float: left;
          margin: 0px 0px 0px 5px;
        }
        .test-mark-coeff{
          width: ${headerPx.coeff}px;
          float: left;
          margin: 0px 0px 0px 5px;
          text-align: center;
        }
        .test-mark-coeff-total {
          width: ${headerPx.coeff}px;
          float: left;
          margin: 0px 0px 0px 5px;
          text-align: center;
          display: inline-block;
        }
        .total-mark {
          margin:auto;
          margin-top: 15px;
          width: 30px;
          text-align: left;
        }
        .margin-top-remove {
          margin-top: -10px;
        }
        .margin-down-remove {
          margin-bottom: -20px;
        }
      </style>`;

    return pdfStyles;
  }

  private computeHeadPartPdf() {
    const scholarSeason = '2021'; // It is hardcoded at this point of time only. Later we use the scholar season given below
    // scholarSeason = this.student.scholarSeason ? this.student.scholarSeason.scholarseason : '';
    const colorHeader = `
    <div class="retake-stamp">
      <img style="width:70%; height: 70%" src="${ImageBase64.retakeStamp}">
    </div>
    <div class="main-container">
      <div class="upper-container">
        <div class="con-65">
          <p class="stud-detail-para">${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.STU_LNAME')}: <b>${
      this.student.lastName
    } </b></p>
          <p class="stud-detail-para">${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.STU_FNAME')}: <b>${
      this.student.firstName
    } </b></p>
          <p class="stud-detail-para">
          ${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.DOB')}: <b>${moment(this.student.dateOfBirth).format('DD-MM-YYYY')}</b></p>
          <p class="stud-detail-para">Section: <b>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.SECTION')}
          ${this.student.rncp_title ? this.student.rncp_title.longName : ''}</b></p>
          <p class="stud-detail-para">Session: <b>${scholarSeason}</b></p>
          <p class="stud-detail-para">Centre: <b>${this.student.school ? this.student.school.shortName : ''}</b>
          </p>
        </div>
        <div class="con-35">
          <img style="width:100%; height: 100%" src="${ImageBase64.c3instiLogo}">
        </div>
      </div>
      <div class="result-container">
        <div style="width:100%;height: 60px;">
          <span class="header-card test-width">
          <p style="padding-top: 8px;">${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.TEST')}</p></span>
          <span class="header-card mark-width">
          <p>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FINAL_MARKS')}</p></span>
          <span class="header-card coeff-width">
          <p style="padding-top: 8px;">COEFFICIENT</p></span>
          <span class="header-card credit-width">
          <p>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.CREDITS')}</p></span>
        </div>
        `;
    return colorHeader;
  }

  private computeFooterPartPdf(resultDetails) {
    if (this.juryDescision === '' || this.juryDescision === undefined) {
      this.juryDescision = resultDetails.result !== undefined ? resultDetails.result : '';
    }
    let pdffooter = `
        <div class="subject-total-mark" style="margin-left: 5px;">
        <div class="horizontal-line margin-down-remove"></div>
          <div class="subject-mark-text">
          <span class="subject-total-text"><p>
          ${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FINAL_SCORE')}</p></span>
          <span class="subject-mark-total"><p>${resultDetails.finalScore}</p></span>
          <span class="subject-mark-coeff"><p></p></span>
          </div>
        <div class="horizontal-line margin-top-remove"></div>
      </div>
        </div>
          <div class="result-container">
            <div class="result-text-container">
            <span class="result-test">
            <p style="padding-top: 0;">
            ${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.RESULT')}:
            ${this.translate.instant('FINAL_TRANSCRIPT.CERTIFICATION_STATUS.' + this.juryDescision.toUpperCase())}</p>
            </span>
            <span class="result-mark">
            </div>
          </div>
        </div>
        <div class="main-container">
        <span style="padding-left:20%"><img src="${ImageBase64.stamp}"></span>
        <span style="padding-left:20%"><img src="${ImageBase64.signature}"></span> </div>`;

    if (this.student.rncp_title.longName.includes('Responsable Marketing Opérationnel')) {
      pdffooter += `<div class="main-container" style="text-align: center; margin-left: 12.5%; font-size: 10px;">
            <span><b>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FOOTER_RMO.PROFESSIONAL_CERTIFICATION')}
            ${this.student.rncp_title ? this.student.rncp_title.long_name : ''}</b>
            </span><br>
            <span>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FOOTER_RMO.DESCRIPTION')}</span><br>
            <span>${
              this.student.rncp_title && this.student.rncp_title.certifier ? this.student.rncp_title.certifier.short_name + ' - ' : ''
            }</span>
            <span>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FOOTER_RMO.ADDRESS')}</span>
        </div>`;
    } else {
      pdffooter += `<div class="main-container" style="text-align: center; margin-left: 12.5%; font-size: 10px;">
            <span><b>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FOOTER.PROFESSIONAL_CERTIFICATION')}
            ${this.student.rncp_title ? this.student.rncp_title.rncp_level + ' : ' + this.student.rncp_title.long_name : ''}</b>
            </span><br>
            <span>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FOOTER.DESCRIPTION')}</span><br>
            <span>${
              this.student.rncp_title && this.student.rncp_title.certifier ? this.student.rncp_title.certifier.short_name + ' - ' : ''
            }</span>
            <span>${this.translate.instant('FINAL_TRANSCRIPT_RESULT_PDF.FOOTER.ADDRESS')}</span>
        </div>`;
    }

    return pdffooter;
  }

  private otherTestTitleRGP2019() {
    const html = `
      <div style="padding-top: 40px; display:block;width: 93%">
        <p><b>ÉPREUVES DE LA CERTIFICATION</b></p>
      </div>`;
    return html;
  }

  private getResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  private otherTestTitle() {
    const html = `
      <div style="padding-top: 10px; display:block; border-bottom: 1px solid black; width: 93%">
        <p><b>ÉPREUVES DE LA CERTIFICATION</b></p>
      </div>`;
    return html;
  }
}
