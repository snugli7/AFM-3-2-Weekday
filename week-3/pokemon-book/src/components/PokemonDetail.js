import React, { useState, useEffect } from 'react';
import './PokemonDetail.css';
import { TYPE_COLORS, TYPE_KOREAN } from '../utils/typeColors';

const STAT_KOREAN = {
  hp: 'HP',
  attack: '공격',
  defense: '방어',
  'special-attack': '특수공격',
  'special-defense': '특수방어',
  speed: '스피드',
};

function PokemonDetail({ pokemon, onClose }) {
  const [speciesData, setSpeciesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speciesError, setSpeciesError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSpeciesError(false);
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Species fetch failed');
        return res.json();
      })
      .then((data) => {
        setSpeciesData(data);
        setLoading(false);
      })
      .catch(() => {
        setSpeciesError(true);
        setLoading(false);
      });
  }, [pokemon.id]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const mainType = pokemon.types[0]?.type?.name || 'normal';
  const bgColor = TYPE_COLORS[mainType] || '#777';

  const imageUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default ||
    '';

  const koreanName =
    speciesData?.names?.find((n) => n.language.name === 'ko')?.name ||
    pokemon.koreanName ||
    pokemon.name;

  const flavorText =
    speciesData?.flavor_text_entries?.find((f) => f.language.name === 'ko')
      ?.flavor_text ||
    speciesData?.flavor_text_entries?.find((f) => f.language.name === 'en')
      ?.flavor_text ||
    '';

  const genus =
    speciesData?.genera?.find((g) => g.language.name === 'ko')?.genus ||
    speciesData?.genera?.find((g) => g.language.name === 'en')?.genus ||
    '';

  const maxStat = 255;
  const totalStats = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        className="detail-modal"
        style={{ '--detail-color': bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} aria-label="닫기">
          &#x2715;
        </button>

        <div
          className="detail-header"
          style={{
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}88)`,
          }}
        >
          <div className="detail-header-info">
            <span className="detail-id">
              #{String(pokemon.id).padStart(3, '0')}
            </span>
            <h2 className="detail-name">{koreanName}</h2>
            <span className="detail-english-name">{pokemon.name}</span>
            {genus && <span className="detail-genus">{genus}</span>}
            <div className="detail-types">
              {pokemon.types.map((t) => (
                <span
                  key={t.type.name}
                  className="detail-type-badge"
                  style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                >
                  {TYPE_KOREAN[t.type.name] || t.type.name}
                </span>
              ))}
            </div>
          </div>
          {imageUrl && (
            <img src={imageUrl} alt={koreanName} className="detail-image" />
          )}
        </div>

        <div className="detail-body">
          {loading ? (
            <div className="detail-loading">
              <div className="pokeball-spinner"></div>
            </div>
          ) : (
            <>
              {speciesError && (
                <p className="detail-error-note">
                  종(species) 데이터를 불러오지 못했습니다.
                </p>
              )}

              {flavorText && (
                <p className="detail-flavor">
                  {flavorText.replace(/\f|\n/g, ' ')}
                </p>
              )}

              <div className="detail-info-grid">
                <div className="info-item">
                  <span className="info-label">키</span>
                  <span className="info-value">
                    {(pokemon.height / 10).toFixed(1)}m
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">몸무게</span>
                  <span className="info-value">
                    {(pokemon.weight / 10).toFixed(1)}kg
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">기본 경험치</span>
                  <span className="info-value">
                    {pokemon.base_experience || '-'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">기술 수</span>
                  <span className="info-value">
                    {pokemon.moves ? pokemon.moves.length : 0}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="detail-section">
                <h3 className="section-title">능력치</h3>
                <div className="stats-list">
                  {pokemon.stats.map((s) => {
                    const pct = (s.base_stat / maxStat) * 100;
                    return (
                      <div key={s.stat.name} className="stat-row">
                        <span className="stat-name">
                          {STAT_KOREAN[s.stat.name] || s.stat.name}
                        </span>
                        <span className="stat-value">{s.base_stat}</span>
                        <div className="stat-bar-bg">
                          <div
                            className="stat-bar-fill"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                pct > 60
                                  ? '#4caf50'
                                  : pct > 35
                                  ? '#ffc107'
                                  : '#e63946',
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="stat-row stat-total">
                    <span className="stat-name">합계</span>
                    <span className="stat-value">{totalStats}</span>
                    <div className="stat-bar-bg">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${Math.min((totalStats / 720) * 100, 100)}%`,
                          backgroundColor: '#6890f0',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Abilities */}
              <div className="detail-section">
                <h3 className="section-title">특성</h3>
                <div className="abilities-list">
                  {pokemon.abilities.map((a) => (
                    <span key={a.ability.name} className="ability-badge">
                      {a.ability.name.replace(/-/g, ' ')}
                      {a.is_hidden && (
                        <span className="hidden-label"> (숨겨진)</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cries */}
              {pokemon.cries && (pokemon.cries.latest || pokemon.cries.legacy) && (
                <div className="detail-section">
                  <h3 className="section-title">울음소리</h3>
                  <div className="cries-area">
                    {pokemon.cries.latest && (
                      <div className="cry-item">
                        <span className="cry-label">최신</span>
                        <audio controls preload="none" className="cry-audio">
                          <source src={pokemon.cries.latest} type="audio/ogg" />
                          지원되지 않는 브라우저입니다.
                        </audio>
                      </div>
                    )}
                    {pokemon.cries.legacy && (
                      <div className="cry-item">
                        <span className="cry-label">레거시</span>
                        <audio controls preload="none" className="cry-audio">
                          <source src={pokemon.cries.legacy} type="audio/ogg" />
                          지원되지 않는 브라우저입니다.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PokemonDetail;
