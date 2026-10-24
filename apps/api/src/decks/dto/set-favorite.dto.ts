import { IsBoolean } from 'class-validator';

// Mise en favori d'un deck (CON-74) : route dédiée, pour ne jamais toucher au
// nom, à la couleur ni à l'icône (PATCH /decks/:id les réécrit tous).
export class SetFavoriteDto {
  @IsBoolean({ message: 'Le favori doit valoir vrai ou faux' })
  isFavorite: boolean;
}
