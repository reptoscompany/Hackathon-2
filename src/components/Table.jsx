import { forwardRef, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

const Table = forwardRef(function Table({ 
  columns = [], 
  data = [], 
  sortable = true, 
  pagination = true, 
  pageSize = 10,
  onRowClick,
  selectionMode = false,
  selectedRows = [],
  onSelectionChange,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  exportable = true,
  exportFilename = 'export.csv',
  ...props 
}, ref) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [localSelection, setLocalSelection] = useState(new Set());

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, pageSize, currentPage]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSelectAll = () => {
    if (localSelection.size === paginatedData.length) {
      setLocalSelection(new Set());
    } else {
      setLocalSelection(new Set(paginatedData.map((_, i) => i)));
    }
  };

  const handleSelectRow = (index) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setLocalSelection(newSelection);
  };

  const handleExport = () => {
    const csvData = data.map(row => 
      columns.map(col => {
        const val = row[col.key];
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return val ?? '';
      }).join(',')
    );
    const header = columns.map(col => col.header).join(',');
    const csv = [header, ...csvData].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const selectedCount = selectionMode ? (onSelectionChange ? selectedRows.length : localSelection.size) : 0;

  return (
    <div ref={ref} className={`${className} overflow-hidden`}>
      {(selectionMode && selectedCount > 0) && (
        <div className="mb-3 flex items-center justify-between p-3 bg-[var(--color-accent-light)] rounded-md border border-[var(--color-accent)]/20">
          <span className="text-sm font-medium text-[var(--color-accent)]">
            {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button variant="ghost" size="sm" onClick={() => {
            if (onSelectionChange) onSelectionChange([]);
            else setLocalSelection(new Set());
          }}>
            Clear selection
          </Button>
        </div>
      )}
      
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-max" role="grid" {...props}>
          <thead>
            <tr className="bg-[var(--color-navy-50)]">
              {selectionMode && (
                <th scope="col" className="w-12 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={localSelection.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider ${col.align || ''} ${sortable && col.sortable !== false ? 'cursor-pointer select-none hover:bg-[var(--color-navy-100)]' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col.key)}
                  aria-sort={sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {sortable && col.sortable !== false && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectionMode ? 1 : 0)} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5 text-[var(--color-accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectionMode ? 1 : 0)} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-[var(--color-navy-50)]' : ''}
                    ${selectionMode && localSelection.has(rowIndex) ? 'bg-[var(--color-accent-light)]/50' : ''}
                  `}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onRowClick?.(row); }}
                >
                  {selectionMode && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={localSelection.has(rowIndex)}
                        onChange={() => handleSelectRow(rowIndex)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm ${col.align || ''}`}>
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap mt-4 px-2">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <span className="text-sm text-[var(--color-text-secondary)] w-20 text-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
            {exportable && (
              <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}>
                Export CSV
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
Table.displayName = 'Table';

export { Table };