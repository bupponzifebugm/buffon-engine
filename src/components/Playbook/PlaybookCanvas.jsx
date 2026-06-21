import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function PlaybookCanvas() {
  return (
    <div className="card playbook-container" style={{ display: 'flex', flexDirection: 'column', height: '80vh', padding: 0, overflow: 'hidden' }}>
      <div className="card-title" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        Chart Playbook Canvas
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: 12 }}>
          (Powered by tldraw — Auto-saved locally)
        </span>
      </div>
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: '600px' }}>
        <Tldraw persistenceKey="buffon-playbook" />
      </div>
    </div>
  );
}
