export default function ChatLog({ history, onClear }) {
  return (
    <section className="panel chat-log" aria-labelledby="history-heading">
      <div className="panel-header"><span className="eyebrow">Channel 03</span><h2 id="history-heading">Transmission log</h2></div>
      <p className="panel-note">Local playback history. No messages are sent.</p>
      <div className="chat-history" aria-live="polite">
        {!history.length ? <div className="empty-state"><span aria-hidden="true">⌁</span><p>Channel open.</p><small>Play a clip or speak your first line.</small></div> : <ol>{history.map(item => <li key={item.id} className="chat-message"><div className="chat-timestamp"><strong>{item.title}</strong><time>{item.time}</time></div><p>{item.text}</p><span className="log-status">Playback started</span></li>)}</ol>}
      </div>
      <div className="log-footer"><span>{history.length} events this session</span><button className="text-button" type="button" disabled={!history.length} onClick={onClear}>Clear log</button></div>
    </section>
  );
}
