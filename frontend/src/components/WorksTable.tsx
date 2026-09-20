import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Grid2X2,
  LayoutList,
  Printer,
  Search,
  Star,
} from 'lucide-react';
import { WorkItem } from '../data/mpladsData';
import { TranslationDict } from '../data/translations';
import { TableColumnHeader } from './common/TableColumnHeader';

interface WorksTableProps {
  works: WorkItem[];
  flags: Array<{ id: string; project_id: string; severity: string; origin: string; reason: string }>;
  onViewAttachments: (work: WorkItem) => void;
  onViewReviews: (work: WorkItem) => void;
  onInspectWork?: (work: WorkItem) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
  t: TranslationDict;
}

type ViewMode = 'list' | 'grid';

const statusClass: Record<WorkItem['status'], string> = {
  Completed: 'is-complete',
  Ongoing: 'is-ongoing',
  Delayed: 'is-delayed',
  Sanctioned: 'is-sanctioned',
  Recommended: 'is-recommended',
};

export function WorksTable({
  works,
  flags,
  onViewAttachments,
  onViewReviews,
  onInspectWork,
  selectedStatusFilter: _selectedStatusFilter,
  setSelectedStatusFilter: _setSelectedStatusFilter,
  t,
}: WorksTableProps) {
  const [sortField, setSortField] = useState<string>('dateSanctioned');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Column Filters
  const [statusColFilter, setStatusColFilter] = useState<string>('all');
  const [stateColFilter, setStateColFilter] = useState<string>('all');
  const [sectorColFilter, setSectorColFilter] = useState<string>('all');
  const [signalColFilter, setSignalColFilter] = useState<string>('all');

  const flagMap = useMemo(() => {
    const map = new Map<string, string>();
    flags.forEach((flag) => {
      if (!map.has(flag.project_id) || flag.severity === 'critical') map.set(flag.project_id, flag.severity);
    });
    return map;
  }, [flags]);

  // Distinct states for filter
  const distinctStates = useMemo(() => {
    const set = new Set<string>();
    works.forEach(w => { if (w.state) set.add(w.state); });
    return Array.from(set).sort();
  }, [works]);

  // Distinct sectors for filter
  const distinctSectors = useMemo(() => {
    const set = new Set<string>();
    works.forEach(w => { if (w.sectorName) set.add(w.sectorName); });
    return Array.from(set).sort();
  }, [works]);

  const searchedWorks = useMemo(() => {
    return works.filter((work) => {
      // Column filters
      if (statusColFilter !== 'all' && work.status.toLowerCase() !== statusColFilter.toLowerCase()) {
        return false;
      }
      if (stateColFilter !== 'all' && work.state.toLowerCase() !== stateColFilter.toLowerCase()) {
        return false;
      }
      if (sectorColFilter !== 'all' && (work.sectorName || '').toLowerCase() !== sectorColFilter.toLowerCase()) {
        return false;
      }
      if (signalColFilter !== 'all') {
        const sev = flagMap.get(work.id);
        if (signalColFilter === 'flagged' && !sev) return false;
        if (signalColFilter === 'clear' && sev) return false;
      }

      const query = tableSearch.trim().toLowerCase();
      if (!query) return true;

      return [
        work.id,
        work.title,
        work.mpName,
        work.contractor,
        work.agency,
        work.district,
        work.state,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [works, tableSearch, statusColFilter, stateColFilter, sectorColFilter, signalColFilter, flagMap]);

  const sortedWorks = useMemo(() => [...searchedWorks].sort((a, b) => {
    let aValue: any = a[sortField as keyof WorkItem];
    let bValue: any = b[sortField as keyof WorkItem];

    if (sortField === 'title') {
      aValue = a.title;
      bValue = b.title;
    } else if (sortField === 'sanctionedAmt') {
      aValue = a.sanctionedAmt;
      bValue = b.sanctionedAmt;
    } else if (sortField === 'physicalProgress') {
      aValue = a.physicalProgress;
      bValue = b.physicalProgress;
    } else if (sortField === 'state') {
      aValue = a.state;
      bValue = b.state;
    } else if (sortField === 'sectorName') {
      aValue = a.sectorName;
      bValue = b.sectorName;
    } else if (sortField === 'status') {
      aValue = a.status;
      bValue = b.status;
    }

    if (typeof aValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }), [searchedWorks, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedWorks.length / pageSize));
  const paginatedWorks = sortedWorks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = sortedWorks.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(currentPage * pageSize, sortedWorks.length);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'title' || field === 'id' || field === 'state' ? 'asc' : 'desc');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Work ID', 'State', 'District', 'Constituency', 'MP Name', 'Work Title', 'Sector', 'Sanctioned (Cr)', 'Expenditure (Cr)', 'Physical Progress (%)', 'Sanction Date', 'Status', 'Agency', 'Contractor'];
    const rows = sortedWorks.map((work) => [
      work.id,
      work.state,
      work.district,
      work.constituency,
      `"${work.mpName}"`,
      `"${work.title.replace(/"/g, '""')}"`,
      `"${work.sectorName}"`,
      work.sanctionedAmt,
      work.expenditureAmt,
      work.physicalProgress,
      work.dateSanctioned,
      work.status,
      `"${work.agency}"`,
      `"${work.contractor}"`,
    ]);
    const content = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`;
    link.download = `MPLADS_Works_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inspectWork = (work: WorkItem) => onInspectWork?.(work);

  const renderSignal = (work: WorkItem) => {
    const severity = flagMap.get(work.id);
    if (severity) {
      return <span className="works-signal works-signal--flag"><AlertTriangle size={12} />{severity === 'critical' ? 'Review required' : 'Monitor'}</span>;
    }
    return <span className="works-signal works-signal--clear"><CheckCircle2 size={12} />Clear</span>;
  };

  const renderActions = (work: WorkItem) => (
    <div className="works-actions" onClick={(event) => event.stopPropagation()}>
      <button className="works-action works-action--text" onClick={() => inspectWork(work)}>View details</button>
      <button className="works-action" onClick={() => onViewAttachments(work)} title="View project evidence" aria-label={`View evidence for ${work.title}`}><Eye size={15} /></button>
      <button className="works-action" onClick={() => onViewReviews(work)} title="View public reviews" aria-label={`View reviews for ${work.title}`}><Star size={15} /></button>
    </div>
  );

  return (
    <section className="works-directory" aria-label={t.worksDirectory}>
      <div className="works-directory__header">
        <div>
          <p className="works-directory__eyebrow">Project portfolio</p>
          <div className="works-directory__title-row">
            <FileText size={18} aria-hidden="true" />
            <h2>{t.worksDirectory}</h2>
            <span className="works-directory__count">{sortedWorks.length} records</span>
          </div>
        </div>

        <div className="works-directory__toolbar">
          <label className="works-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search works</span>
            <input
              type="search"
              placeholder="Search works"
              value={tableSearch}
              onChange={(event) => { setTableSearch(event.target.value); setCurrentPage(1); }}
            />
          </label>

          <div className="view-toggle" role="group" aria-label="Choose directory view">
            <button className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} title="List view"><LayoutList size={16} /><span>List</span></button>
            <button className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} title="Grid view"><Grid2X2 size={16} /><span>Grid</span></button>
          </div>

          <div className="works-directory__utility-actions">
            <button className="works-utility" onClick={handleExportCsv}><Download size={15} /><span>{t.exportCsv}</span></button>
            <button className="works-utility" onClick={() => window.print()}><Printer size={15} /><span>{t.printReport}</span></button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="works-list-wrap">
          <table className="works-list">
            <thead>
              <tr>
                <TableColumnHeader
                  title="Work ID & Status"
                  field="id"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                  filterOptions={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Ongoing', value: 'ongoing' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Sanctioned', value: 'sanctioned' },
                    { label: 'Delayed', value: 'delayed' },
                    { label: 'Recommended', value: 'recommended' },
                  ]}
                  selectedFilter={statusColFilter}
                  onFilterChange={(v) => { setStatusColFilter(v); setCurrentPage(1); }}
                  style={{ width: '140px' }}
                />
                <TableColumnHeader
                  title="Project & Location"
                  field="state"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                  filterOptions={[
                    { label: 'All States', value: 'all' },
                    ...distinctStates.map(st => ({ label: st, value: st.toLowerCase() }))
                  ]}
                  selectedFilter={stateColFilter}
                  onFilterChange={(v) => { setStateColFilter(v); setCurrentPage(1); }}
                />
                <TableColumnHeader
                  title="Classification"
                  field="sectorName"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                  filterOptions={[
                    { label: 'All Sectors', value: 'all' },
                    ...distinctSectors.map(sec => ({ label: sec, value: sec.toLowerCase() }))
                  ]}
                  selectedFilter={sectorColFilter}
                  onFilterChange={(v) => { setSectorColFilter(v); setCurrentPage(1); }}
                />
                <TableColumnHeader
                  title="Sanctioned"
                  field="sanctionedAmt"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                  className="works-list__numeric"
                />
                <TableColumnHeader
                  title="Progress"
                  field="physicalProgress"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                  className="works-list__progress"
                />
                <TableColumnHeader
                  title="Audit"
                  field="audit"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                  filterOptions={[
                    { label: 'All Signals', value: 'all' },
                    { label: 'Flagged / Review', value: 'flagged' },
                    { label: 'Clear', value: 'clear' },
                  ]}
                  selectedFilter={signalColFilter}
                  onFilterChange={(v) => { setSignalColFilter(v); setCurrentPage(1); }}
                  style={{ width: '120px' }}
                />
                <th aria-label="Actions" style={{ textAlign: 'right' }} />
              </tr>
            </thead>
            <tbody>
              {paginatedWorks.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <FileText size={24} style={{ color: '#94a3b8' }} />
                      <strong>No works found matching the selected criteria.</strong>
                      <span style={{ fontSize: '0.85rem' }}>Try broadening or resetting your search and column filters.</span>
                      <button
                        onClick={() => {
                          setStatusColFilter('all');
                          setStateColFilter('all');
                          setSectorColFilter('all');
                          setSignalColFilter('all');
                          setTableSearch('');
                          setCurrentPage(1);
                        }}
                        style={{
                          marginTop: '6px',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedWorks.map((work) => (
                  <tr key={work.id} onClick={() => inspectWork(work)}>
                    <td><span className="work-id">{work.id}</span><span className={`work-status ${statusClass[work.status]}`}>{work.status}</span></td>
                    <td>
                      <strong className="work-title">{work.title}</strong>
                      <span className="work-subtitle">{work.district}, {work.state} · {work.constituency}</span>
                      <span className="work-subtitle">{work.agency}{work.contractor ? ` · ${work.contractor}` : ''}</span>
                    </td>
                    <td><span className="work-sector">{work.sectorName}</span></td>
                    <td className="works-list__numeric"><strong>₹ {work.sanctionedAmt.toFixed(2)} Cr</strong><span className="work-subtitle">Spent ₹ {work.expenditureAmt.toFixed(2)} Cr</span></td>
                    <td className="works-list__progress"><div className="work-progress"><span><strong>{work.physicalProgress}%</strong> complete</span><div><i style={{ width: `${work.physicalProgress}%` }} /></div></div></td>
                    <td>{renderSignal(work)}</td>
                    <td>{renderActions(work)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : paginatedWorks.length === 0 ? (
        <div className="works-empty" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center' }}>
          <FileText size={24} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
          <strong>No works found</strong>
          <span style={{ display: 'block', color: '#64748b', margin: '4px 0 12px 0' }}>Try broadening the current search or filters.</span>
          <button
            onClick={() => {
              setStatusColFilter('all');
              setStateColFilter('all');
              setSectorColFilter('all');
              setSignalColFilter('all');
              setTableSearch('');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="works-grid">
          {paginatedWorks.map((work) => (
            <article className="work-card" key={work.id} onClick={() => inspectWork(work)}>
              <div className="work-card__topline"><span className="work-id">{work.id}</span><span className={`work-status ${statusClass[work.status]}`}>{work.status}</span></div>
              <h3>{work.title}</h3>
              <p>{work.district}, {work.state} · {work.constituency}</p>
              <div className="work-card__meta"><span className="work-sector">{work.sectorName}</span>{renderSignal(work)}</div>
              <div className="work-card__funding"><span><small>Sanctioned</small><strong>₹ {work.sanctionedAmt.toFixed(2)} Cr</strong></span><span><small>Spent</small><strong>₹ {work.expenditureAmt.toFixed(2)} Cr</strong></span></div>
              <div className="work-progress"><span><strong>{work.physicalProgress}%</strong> physical progress</span><div><i style={{ width: `${work.physicalProgress}%` }} /></div></div>
              <div className="work-card__footer"><span>{work.agency}</span>{renderActions(work)}</div>
            </article>
          ))}
        </div>
      )}

      <footer className="works-pagination">
        <span>Showing <strong>{firstItem}–{lastItem}</strong> of <strong>{sortedWorks.length}</strong> works</span>
        <div>
          <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}><ChevronLeft size={16} />Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next<ChevronRight size={16} /></button>
        </div>
      </footer>
    </section>
  );
}

export default WorksTable;
