/**
 * Created by leona.atkins on 19/07/2018.
 */
  export interface BaseUrl {
    '@forServiceTimeFormat':string;
    '$': string;
  }

  export interface Times {
    Time: Date[];
  }

  export interface Service {
    '@name': string;
    LayerName: string;
    ImageFormat: string;
    Times: Times;
  }

  export interface Layer {
    '@displayName': string;
    Service: Service;
  }

  export interface Layers {
    '@type': string;
    BaseUrl: BaseUrl;
    Layer: Layer[];
  }

  export interface Capabilities {
    Layers: Layers;
  }
