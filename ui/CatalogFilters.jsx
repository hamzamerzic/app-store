import { categoryLabel } from '../domain.js'

export function CatalogFilters({
  query,
  category,
  categories,
  totalCount,
  resultCount,
  onQueryChange,
  onCategoryChange,
}) {
  const selected = category || 'all'
  return (
    <div className="st-discovery">
      <div className="st-search-row">
        <label className="st-search-label" htmlFor="st-catalog-search">
          Search
        </label>
        <input
          id="st-catalog-search"
          className="st-search-input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Find apps, tools, agents..."
          autoComplete="off"
          spellCheck={false}
        />
        <div className="st-result-count" aria-live="polite">
          {resultCount}/{totalCount}
        </div>
      </div>
      <div className="st-category-strip" aria-label="Catalog categories">
        <button
          type="button"
          className={`st-chip${selected === 'all' ? ' is-active' : ''}`}
          onClick={() => onCategoryChange('all')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`st-chip${selected === c ? ' is-active' : ''}`}
            onClick={() => onCategoryChange(c)}
          >
            {categoryLabel(c)}
          </button>
        ))}
      </div>
    </div>
  )
}
