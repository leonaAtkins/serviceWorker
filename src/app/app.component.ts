import {Component, OnInit, ViewChild} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';
import {delay } from 'rxjs/operators';
import {interval} from "rxjs/index";
import {MoMapDirective} from '@mo/map';
import {Capabilities} from './capabilities';
import {CapabilitiesService} from "./capabilities.service";

declare const L: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private updates: SwUpdate,
    private capabilitiesService: CapabilitiesService,
  ) {}

  @ViewChild(MoMapDirective) private mapDirective: MoMapDirective;

  ngOnInit() {
    this.updates.available.subscribe(event => {
      console.log('current version is', event.current);
      console.log('available version is', event.available);
      this.setUpdateFlag('Update available');
    });
    this.updates.activated.subscribe(event => {
      console.log('old version was', event.previous);
      console.log('new version is', event.current);
      this.setUpdateFlag('New version available');
    });
    interval(30 * 1000).subscribe(() => {
        this.updates.checkForUpdate();
        this.updateOnlineStatus();
    });
    interval(5 * 60 * 1000).subscribe(() => {
      this.getTimes();
    });
  }

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
  public selectedValue = 0;
  private selectedLayer:any = {};
  private APIKEY = 'c70d5f37-796a-47a8-82a2-9207849f6625&cb=';

  setUpdateFlag(text: string){
    this.updateFlag = text;
  }

  updateOnlineStatus(){
    this.onlineFlag = navigator.onLine ? "Online" : "Offline";
  }

  updateLayer(time){
    let previousLayer = this.currentLayer;
    let layerTag = this.layerName+'|'+time;
    this.loading = true;
    //this.layerUrl = this.weatherLayers[this.selectedValue].url
    this.layerUrl = '//www.metoffice.gov.uk/public/data/LayerCache/{Service}/ItemBbox/{LayerName}/{X}/{Y}/{Z}/{ImageFormat}?TIME={Time}Z'
      .replace('{LayerName}',this.selectedLayer.service.LayerName)
      .replace('{Service}',this.selectedLayer.service['@attributes'].name) // public
      .replace('{ImageFormat}','png8bit')
      .replace('{Time}',encodeURI(time))
      .replace('{X}','{x}') //public
      .replace('{Y}','{y}') //public
      .replace('{Z}','{z}'); //public
      //.replace('{key}',this.APIKEY); // datapoint
    //console.log(this.layerUrl);
    if (typeof this.selectedLayer.service.Style !== 'undefined'){
      this.layerUrl += '&'+encodeURI(this.selectedLayer.service.Style);
    }
    this.currentLayer = L.tileLayer(this.layerUrl, {layerType:'WeatherLayer', layerName: layerTag});
    this.currentLayer.setOpacity(0);
    // datapoint
      //const bounds = [[49.6, -10.5], [59.2, 2.2]];
      //this.currentLayer = L.imageOverlay(this.layerUrl, bounds, {layerType:'WeatherLayer', layerName: layerTag});
      if (this.map.hasLayer(this.currentLayer)){
        previousLayer.setOpacity(0);
        this.currentLayer.setOpacity(1);
      } else {
        this.map.addLayer(this.currentLayer, {layerName: layerTag});
        this.currentLayer.on("load",function(event) {
          setTimeout( () => {
            this._map.eachLayer(function (layer) {
              if (typeof layer.options.layerType !== 'undefined') {
                if (layer.options.layerType === 'WeatherLayer') {
                  if (event.target.options.layerName === layer.options.layerName) {
                    //console.log('layer :',layer.options.layerType, layer.options.layerName);
                    layer.setOpacity(1)
                  } else {
                    layer.setOpacity(0)
                  }
                }
              }
              //console.log(layer.options.layerType);
            })
          }, 200);
        })
      }
      this.layerTime = time;
  }


  changeLayer(event){
    this.selectedValue = event.target.selectedIndex;
    this.getTimes();
    this.removeLayers();
  }

  removeLayers(){
    let map = this.map;
    map.eachLayer(function(layer){
      if (typeof layer.options.layerType !== 'undefined'){
        if (layer.options.layerType === 'WeatherLayer') {
          //layer.setOpacity(0)
          map.removeLayer(layer);
        }
      }
    });
  }

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


  getTimes() {
      this.weatherLayers = [];
      this.capabilitiesService.getCapabilities()
        .subscribe(data => {
          //console.log('data', data);
           let result:Capabilities = data; // Data Point.
          //console.log('result: ', result);
          for(let l=0;l<result.Layers.Layer.length; l++ ){
            //public
            this.weatherLayers.push({id:l,name:result.Layers.Layer[l]['@attributes'].displayName, service:result.Layers.Layer[l].Service, url:result.Layers.BaseUrl});
            // datapoint
            //this.weatherLayers.push({id:l,name:result.Layers.Layer[l]['@displayName'], service:result.Layers.Layer[l].Service, url:result.Layers.BaseUrl['$']});
          }
          this.selectedLayer = this.weatherLayers[this.selectedValue];
          if (typeof this.selectedLayer.service.Times !== 'undefined')
          {
            this.layerName = this.selectedLayer.service.LayerName;
            this.layerTimes = this.selectedLayer.service.Times.Time.reverse();
            this.updateLayer(this.layerTimes[0]);
          } else {
            console.error('Pubic feed has no times, AGAIN!');
          }
        })
    }

  previousStep(){
    if (this.a !== 0){
      this.a--;
    } else {
      this.a = this.layerTimes.length-1
    }
    this.updateLayer(this.layerTimes[this.a]);
  }

  nextStep(){
    if (this.a < this.layerTimes.length-1){
      this.a++;
    } else {
      this.a = 0;
    }
    this.updateLayer(this.layerTimes[this.a]);
  }

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
          console.log('still loading wait.')
        } else {
          this.nextStep();
        }
      });
    }
  }
}
