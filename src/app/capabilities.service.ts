/**
 * Created by leona.atkins on 19/07/2018.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { NgxXml2jsonService } from 'ngx-xml2json';
import { Capabilities } from './capabilities';
import { map, catchError } from "rxjs/operators";

@Injectable()
export class CapabilitiesService {

  constructor(private http: HttpClient,
              private ngxXml2jsonService: NgxXml2jsonService) {}

  /**
   * HTTP call to get the data.
   * @returns {Observable<any>}
   */
  getCapabilities(): Observable<any> {
    //let capabilitiesURL = '//wwwpre.metoffice.gov.uk/public/data/LayerCache/GetCapabilities/Item/Observation?cb=' + Math.floor(Math.random() * 100000000000000);
    //let capabilitiesURL = '//datapoint.metoffice.gov.uk/public/data/layer/wxobs/all/json/capabilities?key=c70d5f37-796a-47a8-82a2-9207849f6625&cb=' + Math.floor(Math.random() * 100000000000000);
    let capabilitiesURL = '../assets/data/Observation.xml';
    return this.http.get(capabilitiesURL, {responseType: 'text'})
      .pipe(
        map(res => {
          // datapoint
          //return res
          const parser = new DOMParser();
          const xml = parser.parseFromString(res, 'text/xml');
          return this.ngxXml2jsonService.xmlToJson(xml);
        }),
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
    return throwError(error);
  }
}

