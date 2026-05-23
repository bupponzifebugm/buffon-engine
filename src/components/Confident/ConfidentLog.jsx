import { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { fmtDate } from '../../lib/utils';

export default function ConfidentLog({ receipts, onAddReceipt, onDeleteReceipt, onUploadImage }) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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
        setImageUrl(url);
      }
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit() {
    if (!title) {
      alert('Title is required.');
      return;
    }
    
    onAddReceipt({
      title,
      description,
      image_url: imageUrl
    });
    
    // Reset
    setTitle('');
    setDescription('');
    setImageUrl('');
    setIsAdding(false);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '32px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>Confident Receipts</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          This journal is to build confidence when things go rough or having a mental breakdown of the thoughts of being "untalented" or unprofitable. Playing the long-term process.
        </p>
        {!isAdding && (
          <button className="btn" style={{ marginTop: 20 }} onClick={() => setIsAdding(true)}>
            <Plus size={16} /> Add New Receipt
          </button>
        )}
      </div>

      {isAdding && (
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
            <label>Proof / Screenshot</label>
            {imageUrl ? (
              <div style={{ position: 'relative', marginTop: 8 }}>
                <img src={imageUrl} alt="Proof" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                <button 
                  type="button"
                  onClick={() => setImageUrl('')}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div 
                className="journal-image-upload" 
                onClick={() => fileInputRef.current?.click()}
                style={{ opacity: isUploading ? 0.5 : 1 }}
              >
                <ImageIcon size={24} style={{ marginBottom: 8, color: 'var(--accent)' }} />
                <div>{isUploading ? 'Uploading...' : 'Click to upload screenshot (e.g., portfolio green day)'}</div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn secondary" onClick={() => setIsAdding(false)} style={{ marginTop: 0 }}>Cancel</button>
            <button className="btn" onClick={handleSubmit} style={{ marginTop: 0 }}>Save Receipt</button>
          </div>
        </div>
      )}

      <div className="confident-gallery">
        {receipts.length === 0 && !isAdding ? (
          <div className="empty-state">No confident receipts logged yet. Start building your hall of fame.</div>
        ) : (
          receipts.map(receipt => (
            <div key={receipt.id} className="confident-card card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--text-primary)' }}>
                  {receipt.title}
                </h3>
                <button 
                  onClick={() => {
                    if (confirm('Delete this receipt?')) onDeleteReceipt(receipt.id);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              
              {receipt.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: receipt.image_url ? 16 : 0 }}>
                  {receipt.description}
                </p>
              )}
              
              {receipt.image_url && (
                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={receipt.image_url} alt={receipt.title} style={{ width: '100%', display: 'block' }} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
