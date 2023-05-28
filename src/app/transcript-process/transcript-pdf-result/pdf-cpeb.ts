import { ImageBase64 } from './image-base64';
import * as moment from 'moment';
import * as _ from 'lodash';
import { DatePipe } from '@angular/common';

export class PdfCPEB {
  static datePipe = new DatePipe('en-US');
  static totalMaxPoint = 0;

  static RRH2020Id = '5d1dfaa62cf1f335ce12de34'; // id for title "RRH 2020"

  static MPIId = '5baa3316293eb71d0162c69e'; // id for title "MPI 2019"
  static MPI2020 = '5b69c87581935943d24d25c7'; // id for title "MPI 2020"
  static MPI2020E = '5da8900225a0ba09f97b16d9'; // id for title "MPI 2020 E"

  static MPIDigitalANSId = '5b3e174527a41d7a83376782'; // id for title "MPI Digital 1 ANS 2019"
  static MPIDIGITAL1AN2020 = '5c7e8e7803eff177b469409f'; // id for title "MPI DIGITAL 1 AN 2020"

  static transformDate(date) {
    return this.datePipe.transform(new Date(date), 'dd/MM/yyyy');
  }

  static getHeaderLogo(student) {
    if (
      student.rncp_title._id === this.RRH2020Id ||
      student.rncp_title._id === this.MPI2020 ||
      student.rncp_title._id === this.MPI2020E ||
      student.rncp_title._id === this.MPIDIGITAL1AN2020
    ) {
      return ImageBase64.eimpLogo;
    }
    return ImageBase64.cpebLogo;
  }

  static computeHeadPartPdf(student, result) {
    const colorHeader = `
    <div style="display: block; text-align: left; margin-top: 10px; margin-left: 20px;">
      <img style="max-height: 70px" src="${this.getLogo(student)}">
    </div>
    <div class="main-container-rgp">
    <div style="display: block;">
      <table style="width: 100%">
        <tr class="tr-cpc">
          <td >Certificateur</td>
          <td style="text-align: center">EIMP</td>
        </tr>
        <tr class="tr-cpc">
          <td>Lieu de préparation</td>
          <td style="text-align: center">${student.school.long_name}</td>
        </tr>
        <tr class="tr-cpc">
          <td>Année de promotion</td>
          <td style="text-align: center">2019 - 2020</td>
        </tr>
        <tr class="tr-cpc">
          <td>Nom et prénom de l'Apprenant</td>
          <td style="text-align: center">${student.first_name} ${student.last_name}</td>
        </tr>
        <tr class="tr-cpc">
          <td>Date et lieu de naissance</td>
          <td style="text-align: center">
             ${moment(this.transformMinusOne(result.student_id.date_of_birth)).format('DD-MM-YYYY')} - ${result.student_id.place_of_birth}
          </td>
        </tr>
      </table>
    `;
    return colorHeader;
  }

  static greyAreaTop(titleId) {
    let body = '';

    // CPEB 2019
    if (titleId === '5b69dc6f81935943d24d2696') {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">BULLETIN RECAPITULATIF</div>
        <div style="font-size: 12px;">Formation Chef(fe) de Projet E-business</div>
        <div style="font-size: 11px;">
            Certification professionnelle de niveau II(Fr) et de niveau 6(Eu) - Code NSF 320m - JO du 29 novembre 2014
        </div>
      </div>
    </div>
    `;
      // MPI 2019, MPI 2020, MPI 2020 "E"
    } else if (titleId === this.MPIId || titleId === this.MPI2020 || titleId === this.MPI2020E) {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">BULLETIN RECAPITULATIF</div>
        <div style="font-size: 12px;">Formation Manager de Projets Innovants</div>
        <div style="font-size: 11px;">
            Certification professionnelle de niveau I(Fr) et de niveau 7(Eu) - Code NSF 310m - JO du 21 avril 2017
        </div>
      </div>
    </div>
    `;
      // MPI Digital 1 ANS 2019
    } else if (titleId === this.MPIDigitalANSId || titleId === this.MPIDIGITAL1AN2020) {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">BULLETIN RECAPITULATIF</div>
        <div style="font-size: 12px;">Formation Manager de Projets Innovants</div>
        <div style="font-size: 11px;">
            Certification professionnelle de niveau I(Fr) et de niveau 7(Eu) - Code NSF 310m - JO du 21 avril 2017
        </div>
      </div>
    </div>
    `;
      // RRH 2019 or RRH 2020
    } else if (titleId === '5b69e61e81935943d24d26bb' || titleId === this.RRH2020Id) {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">BULLETIN RECAPITULATIF</div>
        <div style="font-size: 12px;">Formation Responsable Ressources Humaines</div>
        <div style="font-size: 11px;">
            Certification professionnelle de niveau II(Fr) et de niveau 6(Eu) - Code NSF 315m - JO du 7 juin 2016
        </div>
      </div>
    </div>
    `;
    }
    return body;
  }

