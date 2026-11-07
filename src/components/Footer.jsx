export default function Footer({ busy, status }) {
  return <footer className="app-footer"><span>Engine: <strong>{busy ? 'Processing' : 'Standby'}</strong></span><span>Output: <strong>{status === 'playing' ? 'Live' : 'Idle'}</strong></span><span>Text stays on this device</span></footer>;
}
