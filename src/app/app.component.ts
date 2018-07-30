import {Component, OnInit, ViewChild} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';
import {interval} from "rxjs/index";
import {MoMapDirective} from '@mo/map';
import {Capabilities} from './capabilities';
import {CapabilitiesService} from "./capabilities.service";
import { MatSnackBar } from '@angular/material';

declare const L: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private snackbar: MatSnackBar,
    private updates: SwUpdate,
    private capabilitiesService: CapabilitiesService,
  ) {}

  @ViewChild(MoMapDirective) private mapDirective: MoMapDirective;

  /**
   * On App start
   */
  ngOnInit() {
    this.updates.available.subscribe(event => {
      console.info('current version is', event.current);
      console.info('available version is', event.available);
      console.info('Update Detected, reloading capabilities');
      this.getTimes();
      this.setUpdateFlag('Update available');
      this.showUpdateBar('Updates available.');
    });
    this.updates.activated.subscribe(event => {
      console.info('old version was', event.previous);
      console.info('new version is', event.current);
      this.setUpdateFlag('New version available');
    });
    if (this.updates.isEnabled) {
      interval(30 * 1000).subscribe(() => {
        this.updates.checkForUpdate();
        this.updateOnlineStatus();
        console.info('checking for updates ',new Date().toTimeString());
      });
    }
  }

  showUpdateBar(msg){
    const bar = this.snackbar.open(msg, 'Reload?');
    bar
      .onAction()
      .subscribe(() =>{
        window.location.reload();
      });
  };

  /**
   * hock to load map once on view
   */
  ngAfterViewInit(): void {
    this.map = this.mapDirective.map;
    this.getTimes();
  }

  title = 'Service Worker Demo App';
  onlineFlag = 'Online';
  updateFlag = 'No updates';
  layerUrl = '';
  private map: any;
  private layerTimes;
  private a = 0;
  private currentLayer;
  private play = false;
  private animate;
  public layerName;
  public layerTime;
  private loading = false;
  public playLabel = "Play |>";
  public weatherLayers = [];
  public weatherPeriods = [
    {'id': 0, 'name': 'Observation'},
    {'id': 1, 'name': 'Forecast'}
  ];
  public selectedValue = 0;
  public selectedPeriodIndex = 0;
  public selectedPeriod = 'Observation';
  private selectedLayer:any = {};
  private APIKEY = 'c70d5f37-796a-47a8-82a2-9207849f6625&cb=';

  /**
   * Set update flags
   * @param text
   */
  setUpdateFlag(text: string){
    this.updateFlag = text;
  }

  /**
   * setup update status
   */
  updateOnlineStatus(){
    this.onlineFlag = navigator.onLine ? "Online" : "Offline";
  }

  /**
   * Load layer at given time.
   * @param time
   */
  updateLayer(time){
    let layerTag;
    let previousLayer = this.currentLayer;
    let layerTime;
    let style = "";
    this.loading = true;
    if (this.selectedPeriod === 'Forecast'){
      let currentService:any = {};
      if (Array.isArray(this.selectedLayer.service)) {
        for (let service of this.selectedLayer.service) {
          for (let times of service.Timesteps.Timestep) {
            if (times === time) {
              currentService = service;
              break;
            }
          }
        }
      } else {
        currentService = this.selectedLayer.service;
      }
      if (typeof currentService.Style !== 'undefined') {
        style = currentService.Style;
      }
      this.layerName = currentService.LayerName;
      this.layerUrl = "//" + this.weatherLayers[this.selectedValue].url.split('://')[1]
          //         http://wwwpre.metoffice.gov.uk/public/data/LayerCache/{Service}/ItemBbox/{LayerName}/{X}/{Y}/{Z}/{ImageFormat}?RUN={DefaultTime}Z&FORECAST=%2B{Timestep}&styles=chosenstyle
          //this.layerUrl = '//www.metoffice.gov.uk/public/data/LayerCache/{Service}/ItemBbox/{LayerName}/{X}/{Y}/{Z}/{ImageFormat}?TIME={Time}Z'
          .replace('{LayerName}', currentService.LayerName)
          .replace('{Service}', currentService['@attributes'].name) // public
          .replace('{ImageFormat}', 'png8bit')
          .replace('{DefaultTime}', currentService.Timesteps['@attributes'].defaultTime)
          .replace('{Timestep}', encodeURI(time))
          .replace('{X}', '{x}') //public
          .replace('{Y}', '{y}') //public
          .replace('{Z}', '{z}') //public
          .replace('chosenstyle', style);
      //.replace('{key}',this.APIKEY); // datapoint
      layerTime = new Date(currentService.Timesteps['@attributes'].defaultTime+"Z");
      layerTime = new Date(layerTime.toUTCString());
      layerTime.setTime(layerTime.getTime() + (time*60*60*1000));
      layerTime = layerTime.toISOString().split('.000')[0];
      layerTag = currentService.LayerName + '|' + layerTime;
    } else {
      // obs!
      layerTag = this.layerName+'|'+time;
      if (typeof this.selectedLayer.service.Style !== 'undefined'){
        style = this.selectedLayer.service.Style;
      }
      this.layerUrl = "//" + this.weatherLayers[this.selectedValue].url.split('://')[1]
        //this.layerUrl = '//www.metoffice.gov.uk/public/data/LayerCache/{Service}/ItemBbox/{LayerName}/{X}/{Y}/{Z}/{ImageFormat}?TIME={Time}Z'
          .replace('{LayerName}', this.selectedLayer.service.LayerName)
          .replace('{Service}', this.selectedLayer.service['@attributes'].name) // public
          .replace('{ImageFormat}', 'png8bit')
          .replace('{Time}', encodeURI(time))
          .replace('{X}', '{x}') //public
          .replace('{Y}', '{y}') //public
          .replace('{Z}', '{z}') //public
          .replace('chosenstyle', style);
      //.replace('{key}',this.APIKEY); // datapoint
      layerTime = time;
    }
    this.currentLayer = L.tileLayer(this.layerUrl, {layerType:'WeatherLayer', layerName: layerTag});
    this.currentLayer.setOpacity(0);
    // datapoint
      //const bounds = [[49.6, -10.5], [59.2, 2.2]];
      //this.currentLayer = L.imageOverlay(this.layerUrl, bounds, {layerType:'WeatherLayer', layerName: layerTag});
      let regionLayer;
      this.map.addLayer(this.currentLayer, {layerName: layerTag});
      this.currentLayer.on("load",function(event) {
        // add delay as load event premature.
        setTimeout( () => {
          this._map.eachLayer(function (layer) {
            if (layer._url.indexOf('regions') > -1){
              regionLayer = layer;
            }
            if (typeof layer.options.layerType !== 'undefined') {
              if (layer.options.layerType === 'WeatherLayer') {
                if (event.target.options.layerName === layer.options.layerName) {
                  layer.setOpacity(1);
                  regionLayer.bringToFront();
                } else {
                  layer.setOpacity(0)
                }
              }
            }
          });
          if (typeof previousLayer !== 'undefined') {
            this._map.removeLayer(previousLayer);
          }
        }, 200);
      });
      this.layerTime = layerTime;
  }

  /**
   * Change current layer type
   * @param event
   */
  changeLayer(event){
    this.selectedValue = event.target.selectedIndex;
    this.getTimes();
    this.removeLayers();
  }

  changePeriod(){
    this.selectedPeriod = this.weatherPeriods[this.selectedPeriodIndex].name;
    this.weatherLayers = [];
    this.getTimes();
    this.removeLayers();
  }

  /**
   * Remove layers from map
   */
  removeLayers(){
    let map = this.map;
    map.eachLayer(function(layer){
      if (typeof layer.options.layerType !== 'undefined'){
        if (layer.options.layerType === 'WeatherLayer') {
          map.removeLayer(layer);
        }
      }
    });
  }

  /**
   * Hide layers on the map.
   */
  hideLayers(){
    let map = this.map;
    map.eachLayer(function(layer){
      if (typeof layer.options.layerType !== 'undefined'){
        if (layer.options.layerType === 'WeatherLayer') {
          layer.setOpacity(0)
        }
      }
    });
  }

  /**
   * Get layer times.
   */
  getTimes() {
    let wasPlaying = this.play;
    if (this.play) {
      this.playStop();
    }
    this.weatherLayers = [];
    this.capabilitiesService.getCapabilities(this.selectedPeriod)
        .subscribe(data => {
          if (this.selectedPeriod === 'Forecast'){
            this.processFcstTimes(data);
          } else {
            this.processObsTimes(data);
          }
        },(error) => {
          wasPlaying = false;
          this.showUpdateBar('Somethings gone wrong.');
          console.error('Somethings gone wrong', error)
        }, () =>{
        if (wasPlaying) {
          this.playStop();
        }
      })
    }

    processObsTimes(data){
      let result:Capabilities = data; // Data Point.
      for(let l=0;l<result.Layers.Layer.length; l++ ){
        // public/pre
         this.weatherLayers.push({id:l,name:result.Layers.Layer[l]['@attributes'].displayName, service:result.Layers.Layer[l].Service, url:result.Layers.BaseUrl});
        // datapoint
        //this.weatherLayers.push({id:l,name:result.Layers.Layer[l]['@displayName'], service:result.Layers.Layer[l].Service, url:result.Layers.BaseUrl['$']});
      }
      this.selectedLayer = this.weatherLayers[this.selectedValue];
      if (typeof this.selectedLayer.service.Times !== 'undefined') {
        this.layerTimes = this.selectedLayer.service.Times.Time.reverse();
        this.layerName = this.selectedLayer.service.LayerName;
        this.updateLayer(this.layerTimes[0]);
      } else {
        console.error('Pubic feed has no times, AGAIN!');
      }
    }

    processFcstTimes(data){
      let result:Capabilities = data; // Data Point.
      this.layerTimes = [];
      for(let l=0;l<result.Layers.Layer.length; l++ ){
        // public/pre
          this.weatherLayers.push({
            id: l,
            name: result.Layers.Layer[l]['@attributes'].displayName,
            service: result.Layers.Layer[l].Service,
            url: result.Layers.BaseUrl
          });
        // datapoint
        //this.weatherLayers.push({id:l,name:result.Layers.Layer[l]['@displayName'], service:result.Layers.Layer[l].Service, url:result.Layers.BaseUrl['$']});
      }
      this.selectedLayer = this.weatherLayers[this.selectedValue];
      if (this.selectedPeriod === 'Forecast'){
        //this.layerName = this.selectedLayer.name;
        if (Array.isArray(this.selectedLayer.service)){
          let times = [];
          for (let s = 0; s < this.selectedLayer.service.length; s++){
            times = times.concat(this.selectedLayer.service[s].Timesteps.Timestep)
          }
          this.layerTimes = times;
        }
        this.updateLayer(this.layerTimes[0]);
      }
    }

  /**
   * Move backwards one step
   */
  previousStep(){
    if (this.a !== 0){
      this.a--;
    } else {
      this.a = this.layerTimes.length-1
    }
    this.updateLayer(this.layerTimes[this.a]);
  }

  /**
   * Move forwards one step.
   */
  nextStep(){
    if (this.a < this.layerTimes.length-1){
      this.a++;
    } else {
      this.a = 0;
    }
    this.updateLayer(this.layerTimes[this.a]);
  }

  /**
   * play / stop animation.
   * Check if still loading, skip if so.
   */
  playStop(){
    if (this.play) {
      this.play = false;
      this.animate.unsubscribe();
      this.playLabel = "Play |>";
    } else {
      this.play = true;
      this.playLabel = "Pause ||";
      this.animate = interval(1000).subscribe(() => {
        if (this.currentLayer._loading){
          console.warn('still loading previous layer so waiting.')
        } else {
          this.nextStep();
        }
      });
    }
  }
}
