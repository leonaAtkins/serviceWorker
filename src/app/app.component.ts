import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import {interval} from "rxjs/index";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(updates: SwUpdate) {
    updates.available.subscribe(event => {
      console.log('current version is', event.current);
      console.log('available version is', event.available);
      this.setUpdateFlag('Update available');
    });
    updates.activated.subscribe(event => {
      console.log('old version was', event.previous);
      console.log('new version is', event.current);
    });
    interval(30 * 1000).subscribe(() => {
        updates.checkForUpdate();
        this.updateOnlineStatus();
    });
  }

  title = 'Service Worker Demo App';
  onlineFlag = navigator.onLine ? "Online" : "Offline";
  updateFlag = 'No updates';

  setUpdateFlag(text: string){
    this.updateFlag = text;
  }
  updateOnlineStatus(){
    this.onlineFlag = navigator.onLine ? "OnLine" : "Offline";
  }
}
