'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { PALETTE } from '@/lib/palette'

export interface CatalogItem {
  id: string
  name: string
}

interface ItemCodesSelectProps {
  items: CatalogItem[]
  selected?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  required?: boolean
}

export default function ItemCodesSelect({
  items,
  selected = [],
  onSelectionChange,
  required = true,
}: ItemCodesSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selected))
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false)
        inputRef.current?.blur()
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showDropdown])

  // Filter items based on search term (search in both code and description)
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.toLowerCase()
    return items.filter(item => item.name.toLowerCase().includes(term))
  }, [searchTerm, items])

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedIds(newSelected)
    onSelectionChange?.([...newSelected])
    setSearchTerm('')
  }

  const handleRemoveSelected = (itemId: string) => {
    const newSelected = new Set(selectedIds)
    newSelected.delete(itemId)
    setSelectedIds(newSelected)
    onSelectionChange?.([...newSelected])
  }

  const selectedItems = items.filter(i => selectedIds.has(i.id))
  const isValid = selectedIds.size > 0

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="🔍 Buscar código o descripción..."
          className="w-full px-3 py-2 text-sm rounded-md border"
          style={{
            borderColor: !isValid && selectedIds.size === 0 ? '#ef4444' : PALETTE.ui.border,
            backgroundColor: '#FFFFFF',
            color: PALETTE.text.primary,
          }}
        />

        {/* Dropdown results */}
        {showDropdown && filteredItems.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
            style={{ borderColor: PALETTE.ui.border }}
          >
            {/* "Listo" button — top bar with minimal styling */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: PALETTE.ui.border, backgroundColor: '#fafafa' }}>
              <span className="text-xs font-medium" style={{ color: PALETTE.text.secondary }}>
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="text-xs font-semibold px-2 py-0.5 rounded-sm hover:bg-gray-100 transition-colors"
                style={{ color: PALETTE.primary.green }}
              >
                Listo ✓
              </button>
            </div>

            {filteredItems.slice(0, 20).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectItem(item.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                style={{
                  borderColor: PALETTE.ui.border,
                  backgroundColor: selectedIds.has(item.id) ? '#f0fdf4' : 'transparent',
                }}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    readOnly
                    className="w-4 h-4 rounded"
                    style={{ accentColor: PALETTE.primary.green }}
                  />
                  <span style={{ color: PALETTE.text.primary }}>
                    {item.name}
                  </span>
                </span>
              </button>
            ))}
            {filteredItems.length > 20 && (
              <div className="px-3 py-2 text-xs text-center" style={{ color: PALETTE.text.secondary }}>
                Mostrando 20 de {filteredItems.length} resultados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message if required and empty */}
      {required && selectedIds.size === 0 && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
          Selecciona al menos un código de diagnóstico o procedimiento
        </p>
      )}

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map(item => (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border"
              style={{
                background: `${PALETTE.primary.green}15`,
                borderColor: PALETTE.primary.green,
                color: PALETTE.text.primary,
              }}
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveSelected(item.id)}
                className="ml-1 font-bold hover:opacity-70 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden inputs for form submission */}
      {Array.from(selectedIds).map(itemId => (
        <input
          key={itemId}
          type="hidden"
          name="item_code_ids"
          value={itemId}
        />
      ))}
    </div>
  )
}
