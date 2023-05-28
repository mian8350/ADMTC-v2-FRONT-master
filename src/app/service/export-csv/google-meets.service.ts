import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { JuryOrganizationService } from '../jury-organization/jury-organization.service';
declare var gapi: any;
@Injectable({
  providedIn: 'root',
})
export class GoogleMeetService {
  private subs = new SubSink();
  constructor(private translate: TranslateService, private juryService: JuryOrganizationService) {}

  createAndUpdateMeet(data) {
    const event = {
      summary: data.jury_organization_id.name,
      location: 'Europe/Paris',
      description: this.translate.instant('Launch and Complete Session'),
      conferenceData: {
        createRequest: {
          requestId: '7qxalsvy0e',
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      start: {
        dateTime: data.time.date,
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: data.time.date.replace('00:00:00', '23:59:59'),
        timeZone: 'Europe/Paris',
      },
      recurrence: ['RRULE:FREQ=DAILY;COUNT=2'],
      attendees: [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };
    gapi.auth2.getAuthInstance().signIn();
    /* Ready. Make a call to gapi.auth2.init or some other API */

    if (gapi.auth2.getAuthInstance()) {
      const dataAuth = gapi.auth2.getAuthInstance();
      let calendarId;
      if (dataAuth && dataAuth.currentUser && dataAuth.currentUser.ee && dataAuth.currentUser.ee.Ys && dataAuth.currentUser.ee.Ys.It) {
        calendarId = dataAuth.currentUser.ee.Ys.It;
      } else if (dataAuth && dataAuth.currentUser && dataAuth.currentUser.ee && dataAuth.currentUser.ee.dt && dataAuth.currentUser.ee.dt.Nt) {
        calendarId = dataAuth.currentUser.ee.dt.Nt;
      }
      if (calendarId) {
        const request = gapi.client.calendar.events
          .insert({
            calendarId: calendarId,
            maxAttendees: 100,
            resource: event,
            sendNotifications: true,
            sendUpdates: 'all',
            supportsAttachments: true,
            conferenceDataVersion: 1,
          })
          .then((response: any) => {
            this.subs.sink = this.juryService
              .saveGoogleMeetURL(data._id, data.students.student_id._id, response.result.hangoutLink)
              .subscribe((resp) => {
                if (resp) {

                  window.open(response.result.hangoutLink);
                }
              });
          });
      }
    }
  }
}
