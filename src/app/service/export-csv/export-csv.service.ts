import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
declare var gapi: any;
@Injectable({
  providedIn: 'root',
})
export class ExportCsvService {
  constructor(public translate: TranslateService) {}

  createAndUpdateSpreadsheet(valueRange: any, title: any, sheetData: any) {

    const params = {
      // The ID of the spreadsheet to update data.
      spreadsheetId: '',
      // The A1 notation of the values to update.
      // e.g Sheet1!A4 : to start writing values in sheet from col 1 row 4
      range: '',
      valueInputOption: 'USER_ENTERED',
    };
    gapi.auth2.getAuthInstance().signIn();
    gapi.client.sheets.spreadsheets
      .create({
        properties: {
          title: title,
        },
        fields: 'spreadsheetId',
      })
      .then((response: any) => {
        params.spreadsheetId = response.result.spreadsheetId;
        const originObj = {
          // The ID of the spreadsheet containing the sheet to copy.
          spreadsheetId: sheetData.spreadsheetId,

          // The ID of the sheet to copy.
          sheetId: sheetData.sheetId,
        };
        const destObj = {
          destinationSpreadsheetId: response.result.spreadsheetId,
        };

        gapi.client.sheets.spreadsheets.sheets.copyTo(originObj, destObj).then(
          function (responsee: any) {
            const sheetTitle = responsee.result.title;
            params.range = sheetTitle + '!' + sheetData.range;
            gapi.client.sheets.spreadsheets.values.update(params, valueRange).then(
              function () {
                const deleteSheetParams = {
                  spreadsheetId: params.spreadsheetId,
                };
                const deleteSheetObj = {
                  requests: [
                    {
                      deleteSheet: {
                        sheetId: 0,
                      },
                    },
                  ],
                };

                gapi.client.sheets.spreadsheets.batchUpdate(deleteSheetParams, deleteSheetObj).then(
                  function () {
                    const url = 'https://docs.google.com/spreadsheets/d/' + params.spreadsheetId;
                    window.open(url);
                  },
                  function (reason: any) {
                    console.error('error: ' + reason.result.error.message);
                  },
                );
              },
              function (reason: any) {
                console.error('error: ' + reason.result.error.message);
              },
            );
          },
          function (reason: any) {
            console.error('error: ' + reason.result.error.message);
          },
        );
      });
  }

  executeSurveySheetOneTimes(valueRange: any, title: any, sheetData: any) {
    const params = {
      spreadsheetId: '',
      range: '',
      valueInputOption: 'RAW',
    };
    gapi.auth2.getAuthInstance().signIn();
    gapi.client.sheets.spreadsheets
      .create({
        properties: {
          title: title,
        },
        fields: 'spreadsheetId',
      })
      .then((response: any) => {
        params.spreadsheetId = response.result.spreadsheetId;
        const originObj = {
          spreadsheetId: sheetData.spreadsheetId,
          sheetId: sheetData.sheetId,
        };
        const destObj = {
          destinationSpreadsheetId: response.result.spreadsheetId,
        };
        gapi.client.sheets.spreadsheets.sheets.copyTo(originObj, destObj).then(
          function (responsee: any) {
            const sheetTitle = responsee.result.title;
            params.range = sheetTitle + '!' + sheetData.range;
            gapi.client.sheets.spreadsheets.values.update(params, valueRange).then(
              function (responsese: any) {
                const deleteSheetParams = {
                  spreadsheetId: params.spreadsheetId,
                };
                const deleteSheetObj = {
                  requests: [
                    {
                      deleteSheet: {
                        sheetId: 0,
                      },
                    },
                  ],
                };

                gapi.client.sheets.spreadsheets.batchUpdate(deleteSheetParams, deleteSheetObj).then(
                  function (responseses) {
                    const url = 'https://docs.google.com/spreadsheets/d/' + params.spreadsheetId;
                    window.open(url);
                  },
                  function (reason: any) {
                    console.error('error: ' + reason.result.error.message);
                  },
                );
              },
              function (reason: any) {
                console.error('error: ' + reason.result.error.message);
              },
            );
          },
          function (reason: any) {
            console.error('error: ' + reason.result.error.message);
          },
        );
      });
  }

