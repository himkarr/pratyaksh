import React, { useState, useMemo } from 'react';
import { 
  Download, Printer, Eye, Star, ChevronLeft, ChevronRight, 
  ArrowUpDown, AlertTriangle, CheckCircle2, FileText, Search, ExternalLink 
} from 'lucide-react';
import { WorkItem } from '../data/mpladsData';
import { DeadlineForecastBadge } from './DeadlineForecastBadge';
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

export function WorksTable({
  works,
  flags,
  onViewAttachments,
  onViewReviews,
  onInspectWork,
  selectedStatusFilter: _selectedStatusFilter,
  setSelectedStatusFilter: _setSelectedStatusFilter,
  t
}: WorksTableProps) {
  const [sortField, setSortField] = useState<'dateSanctioned' | 'sanctionedAmt' | 'physicalProgress' | 'id'>('dateSanctioned');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableSearch, setTableSearch] = useState('');

  // Anomaly flag lookup
  const flagMap = useMemo(() => {
    const map = new Map<string, string>();
    flags.forEach(f => {
      if (!map.has(f.project_id) || f.severity === 'critical') {
        map.set(f.project_id, f.severity);
      }
    });
    return map;
  }, [flags]);

  // Filtered by table search
  const searchedWorks = useMemo(() => {
    if (!tableSearch.trim()) return works;
    const q = tableSearch.toLowerCase();
    return works.filter(w => 
      w.id.toLowerCase().includes(q) ||
      w.title.toLowerCase().includes(q) ||
      w.mpName.toLowerCase().includes(q) ||
      w.contractor.toLowerCase().includes(q) ||
      w.agency.toLowerCase().includes(q) ||
      w.district.toLowerCase().includes(q)
    );
  }, [works, tableSearch]);

  // Sorted works
  const sortedWorks = useMemo(() => {
    return [...searchedWorks].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchedWorks, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedWorks.length / pageSize) || 1;
  const paginatedWorks = sortedWorks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: 'dateSanctioned' | 'sanctionedAmt' | 'physicalProgress' | 'id') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Work ID', 'State', 'District', 'Constituency', 'MP Name', 'Work Title', 'Sector', 'Sanctioned (Cr)', 'Expenditure (Cr)', 'Physical Progress (%)', 'Sanction Date', 'Status', 'Agency', 'Contractor'];
    const rows = sortedWorks.map(w => [
      w.id,
      w.state,
      w.district,
      w.constituency,
      `"${w.mpName}"`,
      `"${w.title.replace(/"/g, '""')}"`,
      `"${w.sectorName}"`,
      w.sanctionedAmt,
      w.expenditureAmt,
      w.physicalProgress,
      w.dateSanctioned,
      w.status,
      `"${w.agency}"`,
      `"${w.contractor}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MPLADS_Works_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="gov-card" style={{ margin: '14px 0' }}>
      {/* Header Bar */}
      <div className="gov-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="gov-card-title">
          <FileText size={16} color="var(--gov-primary)" />
          <span>{t.worksDirectory}</span>
          <span className="gov-badge gov-badge-neutral" style={{ fontSize: '0.7rem' }}>
            {sortedWorks.length} Records
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Inline Quick Search */}
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search ID, title, contractor..."
              value={tableSearch}
              onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '4px 8px 4px 26px',
                fontSize: '0.74rem',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                width: '180px'
              }}
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="gov-btn gov-btn-secondary"
            style={{ fontSize: '0.76rem', padding: '5px 10px' }}
            title="Download CSV Table"
          >
            <Download size={12} />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="gov-btn gov-btn-secondary"
            style={{ fontSize: '0.76rem', padding: '5px 10px' }}
            title="Print Official Record"
          >
            <Printer size={12} />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      <div className="gov-card-body" style={{ padding: '0' }}>
        {/* Table */}
        <div className="gov-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', width: '105px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Work ID</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th>Work Description & Location</th>
                <th>Sector</th>
                <th onClick={() => handleSort('sanctionedAmt')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <span>Sanction (₹ Cr)</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Exp (₹ Cr)</th>
                <th onClick={() => handleSort('physicalProgress')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>Progress</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th onClick={() => handleSort('dateSanctioned')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>Sanction Date</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ textAlign: 'center' }}>1-Yr Compliance</th>
                <th style={{ textAlign: 'center' }}>Audit Signal</th>
                <th style={{ textAlign: 'center', width: '135px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWorks.map((work) => {
                const hasFlag = flagMap.has(work.id);
                const flagSeverity = flagMap.get(work.id);
                const hasDeadlineRisk = work.status === 'Delayed' || (work.physicalProgress < 25 && work.financialProgress > 60);

                const deadlineProbability = 
                  work.status === 'Completed' ? 0.02 :
                  work.status === 'Delayed' ? 0.89 :
                  (work.physicalProgress < 25 && work.financialProgress > 50) ? 0.78 :
                  work.physicalProgress >= 65 ? 0.14 : 0.42;

                return (
                  <tr key={work.id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => onInspectWork && onInspectWork(work)}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: 700, color: 'var(--gov-primary)' }}>
                        {work.id}
                      </span>
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '1px' }}>
                        {work.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {work.constituency}, {work.state} · <b>MP:</b> {work.mpName} · <b>Agency:</b> {work.agency} {work.contractor ? <>· <b style={{ color: 'var(--gov-primary)' }}>Contractor:</b> {work.contractor}</> : null}
                      </div>
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)}>
                      <span className="gov-badge gov-badge-neutral">
                        {work.sectorName}
                      </span>
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)} style={{ textAlign: 'right', fontWeight: 700 }}>
                      ₹ {work.sanctionedAmt.toFixed(2)}
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)} style={{ textAlign: 'right', color: 'var(--text-body)' }}>
                      ₹ {work.expenditureAmt.toFixed(2)}
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)} style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '40px',
                          height: '4px',
                          background: 'var(--border-light)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${work.physicalProgress}%`,
                            height: '100%',
                            background: work.physicalProgress === 100 ? 'var(--status-success-text)' : 'var(--gov-primary)'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{work.physicalProgress}%</span>
                      </div>
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)} style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {work.dateSanctioned}
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)} style={{ textAlign: 'center' }}>
                      <DeadlineForecastBadge probability={deadlineProbability} />
                    </td>
                    <td onClick={() => onInspectWork && onInspectWork(work)} style={{ textAlign: 'center' }}>
                      {hasFlag ? (
                        <span className={`gov-badge ${flagSeverity === 'critical' ? 'gov-badge-danger' : 'gov-badge-warning'}`} style={{ fontSize: '0.66rem' }}>
                          <AlertTriangle size={9} /> {flagSeverity?.toUpperCase()}
                        </span>
                      ) : (
                        <span className="gov-badge gov-badge-success" style={{ fontSize: '0.66rem' }}>
                          <CheckCircle2 size={9} /> Clear
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '3px' }}>
                        <button
                          onClick={() => onInspectWork && onInspectWork(work)}
                          className="gov-btn gov-btn-secondary"
                          style={{ padding: '2px 5px', fontSize: '0.68rem' }}
                          title="Open Work Dossier"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => onViewAttachments(work)}
                          className="gov-btn gov-btn-secondary"
                          style={{ padding: '2px 5px', fontSize: '0.68rem' }}
                          title="View Geotagged Proof"
                        >
                          <Eye size={10} />
                        </button>
                        <button
                          onClick={() => onViewReviews(work)}
                          className="gov-btn gov-btn-secondary"
                          style={{ padding: '2px 5px', fontSize: '0.68rem' }}
                          title="Social Audit Ratings"
                        >
                          <Star size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'var(--bg-surface-subtle)',
          borderTop: '1px solid var(--border-light)',
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            Showing <b>{(currentPage - 1) * pageSize + 1}</b> to <b>{Math.min(currentPage * pageSize, sortedWorks.length)}</b> of <b>{sortedWorks.length}</b> works
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gov-btn gov-btn-secondary"
              style={{ padding: '3px 7px', fontSize: '0.72rem' }}
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <span style={{ padding: '0 6px', fontWeight: 700, color: 'var(--text-main)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gov-btn gov-btn-secondary"
              style={{ padding: '3px 7px', fontSize: '0.72rem' }}
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
export default WorksTable;
