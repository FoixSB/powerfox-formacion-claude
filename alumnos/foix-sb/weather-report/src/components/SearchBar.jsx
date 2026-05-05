import { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      onSearch(trimmed)
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar ciudad..."
        className="w-full h-12 px-6 pr-12 rounded-full bg-white/15 border border-white/25 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 text-base font-sans"
      />
      <button
        type="submit"
        className="absolute right-3 text-white/70 hover:text-white transition-colors p-1"
      >
        <span className="material-symbols-outlined">search</span>
      </button>
    </form>
  )
}
