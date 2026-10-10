import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { Button } from './Button';
import { useData } from '@/services/DataContext';
import { toCsv, downloadCsv } from '@/utils/geo';

/** Header "Export" menu: working CSV export + print-friendly view for PDF. */
export function ExportMenu({ rows, filename = 'crimemap-export.csv', columns }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { services } = useData();

  useEffect(() => {
    function onDocClick(e) {
      if (open && ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open ]);

  const defaultColumns = [
    { key: 'case_number', header: 'case_number' },
    { key: 'crime_type', header: 'crime_type' },
    { key: 'severity', header: 'severity' },
    { key: 'incident_date', header: 'incident_date' },
    { key: 'incident_time', header: 'incident_time' },
    { key: 'latitude', header: 'latitude' },
    { key: 'longitude', header: 'longitude' },
    { key: 'address', header: 'address' },
    { key: 'police_station', header: 'police_station' },
    { key: 'status', header: 'status' }
  ];
  const cols = columns || defaultColumns;
  const data = rows || services?.incidents || [];

  const handleCsv = () => {
    downloadCsv(filename, toCsv(data, cols));
    setOpen(false);
  };

  const handlePrint = () => {
    setOpen(false);
    window.print();
  };

  return (
    <div className="relative no-print" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
      >
        Export
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-[var(--z-dropdown)] p-2">
          <button
            type="button"
            role="menuitem"
            onClick={handleCsv}
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left hover:bg-[var(--color-navy-50)]"
          >
            <FileText className="w-4 h-4 mt-0.5 text-[var(--color-accent)]" aria-hidden="true" />
            <span>
              <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                Download CSV ({data.length} rows)
              </span>
              <span className="block text-xs text-[var(--color-text-muted)]">Working export of the current view</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handlePrint}
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left hover:bg-[var(--color-navy-50)]"
          >
            <Printer className="w-4 h-4 mt-0.5 text-[var(--color-accent)]" aria-hidden="true" />
            <span>
              <span className="block text-sm font-medium text-[var(--color-text-primary)]">Print-friendly view</span>
              <span className="block text-xs text-[var(--color-text-muted)]">Use browser print → Save as PDF</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
