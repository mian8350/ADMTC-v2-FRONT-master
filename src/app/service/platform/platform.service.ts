import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {

  constructor(private httpClient: HttpClient) {}

  @Cacheable()
  getScholerSeason(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/scholer-season.json');
  }

  @Cacheable()
  getUserType(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/user-type.json');
  }

  @Cacheable()
  getCalendarSteps(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/calendar-steps.json');
  }

}