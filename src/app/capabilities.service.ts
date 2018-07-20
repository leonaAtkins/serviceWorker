/**
 * Created by leona.atkins on 19/07/2018.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Capabilities } from './capabilities';
import { map, catchError } from "rxjs/operators";

@Injectable()
export class CapabilitiesService {

  constructor(private http: HttpClient) {}

  /**
   * HTTP call to get the data.
   * @returns {Observable<any>}
   */
  getCapabilities(): Observable<any> {
    let capabilitiesURL = '/public/data/LayerCache/GetCapabilities/Item/Observation?cb=' + Math.floor(Math.random() * 100000000000000);
    //let capabilitiesURL = '//datapoint.metoffice.gov.uk/public/data/layer/wxobs/all/json/capabilities?key=c70d5f37-796a-47a8-82a2-9207849f6625&cb=' + Math.floor(Math.random() * 100000000000000);
    return this.http.get(capabilitiesURL)
      .pipe(
        map(res => res),
        catchError(this.handleError)
      );
  }
  /**
   * Log and return any error condition.
   * @param error
   * @returns {any}
   */
  private handleError(error: any) {
    console.error(error.message);
    return Observable.throw(error);
  }
}

