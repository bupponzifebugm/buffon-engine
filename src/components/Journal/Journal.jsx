import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Save, Trash2, Image, Type, Bold, Italic, List, Search } from 'lucide-react';

export default function Journal({ notes, activeNote, onCreateNote, onOpenNote, onUpdateNote, onDeleteNote, onUploadImage }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('');
  const debounceRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (note.title || '').toLowerCase().includes(q);
    const contentMatch = (note.content || '').toLowerCase().includes(q);
    const dateStr = new Date(note.created_at || note.id).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).toLowerCase();
    const dateMatch = dateStr.includes(q);
    
    return titleMatch || contentMatch || dateMatch;
  });

  // When activeNote changes, update editor content
  useEffect(() => {
    if (activeNote && editorRef.current) {
      editorRef.current.innerHTML = activeNote.content || '';
    }
  }, [activeNote?.id]);

  const handleAutoSave = useCallback(() => {
    if (!activeNote) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const titleEl = document.getElementById('noteTitle');
      const title = titleEl ? titleEl.value : activeNote.title;
      const content = editorRef.current ? editorRef.current.innerHTML : '';

      onUpdateNote(activeNote.id, { title, content });
      setSaveStatus('✓ Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);
  }, [activeNote, onUpdateNote]);

  function handleForceSave() {
    if (!activeNote) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const titleEl = document.getElementById('noteTitle');
    const title = titleEl ? titleEl.value : activeNote.title;
    const content = editorRef.current ? editorRef.current.innerHTML : '';

    onUpdateNote(activeNote.id, { title, content });
    setSaveStatus('✓ Saved');
    setTimeout(() => setSaveStatus(''), 2000);
  }

  function formatDoc(cmd, value = null) {
    document.execCommand(cmd, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleAutoSave();
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      return;
    }

    try {
      const url = await onUploadImage(file);
      if (url) {
        formatDoc('insertImage', url);
      }
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDelete() {
    if (!activeNote) return;
    if (confirm('Delete this journal entry?')) {
      onDeleteNote(activeNote.id);
    }
  }

  // Handle paste for images
  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file && onUploadImage) {
          onUploadImage(file).then(url => {
            if (url) formatDoc('insertImage', url);
          }).catch(err => {
            console.error('Paste upload failed:', err);
          });
        }
        return;
      }
    }
  }

  // Handle drag & drop for images
  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/') && onUploadImage) {
      onUploadImage(file).then(url => {
        if (url) formatDoc('insertImage', url);
      }).catch(err => {
        console.error('Drop upload failed:', err);
      });
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  return (
    <div className="journal-layout">
      {/* Sidebar */}
      <div className="journal-sidebar">
        <button className="btn" onClick={onCreateNote} style={{ margin: 0, padding: 10 }}>
          <Plus size={14} /> New Journal Entry
        </button>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          My Notes
        </div>
        
        <div className="journal-search">
          <Search size={14} className="journal-search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="journal-search-input"
          />
        </div>

        <div className="journal-list">
          {filteredNotes.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 12, textAlign: 'center' }}>
              {searchQuery ? 'No matching notes found.' : 'No notes yet.'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`journal-item${activeNote?.id === note.id ? ' active' : ''}`}
                onClick={() => onOpenNote(note.id)}
              >
                <div className="journal-item-title">{note.title || 'Untitled Entry'}</div>
                <div className="journal-item-date">
                  {new Date(note.created_at || note.id).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short'
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor */}
      {activeNote ? (
        <div className="journal-main">
          <input
            type="text"
            id="noteTitle"
            className="journal-title-input"
            placeholder="Untitled Entry"
            defaultValue={activeNote.title || ''}
            onInput={handleAutoSave}
            key={activeNote.id + '-title'}
          />

          <div className="journal-toolbar">
            <button onClick={() => formatDoc('formatBlock', 'H1')} title="Heading 1">
              <Type size={14} />1
            </button>
            <button onClick={() => formatDoc('formatBlock', 'H2')} title="Heading 2">
              <Type size={14} />2
            </button>
            <button onClick={() => formatDoc('bold')} title="Bold">
              <Bold size={14} />
            </button>
            <button onClick={() => formatDoc('italic')} title="Italic">
              <Italic size={14} />
            </button>
            <button onClick={() => formatDoc('insertUnorderedList')} title="List">
              <List size={14} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Upload Image">
              <Image size={14} /> Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            <div style={{ flex: 1 }} />
            <button
              onClick={handleDelete}
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent' }}
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={handleForceSave}
              style={{ borderColor: 'var(--success)', color: 'var(--success)', background: 'var(--success-bg)' }}
            >
              <Save size={12} /> Save
            </button>
          </div>

          <div
            ref={editorRef}
            className="journal-editor"
            contentEditable
            suppressContentEditableWarning
            onInput={handleAutoSave}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            placeholder="Start typing your thesis, daily reflections, or drag & drop images here..."
            key={activeNote.id + '-editor'}
          />

          {saveStatus && (
            <div className="note-save-status">{saveStatus}</div>
          )}
        </div>
      ) : (
        <div className="journal-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-state" style={{ border: 'none' }}>
            Select a note from the sidebar or create a new one.
          </div>
        </div>
      )}
    </div>
  );
}
