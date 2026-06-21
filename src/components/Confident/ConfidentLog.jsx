import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Edit2, Star, GripVertical, Image as ImageIcon, Folder, ChevronLeft, PlayCircle } from 'lucide-react';
import { fmtRp } from '../../lib/utils';
import StoryViewer from '../Cards/StoryViewer';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableReceiptItem({ receipt, isPinned, onTogglePin, onStartEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: receipt.id,
    disabled: isPinned 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative'
  };

  const rUrls = receipt.image_url ? receipt.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];

  return (
    <div ref={setNodeRef} style={style} className={`confident-card card ${isPinned ? 'pinned' : ''} ${isDragging ? 'dragging' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isPinned && (
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 4 }}>
              <GripVertical size={18} />
            </div>
          )}
          <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>{receipt.title}</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button 
            onClick={() => onTogglePin(receipt.id)}
            style={{ background: 'transparent', border: 'none', color: isPinned ? '#fbbf24' : 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
            title={isPinned ? "Unpin" : "Pin to top"}
          >
            <Star size={16} fill={isPinned ? "#fbbf24" : "none"} />
          </button>
          <button 
            onClick={() => onStartEdit(receipt)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
            title="Edit Receipt"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => {
              if (confirm('Delete this receipt?')) onDelete(receipt.id);
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
            title="Delete Receipt"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, paddingLeft: isPinned ? 0 : 30 }}>
        {new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      
      {receipt.description && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: rUrls.length > 0 ? 16 : 0, whiteSpace: 'pre-wrap', paddingLeft: isPinned ? 0 : 30 }}>
          {receipt.description}
        </p>
      )}
      
      {rUrls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: isPinned ? 0 : 30 }}>
          {rUrls.map((u, i) => (
            <div key={i} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={u} alt={`${receipt.title} proof ${i+1}`} style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConfidentLog({ receipts, onAddReceipt, onDeleteReceipt, onUpdateReceipt, onUploadImage }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Folder state
  const [activeFolder, setActiveFolder] = useState(null); // 'YYYY-MM'
  const [isStoryModeOpen, setIsStoryModeOpen] = useState(false);

  // Confidence Jar State
  const [jarEntries, setJarEntries] = useState(() => JSON.parse(localStorage.getItem('buffon_jar_entries') || '[]'));
  const [jarTarget, setJarTarget] = useState(() => parseFloat(localStorage.getItem('buffon_jar_target') || '10000000'));
  const [isAddingToJar, setIsAddingToJar] = useState(false);
  const [jarAmountInput, setJarAmountInput] = useState('');
  const [jarTickerInput, setJarTickerInput] = useState('');
  const [jarDateInput, setJarDateInput] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    localStorage.setItem('buffon_jar_entries', JSON.stringify(jarEntries));
  }, [jarEntries]);

  useEffect(() => {
    localStorage.setItem('buffon_jar_target', jarTarget.toString());
  }, [jarTarget]);

  const totalJarProfit = jarEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
  const fillPercentage = Math.min(100, Math.max(0, (totalJarProfit / jarTarget) * 100));

  function handleAddJarEntry() {
    if (!jarAmountInput || isNaN(jarAmountInput) || !jarTickerInput) {
      alert("Please enter a valid amount and ticker.");
      return;
    }
    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      amount: parseFloat(jarAmountInput),
      ticker: jarTickerInput.toUpperCase(),
      date: jarDateInput
    };
    setJarEntries(prev => [newEntry, ...prev]);
    setJarAmountInput('');
    setJarTickerInput('');
    setIsAddingToJar(false);
  }

  function handleDeleteJarEntry(id) {
    setJarEntries(prev => prev.filter(e => e.id !== id));
  }

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState([]); 
  const [isUploading, setIsUploading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef(null);

  // Persistence for Pins and Ordering
  const [pinnedIds, setPinnedIds] = useState(() => JSON.parse(localStorage.getItem('buffon_pinned_receipts') || '[]'));
  const [receiptOrder, setReceiptOrder] = useState(() => JSON.parse(localStorage.getItem('buffon_receipt_order') || '[]'));

  useEffect(() => {
    localStorage.setItem('buffon_pinned_receipts', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    localStorage.setItem('buffon_receipt_order', JSON.stringify(receiptOrder));
  }, [receiptOrder]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function resetForm() {
    setTitle('');
    setDescription('');
    setImageUrls([]);
    setDate(new Date().toISOString().split('T')[0]);
    setIsAdding(false);
    setEditingId(null);
  }

  function startEditing(receipt) {
    setEditingId(receipt.id);
    setTitle(receipt.title || '');
    setDescription(receipt.description || '');
    setDate(receipt.created_at ? new Date(receipt.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const urls = receipt.image_url ? receipt.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];
    setImageUrls(urls);
    setIsAdding(false);
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

  function handleSubmit() {
    if (!title) {
      alert('Title is required.');
      return;
    }
    
    const finalImageUrl = imageUrls.join(',');
    
    const payload = {
      title,
      description,
      image_url: finalImageUrl
    };
    
    if (date) {
      const existingTime = editingId 
         ? receipts.find(r => r.id === editingId)?.created_at?.split('T')[1] || '12:00:00Z'
         : '12:00:00Z';
      payload.created_at = `${date}T${existingTime}`;
    }

    if (editingId) {
      onUpdateReceipt(editingId, payload);
    } else {
      payload.created_at = payload.created_at || new Date().toISOString();
      onAddReceipt(payload);
    }
    
    resetForm();
  }

  function togglePin(id) {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  // Sort receipts based on custom order, fallback to created_at
  const sortedReceipts = [...receipts].sort((a, b) => {
    const indexA = receiptOrder.indexOf(a.id);
    const indexB = receiptOrder.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Group receipts into folders
  const folders = sortedReceipts.reduce((acc, r) => {
    const dateStr = r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString();
    const folderKey = dateStr.substring(0, 7); // 'YYYY-MM'
    
    if (!acc[folderKey]) {
      const dateObj = new Date(dateStr);
      const displayName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      acc[folderKey] = {
        id: folderKey,
        name: displayName,
        count: 0,
        items: []
      };
    }
    
    acc[folderKey].count += 1;
    acc[folderKey].items.push(r);
    
    return acc;
  }, {});

  const sortedFolderKeys = Object.keys(folders).sort((a, b) => b.localeCompare(a));
  
  // If active folder is set, compute pinned and unpinned just for that folder
  let pinnedReceipts = [];
  let unpinnedReceipts = [];
  if (activeFolder && folders[activeFolder]) {
    pinnedReceipts = folders[activeFolder].items.filter(r => pinnedIds.includes(r.id));
    unpinnedReceipts = folders[activeFolder].items.filter(r => !pinnedIds.includes(r.id));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeIndex = unpinnedReceipts.findIndex(r => r.id === active.id);
      const overIndex = unpinnedReceipts.findIndex(r => r.id === over.id);
      const newUnpinned = arrayMove(unpinnedReceipts, activeIndex, overIndex);
      
      // Update global order. We need to preserve the order of receipts NOT in this folder as well.
      // Easiest way: take existing receiptOrder, filter out the unpinned from THIS folder, 
      // and append them back in the new order.
      const unpinnedIds = unpinnedReceipts.map(r => r.id);
      const filteredOrder = receiptOrder.filter(id => !unpinnedIds.includes(id));
      setReceiptOrder([...filteredOrder, ...newUnpinned.map(r => r.id)]);
    }
  }

  // Renders the Inline Edit Form
  const renderInlineEditForm = () => (
    <div className="confident-card card mistake-form" style={{ border: '1px solid var(--accent)' }}>
      <div className="card-title">Editing Receipt</div>
      <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="field">
          <label>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="field">
        <label>Proof / Screenshots</label>
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
        <div className="journal-image-upload" onClick={() => fileInputRef.current?.click()} style={{ opacity: isUploading ? 0.5 : 1, padding: '16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          <ImageIcon size={24} style={{ marginBottom: 8, color: 'var(--accent)' }} />
          <div>{isUploading ? 'Uploading...' : 'Click to add screenshot'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn secondary" onClick={resetForm} style={{ marginTop: 0 }}>Cancel</button>
        <button className="btn" onClick={handleSubmit} style={{ marginTop: 0 }}>Save Changes</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '32px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>Confident Receipts</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          This journal is to build confidence when things go rough. Play the long-term process.
        </p>
        {!isAdding && !editingId && (
          <button className="btn" style={{ marginTop: 20 }} onClick={() => { resetForm(); setIsAdding(true); }}>
            <Plus size={16} /> Add New Receipt
          </button>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* The Jar Visual */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-title" style={{ alignSelf: 'flex-start', width: '100%' }}>The Confidence Jar</div>
          <div style={{ position: 'relative', marginTop: 20 }}>
            <div style={{
              position: 'relative',
              width: '180px',
              height: '250px',
              border: '4px solid var(--border)',
              borderTop: 'none',
              borderRadius: '0 0 30px 30px',
              background: 'var(--bg-secondary)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
              zIndex: 2
            }}>
              {/* Liquid fill container with rounded bottom */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '0 0 26px 26px',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${fillPercentage}%`,
                  background: 'linear-gradient(to top, var(--success), #4ade80)',
                  transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: 0.85
                }} />
              </div>
              
              {/* Total Profit Overlay */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                width: '100%',
                zIndex: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>TOTAL WINS</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {fmtRp(totalJarProfit)}
                </div>
              </div>
            </div>

            {/* Labels outside the jar */}
            {jarEntries.slice(0, 8).map((entry, idx) => {
              const topPos = 30 + (idx * 25);
              const isLeft = idx % 2 === 0;
              return (
                <div key={entry.id} style={{
                  position: 'absolute',
                  top: topPos,
                  [isLeft ? 'right' : 'left']: '50%',
                  marginLeft: isLeft ? 0 : '90px',
                  marginRight: isLeft ? '90px' : 0,
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 1,
                  whiteSpace: 'nowrap'
                }}>
                  {isLeft ? (
                    <>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{entry.ticker}</strong> +{fmtRp(entry.amount)}
                      </div>
                      <div style={{ width: '30px', height: '1px', background: 'var(--border)', marginLeft: '8px' }} />
                    </>
                  ) : (
                    <>
                      <div style={{ width: '30px', height: '1px', background: 'var(--border)', marginRight: '8px' }} />
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{entry.ticker}</strong> +{fmtRp(entry.amount)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            Target: Rp 
            <input 
              type="number" 
              value={jarTarget}
              onChange={(e) => setJarTarget(parseFloat(e.target.value) || 1)}
              style={{ width: 120, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4 }}
            />
          </div>
        </div>

        {/* Jar Controls & History */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>Win History</div>
            <button className="btn-small" onClick={() => setIsAddingToJar(!isAddingToJar)}>
              <Plus size={14} /> Add Win
            </button>
          </div>

          {isAddingToJar && (
            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ticker</label>
                  <input type="text" className="input-field" value={jarTickerInput} onChange={e => setJarTickerInput(e.target.value)} placeholder="e.g. BBCA" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
                  <input type="date" className="input-field" value={jarDateInput} onChange={e => setJarDateInput(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Profit (Rp)</label>
                <input type="number" className="input-field" value={jarAmountInput} onChange={e => setJarAmountInput(e.target.value)} placeholder="500000" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1 }} onClick={handleAddJarEntry}>Add to Jar</button>
                <button className="btn secondary" onClick={() => setIsAddingToJar(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jarEntries.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Jar is empty. Log a win!</div>
            ) : (
              jarEntries.map(entry => (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>+ {fmtRp(entry.amount)}</span>
                      <span style={{ fontSize: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4 }}>{entry.ticker}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{new Date(entry.date).toLocaleDateString()}</div>
                  </div>
                  <button 
                    onClick={() => handleDeleteJarEntry(entry.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isAdding && !editingId && (
        <div className="card mistake-form" style={{ marginBottom: 24 }}>
          <div className="card-title">New Confident Receipt</div>
          <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label>Title (e.g., Profit on March 2026)</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="A milestone or big win to remember..." />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Description (Optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Why was this a great execution? What did it prove?" />
          </div>
          <div className="field">
            <label>Proof / Screenshots</label>
            {imageUrls.length > 0 && (
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
                {imageUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="Proof" style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                    <button type="button" onClick={() => handleRemoveImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'var(--danger)', color: 'white', border: 'none', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="journal-image-upload" onClick={() => fileInputRef.current?.click()} style={{ opacity: isUploading ? 0.5 : 1, padding: '16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
              <ImageIcon size={24} style={{ marginBottom: 8, color: 'var(--accent)' }} />
              <div>{isUploading ? 'Uploading...' : 'Click to add screenshot'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn secondary" onClick={resetForm} style={{ marginTop: 0 }}>Cancel</button>
            <button className="btn" onClick={handleSubmit} style={{ marginTop: 0 }}>Save Receipt</button>
          </div>
        </div>
      )}

      {/* Folders View */}
      <div className="card" style={{ width: '100%' }}>
        {!activeFolder && (
          <>
            <div className="card-title">
              <Folder size={16} />
              Confident Folders
            </div>

            {(!receipts || receipts.length === 0) ? (
              <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No confident receipts logged yet. Start building your hall of fame.
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
                        <span>{folder.count} receipts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Single Folder View */}
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
                <span>{folders[activeFolder]?.name} Receipts</span>
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
                type="receipt"
                onClose={() => setIsStoryModeOpen(false)}
                onEdit={(r) => {
                  startEditing(r);
                  setIsStoryModeOpen(false);
                }}
                onDelete={onDeleteReceipt}
              />
            )}

            <div style={{ marginTop: '24px' }}>
              {/* PINNED SECTION inside folder */}
              {pinnedReceipts.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#fbbf24', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                    <Star size={16} fill="#fbbf24" /> Hall of Fame (Pinned)
                  </div>
                  <div className="confident-gallery">
                    {pinnedReceipts.map(receipt => 
                      editingId === receipt.id 
                        ? <div key={receipt.id}>{renderInlineEditForm()}</div> 
                        : <SortableReceiptItem key={receipt.id} receipt={receipt} isPinned={true} onTogglePin={togglePin} onStartEdit={startEditing} onDelete={onDeleteReceipt} />
                    )}
                  </div>
                </div>
              )}

              {/* UNPINNED SECTION inside folder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                Receipt Feed
              </div>
              <div className="confident-gallery">
                {unpinnedReceipts.length === 0 && !isAdding && pinnedReceipts.length === 0 ? (
                  <div className="empty-state">No confident receipts logged yet. Start building your hall of fame.</div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={unpinnedReceipts.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      {unpinnedReceipts.map(receipt => 
                        editingId === receipt.id 
                          ? <div key={receipt.id}>{renderInlineEditForm()}</div> 
                          : <SortableReceiptItem key={receipt.id} receipt={receipt} isPinned={false} onTogglePin={togglePin} onStartEdit={startEditing} onDelete={onDeleteReceipt} />
                      )}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
    </div>
  );
}
