import { useState } from 'react';

function SearchBar({ onSearch, defaultCity }) {
  const [input, setInput] = useState(defaultCity || 'Madrid');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        placeholder="Escribe una ciudad..."
        onChange={(event) => setInput(event.target.value)}
      />
      <button type="submit">Buscar</button>
    </form>
  );
}

export default SearchBar;
