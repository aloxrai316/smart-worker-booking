import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card narrow" style={{ textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p className="muted">{String(this.state.error.message || this.state.error)}</p>
        <button className="btn btn-primary" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>Reload page</button>
      </div>
    );
  }
}
