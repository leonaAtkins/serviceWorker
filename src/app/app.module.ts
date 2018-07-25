import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {MoMapModule, LayerModule} from '@mo/map';
import {HttpClientModule} from "@angular/common/http";
import {CapabilitiesService} from "./capabilities.service";
import {FormsModule} from "@angular/forms";
import { MatSnackBarModule } from '@angular/material';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MoMapModule,
    LayerModule,
    FormsModule,
    HttpClientModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    //environment.production ? ServiceWorkerModule.register('ngsw-worker.js') : []
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [CapabilitiesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
