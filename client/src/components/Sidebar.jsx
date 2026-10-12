export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  return (
    <aside className="sidebar">
      <button className="new-chat" onClick={onNew}>+ New chat</button>
      <ul>
        {conversations.map((c) => (
          <li key={c._id} className={c._id === activeId ? 'active' : ''} onClick={() => onSelect(c._id)}>
            <span>{c.title}</span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(c._id); }}>×</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}