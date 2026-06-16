import { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Trash2, Edit2, X } from 'lucide-react';
import { fmtDate } from '../../lib/utils';

export default function ConfidentLog({ receipts, onAddReceipt, onDeleteReceipt, onUpdateReceipt, onUploadImage }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states (used for both Add and Edit)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState([]); // array of URLs
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Reset form helper
  function resetForm() {
    setTitle('');
    setDescription('');
    setImageUrls([]);
    setIsAdding(false);
    setEditingId(null);
  }

  // Open Edit Mode
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

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '32px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>Confident Receipts</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          This journal is to build confidence when things go rough or having a mental breakdown of the thoughts of being "untalented" or unprofitable. Playing the long-term process.
        </p>
        {!isAdding && !editingId && (
          <button className="btn" style={{ marginTop: 20 }} onClick={() => { resetForm(); setIsAdding(true); }}>
            <Plus size={16} /> Add New Receipt
          </button>
        )}
      </div>

      {/* Form (for both Adding and Editing if editingId is not mapped inline, but we want it sticky or inline) */}
      {(isAdding || editingId === 'NEW_IF_WE_WANT_MODAL') && (
        <div className="card mistake-form" style={{ marginBottom: 24 }}>
          <div className="card-title">New Confident Receipt</div>
          
          <div className="field">
            <label>Title (e.g., Profit on March 2026)</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="A milestone or big win to remember..."
            />
          </div>
          
          <div className="field">
            <label>Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
              placeholder="Why was this a great execution? What did it prove?"
            />
          </div>

          <div className="field">
            <label>Proof / Screenshots</label>
            
            {imageUrls.length > 0 && (
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
                {imageUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="Proof" style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'var(--danger)', color: 'white', border: 'none', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div 
              className="journal-image-upload" 
              onClick={() => fileInputRef.current?.click()}
              style={{ opacity: isUploading ? 0.5 : 1, padding: '16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              <ImageIcon size={24} style={{ marginBottom: 8, color: 'var(--accent)' }} />
              <div>{isUploading ? 'Uploading...' : 'Click to add screenshot (you can add multiple)'}</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn secondary" onClick={resetForm} style={{ marginTop: 0 }}>Cancel</button>
            <button className="btn" onClick={handleSubmit} style={{ marginTop: 0 }}>Save Receipt</button>
          </div>
        </div>
      )}

      <div className="confident-gallery">
        {receipts.length === 0 && !isAdding ? (
          <div className="empty-state">No confident receipts logged yet. Start building your hall of fame.</div>
        ) : (
          receipts.map(receipt => {
            
            // IF EDITING INLINE
            if (editingId === receipt.id) {
              return (
                <div key={receipt.id} className="confident-card card mistake-form" style={{ border: '1px solid var(--accent)' }}>
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
                      <div>{isUploading ? 'Uploading...' : 'Click to add screenshot (you can add multiple)'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button className="btn secondary" onClick={resetForm} style={{ marginTop: 0 }}>Cancel</button>
                    <button className="btn" onClick={handleSubmit} style={{ marginTop: 0 }}>Save Changes</button>
                  </div>
                </div>
              );
            }

            // READ-ONLY DISPLAY
            const rUrls = receipt.image_url ? receipt.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];
            
            return (
              <div key={receipt.id} className="confident-card card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--text-primary)' }}>
                    {receipt.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => startEditing(receipt)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                      title="Edit Receipt"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Delete this receipt?')) onDeleteReceipt(receipt.id);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                      title="Delete Receipt"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                
                {receipt.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: rUrls.length > 0 ? 16 : 0, whiteSpace: 'pre-wrap' }}>
                    {receipt.description}
                  </p>
                )}
                
                {rUrls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {rUrls.map((u, i) => (
                      <div key={i} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={u} alt={`${receipt.title} proof ${i+1}`} style={{ width: '100%', display: 'block' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Hidden file input for inline editors to share */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
}