  static greyAreaBottom(titleId) {
    let body = '';

    // CPEB 2019
    if (titleId === '5b69dc6f81935943d24d2696') {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">FICHE D'EVALUATION DE LA CERTIFICATION PROFESSIONNELLE</div>
        <div style="font-size: 12px;">Chef(fe) de Projet E-business</div>
        <div style="font-size: 11px;">Enregistrée au RNCP au niveau II(Fr) et de niveau 6(Eu) - Code NSF 320m - JO du 29 novembre 2014</div>
      </div>
    </div>
    `;
      // MPI 2019
    } else if (titleId === this.MPIId || titleId === this.MPI2020 || titleId === this.MPI2020E) {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">FICHE D'EVALUATION DE LA CERTIFICATION PROFESSIONNELLE</div>
        <div style="font-size: 12px;">Manager de Projets Innovants</div>
        <div style="font-size: 11px;">Enregistrée au RNCP au niveau I(Fr) et de niveau 7(Eu) - Code NSF 320m - JO du 21 avril 2017</div>
      </div>
    </div>
    `;
      // MPI Digital 1 ANS 2019
    } else if (titleId === this.MPIDigitalANSId || titleId === this.MPIDIGITAL1AN2020) {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">FICHE D'EVALUATION DE LA CERTIFICATION PROFESSIONNELLE</div>
        <div style="font-size: 12px;">Manager de Projets Innovants</div>
        <div style="font-size: 11px;">Enregistrée au RNCP au niveau I(Fr) et de niveau 7(Eu) - Code NSF 320m - JO du 21 avril 2017</div>
      </div>
    </div>
    `;
      // RRH 2019 or RRH 2020
    } else if (titleId === '5b69e61e81935943d24d26bb' || titleId === this.RRH2020Id) {
      body = `
      <div class="second-head-cpc">
        <div style="font-size: 14px;">FICHE D'EVALUATION DE LA CERTIFICATION PROFESSIONNELLE</div>
        <div style="font-size: 12px;">Responsable Ressources Humaines</div>
        <div style="font-size: 11px;">Enregistrée au RNCP au niveau II(Fr) et de niveau 6(Eu) - Code NSF 315m - JO du 7 juin 2016</div>
      </div>
    </div>
    `;
    }
    return body;
  }

  static getCharactersByIndex(index: number) {
    if (index === 1) {
      return 'A';
    } else if (index === 2) {
      return 'B';
    } else if (index === 3) {
      return 'C';
    } else if (index === 4) {
      return 'D';
    } else if (index === 5) {
      return 'E';
    } else if (index === 6) {
      return 'F';
    } else if (index === 7) {
      return 'G';
    } else if (index === 8) {
      return 'H';
    } else if (index === 9) {
      return 'I';
    } else if (index === 10) {
      return 'J';
    } else if (index === 11) {
      return 'K';
    }
  }

  static computeFirstBodyPart(expertise, student, result) {
    let totalMaxPointSur = 0;
    let body1 = `
    <table style="width: 100%">
      <tr class="tr-cpc">
        <th style="font-weight: 600; width: 70%">Compétences</th>
        <th style="font-weight: 600; width: 10%"> Notes<br/>(sur 20)</th>
        <th style="font-weight: 600; width: 10%">Points</th>
        <th style="font-weight: 600; width: 10%">Crédits ECTS</th>
      </tr>
    `;
    let body2 = '';
    let sur20Total = 0;
    let index = 0;
    let totalStr = '';
    let total_block_of_competence_condition_credit = 0;
    if (expertise && expertise.block_of_competence_conditions.length) {
      for (const expert of expertise) {
        if (expert.count_for_title_final_score) {
          total_block_of_competence_condition_credit +=
            result.block_of_competence_conditions[index].block_id.block_of_competence_condition_credit;
          let currentBlock = ``;

          if (
            result.block_of_competence_conditions[index].block_id.block_of_competence_condition_credit === 0 ||
            !result.block_of_competence_conditions[index].block_id.block_of_competence_condition_credit
          ) {
            currentBlock = `
            <div>
            <tr class="tr-cpc gray-background">
              <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(index + 1)} - ${
              expert.block_id.block_of_competence_condition
            }</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <div>`;
          } else {
            currentBlock = `
            <div>
            <tr class="tr-cpc gray-background">
              <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(index + 1)} - ${
              expert.block_id.block_of_competence_condition
            }</td>
              <td></td>
              <td></td>
              <td style="background-color: #fff!important; text-align: center">${
                result.block_of_competence_conditions[index].block_id.block_of_competence_condition_credit
              }</td>
            </tr>
            <div>`;
          }

          for (const subject of expert.subjects) {
            sur20Total = sur20Total + Number(subject.total_mark);
            for (const test of subject.evaluations) {
              const tempSubject1 = `<tr class="tr-cpc">
              <td style="text-align: right">${test.evaluation_id.evaluation}</td>
              <td style="text-align: right">${test.total_mark}</td>
              <td class="gray-background"></td>
              <td class="gray-background"></td>
            </tr>`;
              currentBlock += tempSubject1;
            }
          }

          const tempBody3 = `
          <tr class="tr-cpc">
            <td style="text-align: left">Moyenne</td>
            <td style="text-align: right">${result.block_of_competence_conditions[index].total_mark}</td>
            <td class="gray-background"></td>
            <td class="gray-background"></td>
          </tr>
          <tr class="tr-cpc">
            <td style="text-align: left">
             Total points du bloc de compétence sur ${result.block_of_competence_conditions[index].max_point}
            </td>
            <td class="gray-background"></td>
            <td style="text-align: right">${result.block_of_competence_conditions[index].total_point}</td>
            <td class="gray-background"></td>
          </tr>`;
          totalMaxPointSur = totalMaxPointSur + expert.max_point;
          currentBlock += tempBody3;
          body2 += currentBlock;
          if (index === expertise.length - 1) {
            totalStr = totalStr + this.getCharactersByIndex(index + 1);
          } else {
            totalStr = totalStr + this.getCharactersByIndex(index + 1) + '+';
          }
          index++;
        }
      }
    }

    // Remove + if appear on last index its horror
    const lastWord = totalStr.substring(totalStr.length - 1);
    if (lastWord === '+') {
      totalStr = totalStr.slice(0, -1);
    }

    const body3 = `</table>
      <table style="width: 100%; margin: 5px 0;">
      <tr class="tr-cpc gray-background">
        <th style="width: 70%">SCORE</th>
        <th style="color: #d8d8d8; width: 10%"></th>
        <th style="color: #d8d8d8; width: 10%"></th>
        <th style="width: 10%; background-color: #fff!important;">${total_block_of_competence_condition_credit}</th>
      </tr>

