import { LARGEUR_MAXI_IMAGE_REDIMENSIONNEMENT } from '../constantes';

/**
 * RedimensionnerImageSiNecessaire : si un côté dépasse 1920 px, l'image est réduite pour que
 * son plus grand côté fasse 1920 px. Renvoie null si aucune réduction n'est nécessaire.
 */
export function dimensionsReduites(largeur: number, hauteur: number): { largeur: number; hauteur: number } | null {
  const maxi = LARGEUR_MAXI_IMAGE_REDIMENSIONNEMENT;
  if (largeur <= maxi && hauteur <= maxi) return null;
  const coefficient = (largeur > hauteur ? largeur : hauteur) / maxi;
  return { largeur: Math.round(largeur / coefficient), hauteur: Math.round(hauteur / coefficient) };
}

/**
 * Photo ou image de la galerie : orientation EXIF appliquée (OrienterImageSiNecessaire), réduction à 1920 px,
 * puis encodage JPEG en base 64. Renvoie null si l'image ne peut pas être lue (« Impossible de redimensionner l'image »).
 */
export async function preparerImage(fichier: File): Promise<string | null> {
  try {
    const image = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
    const taille = dimensionsReduites(image.width, image.height) ?? { largeur: image.width, hauteur: image.height };
    const canvas = document.createElement('canvas');
    canvas.width = taille.largeur;
    canvas.height = taille.hauteur;
    canvas.getContext('2d')?.drawImage(image, 0, 0, taille.largeur, taille.hauteur);
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1] ?? null;
  } catch {
    return null;
  }
}

/** Contenu d'un fichier en base 64 (Encode(Buffer, encodeBASE64)). */
export function lireEnBase64(fichier: File): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result).split(',')[1] ?? '');
    lecteur.onerror = () => rejeter(lecteur.error);
    lecteur.readAsDataURL(fichier);
  });
}
