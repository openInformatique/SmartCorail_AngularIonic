import { Component, computed, inject, signal } from '@angular/core';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { alertCircleOutline, copyOutline, shareOutline, swapVerticalOutline, trashOutline } from 'ionicons/icons';

import { EntreeJournal, estEnErreur, journalEnTexte, libelleStatut } from '../../core/journal/journal';
import { JournalService } from '../../core/journal/journal.service';
import { FichiersService } from '../../core/platform/fichiers.service';
import { DialoguesService } from '../../core/ui/dialogues.service';

/** Texte UTF-8 en base 64 (enregistrement du fichier exporté). */
function versBase64(texte: string): string {
  const octets = new TextEncoder().encode(texte);
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

/** Journal de débogage (QUAL uniquement) : appels HTTP et erreurs, du plus récent au plus ancien. */
@Component({
  selector: 'app-journal',
  templateUrl: 'journal.page.html',
  styleUrl: 'journal.page.scss',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent, TranslatePipe],
})
export class JournalPage {
  private readonly journal = inject(JournalService);
  private readonly fichiers = inject(FichiersService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);

  protected readonly problemesSeulement = signal(false);
  protected readonly deplie = signal<number | null>(null);
  protected readonly entrees = computed(() => {
    const liste = this.journal.entrees();
    return this.problemesSeulement() ? liste.filter(estEnErreur) : liste;
  });

  protected readonly enErreur = estEnErreur;
  protected readonly libelleStatut = libelleStatut;

  constructor() {
    addIcons({ alertCircleOutline, copyOutline, shareOutline, swapVerticalOutline, trashOutline });
  }

  protected basculer(id: number): void {
    this.deplie.update((actuel) => (actuel === id ? null : id));
  }

  /** « 09:31:05 » */
  protected heure(e: EntreeJournal): string {
    const d = new Date(e.date);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('fr-FR');
  }

  /** « 26/10 » */
  protected jour(e: EntreeJournal): string {
    const d = new Date(e.date);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  /** Chemin sans le serveur, pour la ligne résumée. */
  protected chemin(e: EntreeJournal): string {
    try {
      const url = new URL(e.url ?? '');
      return url.pathname + url.search;
    } catch {
      return e.url ?? '';
    }
  }

  /** Première ligne du message d'une erreur. */
  protected resume(e: EntreeJournal): string {
    return (e.message ?? '').split('\n')[0];
  }

  protected async copier(): Promise<void> {
    try {
      await navigator.clipboard.writeText(journalEnTexte(this.entrees()));
      await this.dialogues.toast(this.translate.instant('journal.copie'));
    } catch {
      await this.dialogues.toast(this.translate.instant('journal.copieImpossible'));
    }
  }

  /** Fichier texte ouvert avec l'application associée (partage par mail, Drive…). */
  protected async exporter(): Promise<void> {
    await this.fichiers.enregistrerEtOuvrir('journal-smartcorail.txt', versBase64(journalEnTexte(this.entrees())));
  }

  protected async vider(): Promise<void> {
    if (!(await this.dialogues.ouiNon(this.translate.instant('journal.confirmerVider')))) return;
    await this.journal.vider();
  }
}
