import { Injectable } from '@angular/core';

/** Position GPS (MaPosition.Latitude / Longitude). */
export interface Position {
  latitude: number;
  longitude: number;
}

/** GPSEtat, GPSInitParamètre(gpsAuto, gpsPrécisionElevée), GPSRécupèrePosition(20 s). */
@Injectable({ providedIn: 'root' })
export class GpsService {
  /** Position précise en 20 s au plus ; null si le GPS est coupé, refusé ou trop lent. */
  position(delaiMs = 20_000): Promise<Position | null> {
    if (!('geolocation' in navigator)) return Promise.resolve(null);
    return new Promise((resoudre) =>
      navigator.geolocation.getCurrentPosition(
        (p) => resoudre({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => resoudre(null),
        { enableHighAccuracy: true, timeout: delaiMs, maximumAge: 0 },
      ),
    );
  }
}
