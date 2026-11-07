export default function Header() {
  return (
    <header className="app-header">
      <a className="skip-link" href="#main-content">Skip to voice controls</a>
      <div className="header-title"><span className="header-indicator" aria-hidden="true" /><div><span className="eyebrow">ChillZone / Audio systems</span><h1>Boli Yantra</h1></div></div>
      <span className="system-badge"><span aria-hidden="true">●</span> Local synthesis unit</span>
    </header>
  );
}
