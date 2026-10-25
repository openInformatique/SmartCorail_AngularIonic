import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';

/** InternetConnecté(). */
@Injectable({ providedIn: 'root' })
export class ReseauService {
  async internetConnecte(): Promise<boolean> {
    return (await Network.getStatus()).connected;
  }
}
