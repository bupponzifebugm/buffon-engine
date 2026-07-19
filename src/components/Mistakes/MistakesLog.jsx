import { useState, useRef } from 'react';
import { Receipt, Trash2, TrendingDown, AlertTriangle, Edit2, Image as ImageIcon, X, Folder, ChevronLeft, PlayCircle } from 'lucide-react';
import StoryViewer from '../Cards/StoryViewer';
import { MISTAKE_TYPES, MISTAKE_SOLUTIONS } from '../../lib/constants';
import { fmtRp, fmtDate } from '../../lib/utils';
import GraveyardVisualizer from './GraveyardVisualizer';

function getMostCommonMistake(mistakes) {
  if (!mistakes || mistakes.length === 0) return '—';
  const freq = {};
  mistakes.forEach((m) => {
    const t = m.mistake_type || 'Unknown';
    freq[t] = (freq[t] || 0) + 1;
  });
  let maxType = '';
  let maxCount = 0;
  Object.entries(freq).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  });
  return maxType;
}

const getEmptyForm = () => ({
  ticker: '',
  mistake_type: '',
  tuition_loss: '',
  notes: '',
  action_plan: '',
  date: new Date().toISOString().split('T')[0],
});

export default function MistakesLog({ mistakes, onAddMistake, onDeleteMistake, onUpdateMistake, onUploadImage }) {
  const [form, setForm] = useState(getEmptyForm());
  const [editingId, setEditingId] = useState(null);
  
  // Folder state
  const [activeFolder, setActiveFolder] = useState(null); // 'YYYY-MM'
  const [isStoryModeOpen, setIsStoryModeOpen] = useState(false);

  // Image Upload state
  const [imageUrls, setImageUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const totalTuition = (mistakes || []).reduce(
    (sum, m) => sum + (parseFloat(m.tuition_loss) || 0),
    0
  );
  const totalCount = (mistakes || []).length;
  const mostCommon = getMostCommonMistake(mistakes);

  // Group mistakes into folders
  const folders = (mistakes || []).reduce((acc, m) => {
    const dateStr = m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString();
    const folderKey = dateStr.substring(0, 7); // 'YYYY-MM'
    
    if (!acc[folderKey]) {
      // Create a nice display name like "June 2026"
      const dateObj = new Date(dateStr);
      const displayName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      acc[folderKey] = {
        id: folderKey,
        name: displayName,
        count: 0,
        tuition: 0,
        items: []
      };
    }
    
    acc[folderKey].count += 1;
    acc[folderKey].tuition += parseFloat(m.tuition_loss) || 0;
    acc[folderKey].items.push(m);
    
    return acc;
  }, {});

  // Sort folders descending
  const sortedFolderKeys = Object.keys(folders).sort((a, b) => b.localeCompare(a));

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) {
        setImageUrls(prev => [...prev, url]);
      }
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemoveImage(indexToRemove) {
    setImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
  }

  function resetForm() {
    setForm(getEmptyForm());
    setImageUrls([]);
    setEditingId(null);
  }

  function startEditing(m) {
    setEditingId(m.id);
    setForm({
      ticker: m.ticker || '',
      mistake_type: m.mistake_type || '',
      tuition_loss: m.tuition_loss || '',
      notes: m.notes || '',
      action_plan: m.action_plan || '',
      date: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    const urls = m.image_url ? m.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];
    setImageUrls(urls);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!form.ticker || !form.mistake_type) return;

    const finalImageUrl = imageUrls.join(',');

    const payload = {
      ticker: form.ticker.toUpperCase(),
      mistake_type: form.mistake_type,
      tuition_loss: parseFloat(form.tuition_loss) || 0,
      notes: form.notes,
      action_plan: form.action_plan,
      image_url: finalImageUrl,
    };

    if (form.date) {
       const existingTime = editingId 
          ? mistakes.find(m => m.id === editingId)?.created_at?.split('T')[1] || '12:00:00Z'
          : '12:00:00Z';
       payload.created_at = `${form.date}T${existingTime}`;
    }

    if (editingId) {
      onUpdateMistake(editingId, payload);
    } else {
      payload.created_at = payload.created_at || new Date().toISOString();
      onAddMistake(payload);
    }

    resetForm();
  }  const renderMistakeCard = (m) => {
    const mUrls = m.image_url ? m.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];
    return (
      <div 
        key={m.id} 
        className="mistake-receipt" 
        style={{ 
          background: 'var(--bg-tertiary)', 
          border: '1px dashed var(--border-strong)', 
          borderRadius: '8px', 
          padding: '24px',
          fontFamily: 'var(--font-mono), monospace',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        {/* RUNGKAD / PAID Stamp */}
        <div style={{
          position: 'absolute',
          top: '30px',
          right: '35px',
          border: '3px double var(--danger)',
          color: 'var(--danger)',
          borderRadius: '4px',
          textTransform: 'uppercase',
          transform: 'rotate(-18deg)',
          fontWeight: '900',
          padding: '6px 12px',
          fontSize: '13px',
          letterSpacing: '3px',
          opacity: 0.25,
          pointerEvents: 'none',
          zIndex: 5,
          background: 'rgba(239, 68, 68, 0.05)',
          fontFamily: 'sans-serif'
        }}>
          RUNGKAD!
        </div>

        {/* Receipt Header Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', userSelect: 'none' }}>======================================</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--text-primary)' }}>MISTAKE TUITION RECEIPT</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', userSelect: 'none' }}>======================================</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>ITEM: </span>
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{m.ticker}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—'}
          </div>
        </div>

        <div style={{ fontSize: '12px', marginBottom: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
          <span style={{ color: 'var(--text-secondary)' }}>MISTAKE: </span>
          <span style={{ fontWeight: 'bold' }}>{m.mistake_type}</span>
        </div>

        <div style={{ borderBottom: '1px dashed var(--border-strong)', marginBottom: '12px' }} />

        {/* Description body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          {m.notes && (
            <div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>[WHAT_HAPPENED]</span>
              <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{m.notes}</p>
            </div>
          )}
          {m.action_plan && (
            <div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>[NEXT_ACTION_PLAN]</span>
              <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap', color: 'var(--accent)' }}>{m.action_plan}</p>
            </div>
          )}

          {mUrls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '6px' }}>
              {mUrls.map((u, i) => (
                <img key={i} src={u} alt="Insight proof" style={{ width: '100%', borderRadius: '4px', border: '1px solid var(--border)' }} />
              ))}
            </div>
          )}

          {m.mistake_type && MISTAKE_SOLUTIONS[m.mistake_type] && (
            <div style={{
              marginTop: '6px',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.05)',
              borderLeft: '2px solid var(--danger)',
              fontSize: '11px',
              lineHeight: '1.4'
            }}>
              <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>💡 SYSTEM WORKAROUND:</span> {MISTAKE_SOLUTIONS[m.mistake_type]}
            </div>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed var(--border-strong)', marginTop: '12px', marginBottom: '12px' }} />

        {/* Bottom Tuition Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TUITION TAX:</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--danger)' }}>{fmtRp(m.tuition_loss || 0)}</div>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn-small"
              onClick={() => startEditing(m)}
              title="Edit receipt"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 10px', fontSize: '11px', borderRadius: '4px' }}
            >
              <Edit2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit
            </button>
            <button
              className="btn-small"
              onClick={() => {
                if(confirm(`Void receipt for ${m.ticker}?`)) onDeleteMistake(m.id);
              }}
              title="Void receipt"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer', padding: '6px 10px', fontSize: '11px', borderRadius: '4px' }}
            >
              <Trash2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Void
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── TOP ROW: Dashboard & Form ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* ── Tuition Dashboard ── */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-title">
            <Receipt size={16} />
            Learning Investment
          </div>
          <div className="tuition-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="tuition-stat" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div className="tuition-stat-value" style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>{fmtRp(totalTuition)}</div>
              <div className="tuition-stat-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Total Tuition Paid</div>
            </div>
            <div className="tuition-stat" style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div className="tuition-stat-value" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{totalCount}</div>
              <div className="tuition-stat-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Lessons Logged</div>
            </div>
            <div className="tuition-stat" style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div className="tuition-stat-value most-common" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>{mostCommon}</div>
              <div className="tuition-stat-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Most Frequent Lesson</div>
              {mostCommon && mostCommon !== '—' && MISTAKE_SOLUTIONS[mostCommon] && (
                <div className="tuition-stat-solution" style={{ fontSize: '12px', marginTop: '12px', color: 'var(--accent)', opacity: 0.95, lineHeight: 1.4 }}>
                  <strong>💡 Solution:</strong> {MISTAKE_SOLUTIONS[mostCommon]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Add/Edit Mistake Form ── */}
        <div className="card" style={{ height: '100%', border: editingId ? '1px solid var(--accent)' : undefined }}>
          <div className="card-title">
            <AlertTriangle size={16} />
            {editingId ? 'Edit Insight' : 'Log Growth Insight'}
          </div>
          <form className="mistake-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="field">
                <label>Ticker</label>
                <input
                  type="text"
                  name="ticker"
                  value={form.ticker}
                  onChange={handleChange}
                  placeholder="BREN"
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="field">
                <label>Lesson Category</label>
                <input
                  list="mistake-types"
                  name="mistake_type"
                  value={form.mistake_type}
                  onChange={handleChange}
                  placeholder="Select or type custom category..."
                />
                <datalist id="mistake-types">
                  {(MISTAKE_TYPES || []).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field">
                <label>Tuition Cost (Rp)</label>
                <input
                  type="number"
                  name="tuition_loss"
                  value={form.tuition_loss}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </div>
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field">
              <label>What Happened</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Describe what happened in detail..."
                rows={2}
              />
            </div>

            <div className="field">
              <label>Action Plan / Lesson Learned</label>
              <textarea
                name="action_plan"
                value={form.action_plan}
                onChange={handleChange}
                placeholder="What will you do differently next time?"
                rows={2}
              />
            </div>

            <div className="field">
              <label>Proof / Chart Screenshot</label>
              {imageUrls.length > 0 && (
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
                  {imageUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} alt="Proof" style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                      <button type="button" onClick={() => handleRemoveImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'var(--danger)', color: 'white', border: 'none', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="journal-image-upload" onClick={() => fileInputRef.current?.click()} style={{ opacity: isUploading ? 0.5 : 1, padding: '16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
                <ImageIcon size={20} style={{ marginBottom: 8, color: 'var(--text-secondary)' }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{isUploading ? 'Uploading...' : 'Click to add screenshot'}</div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {editingId && (
                <button type="button" className="btn secondary" onClick={resetForm} style={{ flex: 1 }}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn" disabled={!form.ticker || !form.mistake_type} style={{ flex: 2 }}>
                <Receipt size={16} />
                {editingId ? 'Save Changes' : 'Log Insight'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* ── BOTTOM ROW: Mistake History (Google Drive Folders) ── */}
      <div className="card" style={{ width: '100%' }}>
        
        {/* If no folder selected, show all folders */}
        {!activeFolder && (
          <>
            <div className="card-title">
              <Folder size={16} />
              Discipline Tracker Folders
            </div>

            {(!mistakes || mistakes.length === 0) ? (
              <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No insights logged yet. Start tracking your lessons to grow.
              </div>
            ) : (
              <div className="folders-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                gap: '16px', 
                marginTop: '16px' 
              }}>
                {sortedFolderKeys.map((key) => {
                  const folder = folders[key];
                  return (
                    <div 
                      key={key} 
                      className="folder-card"
                      onClick={() => setActiveFolder(key)}
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '8px', color: 'var(--accent)' }}>
                          <Folder size={24} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>
                          {folder.name}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        <span>{folder.count} lessons</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{fmtRp(folder.tuition)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* If folder selected, show its contents */}
        {activeFolder && (
          <>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => setActiveFolder(null)}
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '6px', 
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  title="Back to Folders"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>{folders[activeFolder]?.name} Lessons</span>
              </div>
              <button
                className="btn-small"
                onClick={() => setIsStoryModeOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              >
                <PlayCircle size={16} /> Play Story Review
              </button>
            </div>

            {isStoryModeOpen && (
              <StoryViewer
                items={folders[activeFolder]?.items || []}
                type="mistake"
                onClose={() => setIsStoryModeOpen(false)}
                onEdit={(m) => {
                  startEditing(m);
                  setIsStoryModeOpen(false);
                }}
                onDelete={onDeleteMistake}
              />
            )}

            <div className="mistake-history" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {folders[activeFolder]?.items.map(renderMistakeCard)}
            </div>
          </>
        )}

      </div>

      {/* ── Graveyard of Mistakes Visualizer ── */}
      <GraveyardVisualizer mistakes={mistakes} />

    </div>
  );
}
