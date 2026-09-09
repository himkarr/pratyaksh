import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
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

type SortField = 'dateSanctioned' | 'sanctionedAmt' | 'physicalProgress' | 'id';
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
  const [sortField, setSortField] = useState<SortField>('dateSanctioned');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const flagMap = useMemo(() => {
    const map = new Map<string, string>();
    flags.forEach((flag) => {
      if (!map.has(flag.project_id) || flag.severity === 'critical') map.set(flag.project_id, flag.severity);
    });
    return map;
  }, [flags]);

  const searchedWorks = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    if (!query) return works;

    return works.filter((work) => [
      work.id,
      work.title,
      work.mpName,
      work.contractor,
      work.agency,
      work.district,
      work.state,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [works, tableSearch]);

  const sortedWorks = useMemo(() => [...searchedWorks].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

      {paginatedWorks.length === 0 ? (
        <div className="works-empty">
          <FileText size={24} />
          <strong>No works found</strong>
          <span>Try broadening the current search or filters.</span>
        </div>
      ) : viewMode === 'list' ? (
        <div className="works-list-wrap">
          <table className="works-list">
            <thead>
              <tr>
                <th><button onClick={() => handleSort('id')}>Work <ArrowUpDown size={13} /></button></th>
                <th>Project & location</th>
                <th>Classification</th>
                <th className="works-list__numeric"><button onClick={() => handleSort('sanctionedAmt')}>Sanction <ArrowUpDown size={13} /></button></th>
                <th className="works-list__progress"><button onClick={() => handleSort('physicalProgress')}>Progress <ArrowUpDown size={13} /></button></th>
                <th>Audit</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {paginatedWorks.map((work) => (
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
              ))}
            </tbody>
          </table>
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
