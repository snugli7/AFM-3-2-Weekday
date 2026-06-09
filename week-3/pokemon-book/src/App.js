import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import PokemonCard from './components/PokemonCard';
import PokemonDetail from './components/PokemonDetail';

const POKEMON_PER_PAGE = 20;

function App() {
  const [allPokemon, setAllPokemon] = useState([]);
  const [displayedPokemon, setDisplayedPokemon] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch a batch of pokemon with their details and Korean names
  const fetchPokemonBatch = useCallback(async (currentOffset) => {
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_PER_PAGE}&offset=${currentOffset}`
      );
      if (!res.ok) throw new Error('Failed to fetch pokemon list');
      const data = await res.json();

      const total = data.count;

      // Fetch details for each pokemon
      const detailPromises = data.results.map((p) =>
        fetch(p.url).then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch ${p.name}`);
          return r.json();
        })
      );
      const details = await Promise.all(detailPromises);

      // Fetch Korean names for each pokemon
      const speciesPromises = details.map((d) =>
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${d.id}`)
          .then((r) => r.json())
          .then((sp) => {
            const koreanEntry = sp.names.find((n) => n.language.name === 'ko');
            return koreanEntry ? koreanEntry.name : null;
          })
          .catch(() => null)
      );
      const koreanNames = await Promise.all(speciesPromises);

      const pokemonList = details.map((d, i) => ({
        ...d,
        koreanName: koreanNames[i],
      }));

      return { pokemonList, total };
    } catch (err) {
      throw err;
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPokemonBatch(0)
      .then(({ pokemonList, total }) => {
        if (!cancelled) {
          setAllPokemon(pokemonList);
          setTotalCount(total);
          setOffset(POKEMON_PER_PAGE);
          setHasMore(POKEMON_PER_PAGE < total);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPokemonBatch]);

  // Filter pokemon based on search and type
  useEffect(() => {
    let filtered = allPokemon;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.koreanName && p.koreanName.includes(term)) ||
          String(p.id) === term ||
          String(p.id).padStart(3, '0').includes(term)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((p) =>
        p.types.some((t) => t.type.name === typeFilter)
      );
    }

    setDisplayedPokemon(filtered);
  }, [allPokemon, searchTerm, typeFilter]);

  // Load more pokemon
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const { pokemonList, total } = await fetchPokemonBatch(offset);
      setAllPokemon((prev) => [...prev, ...pokemonList]);
      setTotalCount(total);
      const newOffset = offset + POKEMON_PER_PAGE;
      setOffset(newOffset);
      setHasMore(newOffset < total);
    } catch (err) {
      setError('추가 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }, [offset, hasMore, loadingMore, fetchPokemonBatch]);

  const isFiltering = searchTerm.trim() || typeFilter;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="pokeball-icon">
            <div className="pokeball-top"></div>
            <div className="pokeball-center"></div>
            <div className="pokeball-bottom"></div>
          </div>
          <div>
            <h1 className="app-title">포켓몬 도감</h1>
            <p className="app-subtitle">Pokemon Pokedex</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        {error && (
          <div className="error-message">
            <p>데이터를 불러오는데 실패했습니다.</p>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>다시 시도</button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="pokeball-loading">
              <div className="pokeball-anim"></div>
            </div>
            <p className="loading-text">포켓몬을 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="pokemon-count">
              {displayedPokemon.length}마리의 포켓몬
              {isFiltering && ` (검색 결과)`}
              {!isFiltering && totalCount > 0 && ` / 전체 ${totalCount}마리`}
            </div>

            {displayedPokemon.length === 0 ? (
              <div className="no-results">
                <p className="no-results-icon">?</p>
                <p>검색 결과가 없습니다</p>
                <p className="no-results-hint">다른 검색어를 입력해보세요</p>
              </div>
            ) : (
              <div className="pokemon-grid">
                {displayedPokemon.map((pokemon) => (
                  <PokemonCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    onClick={setSelectedPokemon}
                  />
                ))}
              </div>
            )}

            {/* Load more button */}
            <div className="load-more-area">
              {loadingMore && (
                <div className="loading-more">
                  <div className="pokeball-spinner-small"></div>
                  <span>더 불러오는 중...</span>
                </div>
              )}
              {!loadingMore && hasMore && !isFiltering && (
                <button className="load-more-btn" onClick={loadMore}>
                  더 보기
                </button>
              )}
              {!hasMore && allPokemon.length > 0 && !isFiltering && (
                <p className="all-loaded">모든 포켓몬을 불러왔습니다!</p>
              )}
            </div>
          </>
        )}
      </main>

      {selectedPokemon && (
        <PokemonDetail
          pokemon={selectedPokemon}
          onClose={() => setSelectedPokemon(null)}
        />
      )}
    </div>
  );
}

export default App;