  executeSurveySheetContinues(valueRange: any, title: any, sheetData: any, sheetName) {
    const currentLang = this.translate.currentLang;
    const params = {
      spreadsheetId: '',
      range: '',
      valueInputOption: 'RAW',
    };
    gapi.auth2.getAuthInstance().signIn();
    gapi.client.sheets.spreadsheets
      .create({
        properties: {
          title: title,
        },
        fields: 'spreadsheetId',
      })
      .then((response: any) => {

        params.spreadsheetId = response.result.spreadsheetId;
        const originObj = {
          spreadsheetId: sheetData.spreadsheetId,
          sheetId: sheetData.sheetId,
        };
        const destObj = {
          destinationSpreadsheetId: response.result.spreadsheetId,
        };
        const getSheet = {
          spreadsheetId: params.spreadsheetId,
        };
        const spreadSheetParams = {
          spreadsheetId: params.spreadsheetId,
        };
        gapi.client.sheets.spreadsheets.sheets.copyTo(originObj, destObj).then(
          function (responsee: any) {
            const deleteSheetObj = {
              requests: [
                {
                  deleteSheet: {
                    sheetId: 0,
                  },
                },
              ],
            };
            gapi.client.sheets.spreadsheets.batchUpdate(spreadSheetParams, deleteSheetObj).then(
              function (responseses) {
                gapi.client.sheets.spreadsheets.get(getSheet).then(function (ss) {

                  let sheetTitle = responsee.result.title;
                  params.range = sheetTitle + '!' + sheetData.range;
                  let dataSheet = {
                    values: valueRange.values[0],
                  };
                  if (ss && ss.result && ss.result.sheets && ss.result.sheets.length) {
                    const updateSheetName = {
                      requests: [
                        {
                          updateSheetProperties: {
                            properties: {
                              title: sheetName + '' + valueRange.values.length + '' + 0,
                              sheetId: ss.result.sheets[0].properties.sheetId,
                            },
                            fields: 'title',
                          },
                        },
                      ],
                    };
                    gapi.client.sheets.spreadsheets.batchUpdate(spreadSheetParams, updateSheetName).then(
                      function (s) {
                        if (valueRange.values && valueRange.values.length > 1) {
                          valueRange.values.forEach((arr, arrInx) => {
                            if (arrInx !== 0) {
                              // gapi.client.sheets.spreadsheets.sheets.copyTo(originObj, destObj).then(
                              //   function (copyTo: any) {
                              //     gapi.client.sheets.spreadsheets.get(getSheet).then(function (getSheets) {

                              //       const updateSheetProperties = {
                              //         requests: [
                              //           {
                              //             updateSheetProperties: {
                              //               properties: {
                              //                 title: sheetName + '' + valueRange.values.length + '' + arrInx,
                              //                 sheetId: getSheets.result.sheets[arrInx].properties.sheetId,
                              //               },
                              //               fields: 'title',
                              //             },
                              //           },
                              //         ],
                              //       };
                              //       gapi.client.sheets.spreadsheets
                              //         .batchUpdate(spreadSheetParams, updateSheetProperties)
                              //         .then(function (batchUpdate) {
                              //           dataSheet = {
                              //             values: arr,
                              //           };
                              //           sheetTitle = sheetName + '' + valueRange.values.length + '' + arrInx;
                              //           params.range = sheetTitle + '!' + sheetData.range;
                              //           gapi.client.sheets.spreadsheets.values.update(params, dataSheet).then(
                              //             function (valueUpdate: any) {
                              //               if (arrInx === (valueRange.values.length - 1)) {
                              //                 const url = 'https://docs.google.com/spreadsheets/d/' + params.spreadsheetId;
                              //                 window.open(url);
                              //               }
                              //             },
                              //             function (reason: any) {
                              //               console.error('error: ' + reason.result.error.message);
                              //             },
                              //           );
                              //         });
                              //     });
                              //   },
                              //   function (reason: any) {
                              //     console.error('error: ' + reason.result.error.message);
                              //   },
                              // );
                              const addSheet = {
                                requests: [
                                  {
                                    addSheet: {
                                      properties: {
                                        title: sheetName + '' + valueRange.values.length + '' + arrInx,
                                        sheetId: 10000000 + arrInx,
                                      },
                                    },
                                  },
                                ],
                              };
                              gapi.client.sheets.spreadsheets.batchUpdate(spreadSheetParams, addSheet).then(
                                function (newSheet) {
                                  const copySheet = {
                                    requests: [
                                      {
                                        copyPaste: {
                                          destination: {
                                            sheetId: 10000000 + arrInx,
                                          },
                                          source: {
                                            sheetId: ss.result.sheets[0].properties.sheetId,
                                          },
                                        },
                                      },
                                    ],
                                  };
                                  gapi.client.sheets.spreadsheets.batchUpdate(spreadSheetParams, copySheet).then(
                                    function (style) {
                                      dataSheet = {
                                        values: arr,
                                      };
                                      (sheetTitle = sheetName + '' + valueRange.values.length + '' + arrInx),
                                        (params.range = sheetTitle + '!' + sheetData.range);
                                      gapi.client.sheets.spreadsheets.values.update(params, dataSheet).then(
                                        function (valueUpdate: any) {
                                          if (arrInx === valueRange.values.length - 1) {
                                            const url = 'https://docs.google.com/spreadsheets/d/' + params.spreadsheetId;
                                            window.open(url);
                                          }
                                        },
                                        function (reason: any) {
                                          console.error('error: ' + reason.result.error.message);
                                        },
                                      );
                                    },
                                    function (reason: any) {
                                      console.error('error: ' + reason.result.error.message);
                                    },
                                  );
                                },
                                function (reason: any) {
                                  console.error('error: ' + reason.result.error.message);
                                },
                              );
                            } else {
                              dataSheet = {
                                values: arr,
                              };
                              (sheetTitle = sheetName + '' + valueRange.values.length + '' + arrInx),
                                (params.range = sheetTitle + '!' + sheetData.range);
                              gapi.client.sheets.spreadsheets.values.update(params, dataSheet).then(
                                function (valueUpdate: any) {
                                  if (valueRange.values.length === 1) {
                                    const url = 'https://docs.google.com/spreadsheets/d/' + params.spreadsheetId;
                                    window.open(url);
                                  }
                                },
                                function (reason: any) {
                                  console.error('error: ' + reason.result.error.message);
                                },
                              );
                            }
                          });
                        } else {
                          dataSheet = {
                            values: valueRange.values[0],
                          };
                          (sheetTitle = sheetName + '' + valueRange.values.length + '' + 0),
                            (params.range = sheetTitle + '!' + sheetData.range);
                          gapi.client.sheets.spreadsheets.values.update(params, dataSheet).then(
                            function (valueUpdate: any) {
                              const url = 'https://docs.google.com/spreadsheets/d/' + params.spreadsheetId;
                              window.open(url);
                            },
                            function (reason: any) {
                              console.error('error: ' + reason.result.error.message);
                            },
                          );
                        }
                      },
                      function (reason: any) {
                        console.error('error: ' + reason.result.error.message);
                      },
                    );
                  }
                });
              },
              function (reason: any) {
                console.error('error: ' + reason.result.error.message);
              },
            );
          },
          function (reason: any) {
            console.error('error: ' + reason.result.error.message);
          },
        );
      });
  }
}
