import React, { useState } from 'react';
import './PokemonCard.css';
import { TYPE_COLORS, TYPE_KOREAN } from '../utils/typeColors';

function PokemonCard({ pokemon, onClick }) {
  const [imgError, setImgError] = useState(false);
  const mainType = pokemon.types[0]?.type?.name || 'normal';
  const bgColor = TYPE_COLORS[mainType] || '#777';
  const id = pokemon.id;

  const imageUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default ||
    '';

  const fallbackUrl = pokemon.sprites?.front_default || '';

  return (
    <div
      className="pokemon-card"
      style={{ '--card-color': bgColor }}
      onClick={() => onClick(pokemon)}
    >
      <div className="card-bg-circle"></div>
      <span className="pokemon-id">#{String(id).padStart(3, '0')}</span>
      <div className="card-image-wrapper">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={pokemon.koreanName || pokemon.name}
            className="pokemon-image"
            loading="lazy"
            onError={() => {
              if (fallbackUrl && fallbackUrl !== imageUrl) {
                setImgError(true);
              }
            }}
          />
        ) : fallbackUrl && imgError ? (
          <img
            src={fallbackUrl}
            alt={pokemon.koreanName || pokemon.name}
            className="pokemon-image"
            loading="lazy"
          />
        ) : (
          <div className="pokemon-image-placeholder">?</div>
        )}
      </div>
      <h3 className="pokemon-name">{pokemon.koreanName || pokemon.name}</h3>
      <div className="pokemon-types">
        {pokemon.types.map((t) => (
          <span
            key={t.type.name}
            className="type-badge"
            style={{ backgroundColor: TYPE_COLORS[t.type.name] || '#777' }}
          >
            {TYPE_KOREAN[t.type.name] || t.type.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default PokemonCard;
