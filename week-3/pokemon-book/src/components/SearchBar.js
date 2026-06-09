import React from 'react';
import './SearchBar.css';

const TYPE_OPTIONS = [
  { value: '', label: '모든 타입' },
  { value: 'normal', label: '노말' },
  { value: 'fire', label: '불꽃' },
  { value: 'water', label: '물' },
  { value: 'grass', label: '풀' },
  { value: 'electric', label: '전기' },
  { value: 'ice', label: '얼음' },
  { value: 'fighting', label: '격투' },
  { value: 'poison', label: '독' },
  { value: 'ground', label: '땅' },
  { value: 'flying', label: '비행' },
  { value: 'psychic', label: '에스퍼' },
  { value: 'bug', label: '벌레' },
  { value: 'rock', label: '바위' },
  { value: 'ghost', label: '고스트' },
  { value: 'dragon', label: '드래곤' },
  { value: 'dark', label: '악' },
  { value: 'steel', label: '강철' },
  { value: 'fairy', label: '페어리' },
];

function SearchBar({ searchTerm, onSearchChange, typeFilter, onTypeFilterChange }) {
  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="포켓몬 이름 또는 번호로 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => onSearchChange('')} aria-label="검색 초기화">
            &#x2715;
          </button>
        )}
      </div>
      <select
        className="type-filter"
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        aria-label="타입 필터"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SearchBar;
