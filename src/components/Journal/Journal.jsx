import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Plus, Save, Trash2, Search } from 'lucide-react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { JOURNAL_TEMPLATES } from '../../lib/constants';
import JournalHeatmap from './JournalHeatmap';

export default function Journal({ notes, activeNote, onCreateNote, onOpenNote, onUpdateNote, onDeleteNote, onUploadImage }) {
  const [saveStatus, setSaveStatus] = useState('');
  const debounceRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [headings, setHeadings] = useState([]);

  // Create the BlockNote editor
  const editor = useCreateBlockNote({
    uploadFile: async (file) => {
      if (onUploadImage) {
        const url = await onUploadImage(file);
        return url || "";
      }
      return "";
    }
  });

  // Extract headings for the Table of Contents
  const extractHeadings = useCallback((blocks) => {
    let h = [];
    for (const block of blocks) {
      if (block.type === 'heading') {
        h.push({
          id: block.id,
          text: block.content?.[0]?.text || 'Untitled Heading',
          level: block.props.level
        });
      }
      if (block.children && block.children.length > 0) {
        h = h.concat(extractHeadings(block.children));
      }
    }
    return h;
  }, []);

  // Update editor content when activeNote changes
  useEffect(() => {
    if (!activeNote || !editor) return;

    const loadContent = async () => {
      if (!activeNote.content) {
        editor.replaceBlocks(editor.document, []);
        setHeadings([]);
        return;
      }

      // Backwards Compatibility: If content is HTML, convert it to blocks
      if (activeNote.content.trim().startsWith('<') && !activeNote.content.trim().startsWith('[')) {
        try {
          const blocks = await editor.tryParseHTMLToBlocks(activeNote.content);
          editor.replaceBlocks(editor.document, blocks);
          setHeadings(extractHeadings(blocks));
        } catch (e) {
          console.error("Failed to parse HTML to blocks", e);
        }
      } else {
        // It's JSON blocks string
        try {
          const blocks = JSON.parse(activeNote.content);
          editor.replaceBlocks(editor.document, blocks);
          setHeadings(extractHeadings(blocks));
        } catch (e) {
          console.error("Failed to parse block JSON", e);
          editor.replaceBlocks(editor.document, []);
          setHeadings([]);
        }
      }
    };
    
    loadContent();
  }, [activeNote?.id, editor, extractHeadings]);

  const handleAutoSave = useCallback(() => {
    if (!activeNote) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const titleEl = document.getElementById('noteTitle');
      const title = titleEl ? titleEl.value : activeNote.title;
      const content = JSON.stringify(editor.document);

      onUpdateNote(activeNote.id, { title, content });
      setSaveStatus('✓ Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);
  }, [activeNote, editor, onUpdateNote]);

  function handleForceSave() {
    if (!activeNote) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const titleEl = document.getElementById('noteTitle');
    const title = titleEl ? titleEl.value : activeNote.title;
    const content = JSON.stringify(editor.document);

    onUpdateNote(activeNote.id, { title, content });
    setSaveStatus('✓ Saved');
    setTimeout(() => setSaveStatus(''), 2000);
  }

  function handleDelete() {
    if (!activeNote) return;
    if (confirm('Delete this journal entry?')) {
      onDeleteNote(activeNote.id);
    }
  }

  const applyTemplate = (label) => {
    if (!activeNote) return;
    const template = JOURNAL_TEMPLATES.find(t => t.label === label);
    if (!template) return;

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    
    // We try to parse the template content (HTML) to blocks
    const renderedContent = template.content.replace('${date}', todayStr);

    const apply = async () => {
      if (editor.document.length > 1 || (editor.document[0]?.content && editor.document[0].content.length > 0)) {
        if (!confirm('This will overwrite current journal content. Continue?')) {
          return;
        }
      }
      
      const blocks = await editor.tryParseHTMLToBlocks(renderedContent);
      editor.replaceBlocks(editor.document, blocks);
      setHeadings(extractHeadings(blocks));

      const newTitle = `${template.label} - ${todayStr}`;
      const titleEl = document.getElementById('noteTitle');
      if (titleEl) {
        titleEl.value = newTitle;
      }
      onUpdateNote(activeNote.id, { title: newTitle, content: JSON.stringify(blocks) });
    };

    apply();
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    // Hide dummy Notion notes from the visible list (using .includes to catch all variations)
    if (note.title && note.title.includes('Journaled externally (Notion)')) {
      return false;
    }

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

  const handleHeadingClick = (id) => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDateClick = (dateStr) => {
    // Ignore dummy notes when clicking a date
    const existingNote = notes.find(n => {
      const d = new Date(n.created_at || n.id);
      const nDateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return nDateStr === dateStr && (!n.title || !n.title.includes('Journaled externally (Notion)'));
    });

    if (existingNote) {
      onOpenNote(existingNote.id);
    } else {
      const template = JOURNAL_TEMPLATES.find(t => t.label === 'Daily End-of-Day Checklist');
      let initialContent = '';
      if (template) {
        const displayDate = new Date(dateStr).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric'
        });
        initialContent = template.content.replace('${date}', displayDate);
      }
      onCreateNote({
        title: `Daily Checklist - ${dateStr}`,
        content: initialContent
      });
    }
  };

  const localTodayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
  // Only look for the specific dummy note for the checkbox state
  const todayNotionNote = notes.find(n => {
     const d = new Date(n.created_at || n.id);
     const nDateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
     return nDateStr === localTodayStr && n.title && n.title.includes('Journaled externally (Notion)');
  });

  const groupedNotes = useMemo(() => {
    const groups = {};
    const orderedKeys = [];
    filteredNotes.forEach(note => {
      const d = new Date(note.created_at || note.id);
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[monthYear]) {
        groups[monthYear] = [];
        orderedKeys.push(monthYear);
      }
      groups[monthYear].push(note);
    });

    return orderedKeys.map(key => ({
      label: key,
      notes: groups[key]
    }));
  }, [filteredNotes]);

  return (
    <div className="journal-layout">
      {/* Sidebar */}
      <div className="journal-sidebar">
        
        {/* EXTERNAL JOURNAL CHECKLIST */}
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: todayNotionNote ? 'var(--success-bg)' : 'var(--bg-secondary)', border: todayNotionNote ? '1px solid var(--success)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
          <input 
            type="checkbox" 
            checked={!!todayNotionNote} 
            onChange={(e) => {
               if (e.target.checked) {
                  onCreateNote({ title: 'Journaled externally (Notion) ✅', content: '[{"type":"paragraph","content":[{"type":"text","text":"I completed my journal in Notion today."}]}]' });
               } else {
                  if (confirm('Unmark today as journaled?')) {
                     onDeleteNote(todayNotionNote.id);
                  }
               }
            }}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--success)' }}
          />
          <div style={{ fontSize: 13, color: todayNotionNote ? 'var(--success)' : 'var(--text-primary)', fontWeight: todayNotionNote ? 'bold' : 'normal', userSelect: 'none' }}>
             {todayNotionNote ? "Journaled Today! 🎯" : "Did you journal in Notion today?"}
          </div>
        </div>

        <JournalHeatmap notes={notes} onDateClick={handleDateClick} />

        <button className="btn" onClick={() => onCreateNote({})} style={{ margin: 0, padding: 10 }}>
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
            groupedNotes.map(group => (
              <div key={group.label} className="journal-month-group">
                <div className="journal-month-header" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 8, paddingLeft: 4, letterSpacing: '0.05em' }}>
                  {group.label}
                </div>
                {group.notes.map(note => {
                  const isActive = activeNote?.id === note.id;
                  return (
                    <div key={note.id}>
                      <div
                        className={`journal-item${isActive ? ' active' : ''}`}
                        onClick={() => onOpenNote(note.id)}
                      >
                        <div className="journal-item-title">{note.title || 'Untitled Entry'}</div>
                        <div className="journal-item-date">
                          {new Date(note.created_at || note.id).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short'
                          })}
                        </div>
                      </div>
                      
                      {/* Table of Contents for Active Note */}
                      {isActive && headings.length > 0 && (
                        <div className="journal-toc">
                          {headings.map((h, i) => (
                            <div 
                              key={h.id + i} 
                              className="toc-item"
                              style={{
                                paddingLeft: `${(h.level - 1) * 12 + 12}px`,
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                paddingTop: '6px',
                                paddingBottom: '6px',
                                cursor: 'pointer',
                                borderLeft: '2px solid transparent',
                              }}
                              onClick={() => handleHeadingClick(h.id)}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.borderLeft = '2px solid var(--accent)';
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.borderLeft = '2px solid transparent';
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {h.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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

          <div className="journal-toolbar" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                applyTemplate(val);
                e.target.value = "";
              }}
              defaultValue=""
              className="template-select"
              style={{
                fontSize: 11,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">⚡ Apply Template</option>
              {JOURNAL_TEMPLATES.map(t => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>

            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 12 }}>
              Type '/' for commands
            </span>
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

          <div className="journal-editor-wrapper">
            <BlockNoteView 
              editor={editor} 
              theme="dark"
              onChange={() => {
                setHeadings(extractHeadings(editor.document));
                handleAutoSave();
              }}
            />
          </div>

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
