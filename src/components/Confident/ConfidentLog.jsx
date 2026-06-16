import { useState, useRef, useEffect } from 'react';
import { Plus, Image as ImageIcon, Trash2, Edit2, X, Star, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableReceiptItem({ receipt, isPinned, onTogglePin, onStartEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: receipt.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
  };

  const rUrls = receipt.image_url ? receipt.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];

  return (
    <div ref={setNodeRef} style={style} className="confident-card card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Drag Handle - Only active if NOT pinned */}
          {!isPinned && (
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              <GripVertical size={18} />
            </div>
          )}
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--text-primary)' }}>
            {receipt.title}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => onTogglePin(receipt.id)}
            style={{ background: 'transparent', border: 'none', color: isPinned ? '#fbbf24' : 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
            title={isPinned ? "Unpin Receipt" : "Pin to Top"}
          >
            <Star size={16} fill={isPinned ? '#fbbf24' : 'none'} />
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

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState([]); 
  const [isUploading, setIsUploading] = useState(false);
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
    setIsAdding(false);
    setEditingId(null);
  }

  function startEditing(receipt) {
    setEditingId(receipt.id);
    setTitle(receipt.title || '');
    setDescription(receipt.description || '');
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

    if (editingId) {
      onUpdateReceipt(editingId, {
        title,
        description,
        image_url: finalImageUrl
      });
    } else {
      onAddReceipt({
        title,
        description,
        image_url: finalImageUrl
      });
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

  const pinnedReceipts = sortedReceipts.filter(r => pinnedIds.includes(r.id));
  const unpinnedReceipts = sortedReceipts.filter(r => !pinnedIds.includes(r.id));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeIndex = unpinnedReceipts.findIndex(r => r.id === active.id);
      const overIndex = unpinnedReceipts.findIndex(r => r.id === over.id);
      const newUnpinned = arrayMove(unpinnedReceipts, activeIndex, overIndex);
      const newOrder = [...pinnedReceipts.map(r=>r.id), ...newUnpinned.map(r=>r.id)];
      setReceiptOrder(newOrder);
    }
  }

  // Renders the Inline Edit Form
  const renderInlineEditForm = () => (
    <div className="confident-card card mistake-form" style={{ border: '1px solid var(--accent)' }}>
      <div className="card-title">Editing Receipt</div>
      <div className="field">
        <label>Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
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

      {isAdding && !editingId && (
        <div className="card mistake-form" style={{ marginBottom: 24 }}>
          {/* Exact same form layout as inline edit */}
          <div className="card-title">New Confident Receipt</div>
          <div className="field">
            <label>Title (e.g., Profit on March 2026)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="A milestone or big win to remember..." />
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

      {/* PINNED SECTION */}
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

      {/* UNPINNED SECTION (DRAGGABLE) */}
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
      
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
    </div>
  );
}
