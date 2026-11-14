import { Link } from 'react-router-dom';

// Shared layout for the "Do you need a worker?" / "Do you need work?" pages
export default function InfoPage({ badge, title, intro, help, steps, facts, primary, secondary, other }) {
  return (
    <>
      <p style={{ margin: '14px 0 0' }}><Link to="/">← Back to home</Link></p>
      <section className="hero left">
        <span className="pill">{badge}</span>
        <h1>{title}</h1>
        <p style={{ margin: '0 0 22px' }}>{intro}</p>
        <div className="row">
          <Link to={primary.to} className="btn btn-primary btn-lg">{primary.label}</Link>
          <Link to={secondary.to} className="btn btn-outline-light btn-lg">{secondary.label}</Link>
        </div>
      </section>

      <h2 className="section-title">How we can help you</h2>
      <div className="grid three">
        {help.map(([t, d]) => <div key={t} className="card"><h3>{t}</h3><p className="muted" style={{ margin: 0 }}>{d}</p></div>)}
      </div>

      <h2 className="section-title">How the system works</h2>
      <div className="grid steps">
        {steps.map(([t, d], i) => (
          <div key={t} className={`card step ${facts.hl?.includes(i) ? 'hl' : ''}`}><span className="num">{i + 1}</span><b>{t}</b><small>{d}</small></div>
        ))}
      </div>

      <div className="grid three" style={{ marginTop: 18 }}>
        {facts.items.map(([big, t, d]) => <div key={t} className="card stat"><h3>{big}</h3><b>{t}</b><small>{d}</small></div>)}
      </div>

      <div className="card cta">
        <div><h3 style={{ margin: 0 }}>Ready to get started?</h3><span className="muted">It only takes a minute to create your account.</span></div>
        <div className="row" style={{ marginTop: 0 }}>
          <Link to={primary.to} className="btn btn-primary">{primary.label}</Link>
          <Link to={other.to} className="btn btn-outline">{other.label}</Link>
        </div>
      </div>
    </>
  );
}
