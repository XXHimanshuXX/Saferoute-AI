declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: google.maps.MapOptions) => google.maps.Map;
        MapOptions: {
          center: { lat: number; lng: number };
          zoom: number;
          styles?: any[];
        };
        Marker: new (options: google.maps.MarkerOptions) => google.maps.Marker;
        MarkerOptions: {
          position: { lat: number; lng: number };
          map: google.maps.Map;
          title?: string;
          icon?: string | google.maps.Icon | google.maps.Symbol;
        };
        Icon: {
          url: string;
          scaledSize?: { width: number; height: number };
        };
        Symbol: {
          path: string;
          scale: number;
          fillColor: string;
          fillOpacity: number;
          strokeColor: string;
          strokeWeight: number;
        };
        SymbolPath: {
          CIRCLE: number;
        };
        TrafficLayer: new () => google.maps.TrafficLayer;
        TrafficLayer: {
          setMap: (map: google.maps.Map) => void;
        };
        InfoWindow: new (options?: google.maps.InfoWindowOptions) => google.maps.InfoWindow;
        InfoWindowOptions: {
          content: string | HTMLElement;
        };
        InfoWindow: {
          setPosition: (position: { lat: number; lng: number }) => void;
          setContent: (content: string | HTMLElement) => void;
          open: (map: google.maps.Map, anchor?: google.maps.Marker) => void;
          close: () => void;
        };
        event: {
          addListener: (
            instance: any,
            eventName: string,
            handler: () => void
          ) => google.maps.MapsEventListener;
        };
        MapsEventListener: {
          remove: () => void;
        };
        Geocoder: new () => google.maps.Geocoder;
        Geocoder: {
          geocode: (
            request: google.maps.GeocoderRequest,
            callback: (
              results: google.maps.GeocoderResult[],
              status: google.maps.GeocoderStatus
            ) => void
          ) => void;
        };
        GeocoderRequest: {
          address: string;
        };
        GeocoderResult: {
          formatted_address: string;
          geometry: {
            location: {
              lat: () => number;
              lng: () => number;
            };
          };
        };
        GeocoderStatus: {
          OK: string;
        };
      };
    };
    initMap: () => void;
  }
}

export {};
