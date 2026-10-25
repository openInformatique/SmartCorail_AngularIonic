import { Injectable, inject } from '@angular/core';
import { FileOpener } from '@capacitor-community/file-opener';
import { Directory, Filesystem } from '@capacitor/filesystem';

import { AppareilService } from './appareil.service';

const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  htm: 'text/html',
  html: 'text/html',
};

/** fSauveBuffer dans fRepEnCours(), LanceAppliAssociée, ViderRepEnCours (COL_Systeme). */
@Injectable({ providedIn: 'root' })
export class FichiersService {
  private readonly appareil = inject(AppareilService);

  /** Enregistre un document reçu en base 64 puis l'ouvre avec l'application associée. */
  async enregistrerEtOuvrir(nomFichier: string, contenuBase64: string): Promise<void> {
    const type = TYPES[extension(nomFichier)] ?? 'application/octet-stream';
    if (this.appareil.enModeTest) {
      // Navigateur : pas de système de fichiers, le document s'ouvre dans un nouvel onglet.
      const octets = Uint8Array.from(atob(contenuBase64), (c) => c.charCodeAt(0));
      window.open(URL.createObjectURL(new Blob([octets], { type })), '_blank');
      return;
    }
    const { uri } = await Filesystem.writeFile({ path: nomFichier, data: contenuBase64, directory: Directory.Data });
    await FileOpener.open({ filePath: uri, contentType: type, openWithDefault: true });
  }

  /** ViderRepEnCours : supprime les .pdf, .png et .jpg enregistrés par l'application. */
  async viderRepEnCours(): Promise<void> {
    if (this.appareil.enModeTest) return;
    const { files } = await Filesystem.readdir({ path: '', directory: Directory.Data }).catch(() => ({ files: [] }));
    for (const fichier of files) {
      if (!['pdf', 'png', 'jpg'].includes(extension(fichier.name))) continue;
      await Filesystem.deleteFile({ path: fichier.name, directory: Directory.Data }).catch((e) =>
        console.warn(`Echec de suppression du fichier ${fichier.name}`, e),
      );
    }
  }
}

/** fExtraitChemin(…, fExtension), sans le point, en minuscules. */
export function extension(nomFichier: string): string {
  const point = nomFichier.lastIndexOf('.');
  return point < 0 ? '' : nomFichier.slice(point + 1).toLowerCase();
}
