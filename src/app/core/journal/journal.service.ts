import { Injectable, signal } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

import { environment } from '../../../environments/environment';
import { EntreeJournal, TAILLE_JOURNAL } from './journal';

const FICHIER = 'journal.json';
/** Délai avant l'écriture du fichier, pour regrouper les entrées d'une même rafale d'appels. */
const DELAI_ECRITURE_MS = 2000;

/**
 * Journal de débogage : appels HTTP et erreurs, gardé dans un fichier de l'appareil.
 * Actif en QUAL seulement : en PROD rien n'est enregistré et l'écran n'existe pas.
 */
@Injectable({ providedIn: 'root' })
export class JournalService {
  readonly actif = environment.env === 'QUAL';
  /** Du plus récent au plus ancien. */
  readonly entrees = signal<EntreeJournal[]>([]);

  /** Identifiants croissants d'une session à l'autre : pas de doublon avec ceux du fichier. */
  private prochainId = Date.now();
  private ecriture?: ReturnType<typeof setTimeout>;
  private readonly chargement: Promise<void>;

  constructor() {
    this.chargement = this.actif ? this.charger() : Promise.resolve();
  }

  /** Enregistre une entrée ; renvoie son identifiant (pour la compléter avec la réponse). */
  ajouter(entree: Omit<EntreeJournal, 'id'>): number {
    if (!this.actif) return 0;
    const id = this.prochainId++;
    this.entrees.update((liste) => [{ ...entree, id }, ...liste].slice(0, TAILLE_JOURNAL));
    this.planifierEcriture();
    return id;
  }

  /** Complète une entrée existante (réponse d'un appel HTTP). */
  completer(id: number, complement: Partial<EntreeJournal>): void {
    if (!this.actif || !id) return;
    this.entrees.update((liste) => liste.map((e) => (e.id === id ? { ...e, ...complement } : e)));
    this.planifierEcriture();
  }

  /** Erreur de l'application (non interceptée, connexion Microsoft, CB_Erreur…). */
  erreur(origine: string, erreur: unknown): void {
    const message = erreur instanceof Error ? `${erreur.name}: ${erreur.message}${erreur.stack ? `\n${erreur.stack}` : ''}` : String(erreur);
    this.ajouter({ date: new Date().toISOString(), type: 'erreur', origine, message });
  }

  async vider(): Promise<void> {
    this.entrees.set([]);
    await this.ecrire();
  }

  private planifierEcriture(): void {
    clearTimeout(this.ecriture);
    this.ecriture = setTimeout(() => void this.ecrire(), DELAI_ECRITURE_MS);
  }

  private async charger(): Promise<void> {
    try {
      const { data } = await Filesystem.readFile({ path: FICHIER, directory: Directory.Data, encoding: Encoding.UTF8 });
      const lues = JSON.parse(String(data)) as EntreeJournal[];
      if (!Array.isArray(lues)) return;
      // Les entrées déjà faites depuis le lancement passent devant celles du fichier.
      this.entrees.update((liste) => [...liste, ...lues].slice(0, TAILLE_JOURNAL));
    } catch {
      // Pas encore de journal sur l'appareil.
    }
  }

  private async ecrire(): Promise<void> {
    await this.chargement;
    try {
      await Filesystem.writeFile({ path: FICHIER, data: JSON.stringify(this.entrees()), directory: Directory.Data, encoding: Encoding.UTF8 });
    } catch (e) {
      console.warn('Journal : écriture impossible', e);
    }
  }
}