      <div>
        <tr class="tr-cpc">
          <td>Total ${totalStr} sur 20</td>
          <td style="text-align: center">${result.total_mark ? result.total_mark : ''}</td>
          <td class="gray-background"></td>
          <td class="gray-background"></td>
        </tr>
        <tr class="tr-cpc">
          <td>Total ${totalStr} sur ${totalMaxPointSur}</td>
          <td class="gray-background"></td>
          <td style="text-align: center">${result.total_point ? result.total_point : ''}</td>
          <td class="gray-background"></td>
        </tr>
      </div>
    </table>`;
    const body4 = `<div style="margin-top: 20px; page-break-after: always;">
      <div style="display: block; text-align: right; margin-top: 20px">
        <img style="max-height: 80px" src="${
          // dont show signature if title RRH 2020
          student.rncp_title._id === this.RRH2020Id ||
          student.rncp_title._id === this.MPI2020 ||
          student.rncp_title._id === this.MPI2020E ||
          student.rncp_title._id === this.MPIDIGITAL1AN2020
            ? ''
            : ImageBase64.cpebSign
        }">
      </div>
      ${this.computeFooterPart(student)}
    </div>`;
    body1 += body2;
    body1 += body3;
    body1 += body4;
    return body1;
  }

  static getValidateStatus(maxPoint, index, titleId) {
    let status = '';

    // CPEB 2019 & RRH 2019 & RRH 2020
    if (titleId === '5b69dc6f81935943d24d2696' || titleId === '5b69e61e81935943d24d26bb' || titleId === this.RRH2020Id) {
      if (index === 1) {
        status = 'validé';
      } else if (index === 2) {
        status = maxPoint >= 24 ? 'validé' : 'Non validé';
      } else if (index === 3) {
        status = maxPoint >= 20 ? 'validé' : 'Non validé';
      } else if (index === 4) {
        status = maxPoint >= 30 ? 'validé' : 'Non validé';
      }
      // MPI 2019
    } else if (titleId === this.MPIId || titleId === this.MPI2020 || titleId === this.MPI2020E) {
      if (index === 1) {
        status = 'validé';
      } else if (index === 2) {
        status = maxPoint >= 24 ? 'validé' : 'Non validé';
      } else if (index === 3) {
        status = maxPoint >= 32 ? 'validé' : 'Non validé';
      } else if (index === 4) {
        status = maxPoint >= 50 ? 'validé' : 'Non validé';
      }
      // MPI Digital 1 ANS 2019
    } else if (titleId === this.MPIDigitalANSId || titleId === this.MPIDIGITAL1AN2020) {
      if (index === 1) {
        status = 'validé';
      } else if (index === 2) {
        status = maxPoint >= 16 ? 'validé' : 'Non validé';
      } else if (index === 3) {
        status = maxPoint >= 5 ? 'validé' : 'Non validé';
      } else if (index === 4) {
        status = maxPoint >= 70 ? 'validé' : 'Non validé';
      }
    }

    return status;
  }

  static computeSecondBodyPart(expertise, result, titleId, pdfData) {
    let body2 = `
    <table style="width: 100%; margin-bottom: 10px;">
      <tr class="tr-cpc">
        <td width="30%" style="text-align: center">Blocs de compétences</td>
        <td width="25%" style="text-align: center">Objectifs</td>
        <td width="20%" style="text-align: center">Modalités d'évaluation</td>
        <td width="10%" style="text-align: center">Nb de points</td>
        <td width="15%" style="text-align: center">Validation*</td>
      </tr>
      <tr class="tr-cpc"><td></td><td></td><td></td><td></td><td></td></tr>
      <div>
        `;

    let totalMarks = 0;
    let totalStr = '';
    expertise.block_of_competence_conditions.forEach((expertiseObj, index) => {
      if (expertiseObj.count_for_title_final_score) {
        body2 =
          body2 +
          `<tr class="tr-cpc">
         <td style="font-weight: 600">${this.getCharactersByIndex(index + 1)} - ${expertiseObj.block_id.block_of_competence_condition}</td>
        <td>${expertiseObj.description}</td>
        <td style="text-align: center">${expertiseObj && expertiseObj.methodOfEvaluation ? expertiseObj.methodOfEvaluation : ''}</td>
        <td style="text-align: center">${expertiseObj.total_point}</td>
        <td style="text-align: center">${this.getValidateStatus(expertiseObj.total_point, index + 1, titleId)}</td>
        </tr>`;

        totalMarks = totalMarks + Number(expertiseObj.max_point);
        if (index === expertise.block_of_competence_conditions.length - 1) {
          totalStr = totalStr + this.getCharactersByIndex(index + 1);
        } else {
          totalStr = totalStr + this.getCharactersByIndex(index + 1) + '+';
        }
      }
    });

    // Remove + if appear on last index its horror
    const lastWord = totalStr.substring(totalStr.length - 1);
    if (lastWord === '+') {
      totalStr = totalStr.slice(0, -1);
    }

    let passThreshold = 100;

    // MPI 2019
    if (titleId === this.MPIId || titleId === this.MPI2020 || titleId === this.MPI2020E) {
      passThreshold = 150;
    }

    body2 =
      body2 +
      `
        <tr class="tr-cpc"><td></td><td></td><td></td><td></td><td></td></tr>
      </div>
      <tr class="tr-cpc">
        <td style="font-weight: 600">TOTAL ${totalStr}</td>
        <td></td>
        <td style="text-align: center; font-weight: 600">${totalMarks}</td>
        <td style="text-align: center;">${result.total_point ? result.total_point : ''}</td>
        <td style="text-align: center;">${Number(result.total_point) >= passThreshold ? 'validé' : 'Non validé'}</td>
      </tr>
    </table>

    <table style="width: 100%; margin-bottom: 30px;">
      <tr>
        <td width="30%"></td>
        <td width="25%"></td>
        <td width="20%" style="border: 1px solid black">Décision du Jury</td>
        <td width="25%" style="text-align: center; border: 1px solid black">${pdfData.parameter_obtained_id.condition_name}</td>
      </tr>
    </table>

    <div style="width: 100%">
      <div style="width: 65%; display: inline-block;">
        <span style="font-weight: 600; display: block; margin-bottom: 10px">
          *Rappel des conditions cumulatives pour l'attribution de la Certification professionnelle :
        </span>`;

    // CPEB 2019
    if (titleId === '5b69dc6f81935943d24d2696') {
      body2 =
        body2 +
        `
        <span style="display: block">
          B ≥ à 24/60 (8/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          C>= à 20/50 (8/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          D>= 30/60 (10/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          TOTAL A+B+C+D ≥ à 100/200 (10/20)
        </span>`;
      // MPI 2019
    } else if (titleId === this.MPIId || titleId === this.MPI2020 || titleId === this.MPI2020E) {
      body2 =
        body2 +
        `
        <span style="display: block">
          B ≥ à 24/60 (8/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          C>= à 32/80 (8/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          Epreuve « Production et soutenance d’un Projet
        </span>
        <span style="display: block">
          Professionnel Innovant » >= 50/100 (10/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          TOTAL A+B+C+D ≥ à 150/300 (10/20)
        </span>`;
      // MPI Digital 1 ANS 2019
    } else if (titleId === this.MPIDigitalANSId || titleId === this.MPIDIGITAL1AN2020) {
      body2 =
        body2 +
        `
        <span style="display: block">
          B ≥ à 16/40 (8/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
         « Projet professionnel Innovant (Ecrit + Oral) >= 70/140 (10/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          TOTAL A+B+C+D ≥ à 100/200 (10/20)
        </span>`;
      // RRH 2019 or RRH 2020
    } else if (titleId === '5b69e61e81935943d24d26bb' || titleId === this.RRH2020Id) {
      body2 =
        body2 +
        `<span style="display: block">
          B ≥ à 24/60 (8/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          C>= à 20/50 (8/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          D>= à 30/60 (10/20)
        </span>
        <span style="display: block">
          et
        </span>
        <span style="display: block">
          TOTAL A+B+C+D ≥ à 100/200 (10/20)
        </span>`;
    }

    body2 =
      body2 +
      `
      </div>
      <div style="width: 34%; display: inline-block;">
        <div style="display: block; text-align: center; margin-top: 20px">
          <img style="max-height: 80px" src="${
            // dont show signature if title RRH 2020
            titleId === this.RRH2020Id || titleId === this.MPI2020 || titleId === this.MPI2020E || titleId === this.MPIDIGITAL1AN2020
              ? ''
              : ImageBase64.cpebSign
          }">
        </div>
      </div>
    </div>
    `;

    return body2;
  }

  static computeFooterPart(student) {
    let footer;

    if (
      student.rncp_title._id === this.RRH2020Id ||
      student.rncp_title._id === this.MPI2020 ||
      student.rncp_title._id === this.MPI2020E ||
      student.rncp_title._id === this.MPIDIGITAL1AN2020
    ) {
      footer = `
      <div style="width: 90%; font-size: 10px; margin: 5px auto 30px; text-align: center; position: fixed; bottom: 0">
        <div style="display: block">
          ECOLE INTERNATIONALE DE MANAGEMENT DE PARIS - EIMP
        </div>
        <div style="display: block">
          SAS au capital variable de 1 000 €
        </div>
        <div style="display: block">
          Siret : 493 862 080 00048
        </div>
        <div style="display: block">
          Siège social : 55 avenue Hoche 75008 PARIS
        </div>
      </div>
      `;
    } else {
      footer = `
      <div style="width: 90%; font-size: 10px; margin: 5px auto 30px; text-align: center; position: fixed; bottom: 0">
        <div style="display: block">
          EIMP - Ecole Internationale de Management de Paris
        </div>
        <div style="display: block">
          96, rue Orfila 75020 PARIS - France
        </div>
        <div style="display: block">
          Tel: +33 1 58 53 56 75 - RC: PARIS 493 862 080
        </div>
        <div style="display: block">
          www.eimparis.com
        </div>
      </div>
      `;
    }

    return footer;
  }
  static transformMinusOne(date: any): any {
    const originalDate = String(date);

    if (originalDate.length === 8) {
      // convert from yyyymmdd to date format accepted by mat datepicker
      const year: number = +originalDate.substring(0, 4);
      const month: number = +originalDate.substring(4, 6);
      const day: number = +originalDate.substring(6, 8);
      return new Date(year, month, day);
    } else if (originalDate.includes('/')) {
      // convert from mm/dd/yyyy to date format accepted by mat datepicker
      const dateStringArray = originalDate.split('/');
      const year = +dateStringArray[2];
      const month = +dateStringArray[0] - 1;
      const day = +dateStringArray[1];
      return new Date(year, month, day);
    } else {
      return date;
    }
  }

  static getLogo(studentData) {
    const c3InstituteID = '596c7111bbd70454dc9c287d';
    const cesacomID = '5b3e06e727a41d7a83376066';
    const eimpID = '5aaa688b6a853f0fddecc061';
    const h3CampusID = '5b791476d9dfe135d5461144';
    const hitemaID = '598289e7528f24319d46251c';
    const imcpID = '5b3b7be2e9a880184ecc5c72';
    const initiativeID = '5b69eeba81935943d24d26e8';
    const instaID = '5b3cdb6476a39548534c757a';
    const iscgID = '59828bab528f24319d462520';
    const manitudeID = '5da9895b25a0ba09f97b596e';
    const modspeID = '5bec684507f85336b6d61417';
    const sogesteEssccotID = '5c503955eb9f9272f18c64be';
    const zettabyteID = '601e5fe97d0ceb4c01c9a181';
    if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === sogesteEssccotID
    ) {

      // return ImageBase64.rgpLogo;
      return ImageBase64.sogesteLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === c3InstituteID
    ) {
      return ImageBase64.c3InstituteLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === cesacomID
    ) {
      return ImageBase64.cesacomLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === eimpID
    ) {
      return ImageBase64.eimpLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === h3CampusID
    ) {
      return ImageBase64.h3CampusLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === hitemaID
    ) {
      return ImageBase64.h3hitemaLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === imcpID
    ) {
      return ImageBase64.imcpLogoNew;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === initiativeID
    ) {
      return ImageBase64.initiativesLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === instaID
    ) {
      return ImageBase64.instaLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === iscgID
    ) {
      return ImageBase64.iscgLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === manitudeID
    ) {
      return ImageBase64.manitudeLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === modspeID
    ) {
      return ImageBase64.modspeLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === zettabyteID
    ) {
      return ImageBase64.zettabyteLogo;
    } else {
      return ImageBase64.whiteBg;
    }
    // return ImageBase64.rgpLogo;

    // if (studentData && studentData.rncp_title && studentData.rncp_title.certifier && studentData.rncp_title.certifier.logo) {
    //   // ************** Certifier Logo is here, but only link
    //   const url = `${environment.apiUrl}/fileuploads/${studentData.rncp_title.certifier.logo}`.replace('/graphql', '');
    //   return url;
    // } else {
    //   return ImageBase64.rgpLogo;
    // }
  }
}
