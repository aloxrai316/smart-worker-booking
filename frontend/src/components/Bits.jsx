import { img } from '../api.js';

export const Stars = ({ value = 0, count }) => (
  <span className="stars" title={`${value} / 5`}>
    {'★'.repeat(Math.round(value))}<span className="dim">{'★'.repeat(5 - Math.round(value))}</span>
    {count !== undefined && <small> {Number(value).toFixed(1)} ({count})</small>}
  </span>
);

const LABEL = {
  pending: 'Waiting for worker', accepted: 'Accepted – pay Rs. 100', confirmed: 'Confirmed',
  in_progress: 'In progress', completed: 'Completed', rejected: 'Rejected', expired: 'Expired', cancelled: 'Cancelled',
};
export const Status = ({ s }) => <span className={`badge st-${s}`}>{LABEL[s] || s}</span>;

export const Avatar = ({ src, name, size = 56 }) =>
  src ? <img className="avatar" style={{ width: size, height: size }} src={img(src)} alt={name} />
      : <div className="avatar ph" style={{ width: size, height: size, fontSize: size / 2.4 }}>{name?.[0]?.toUpperCase()}</div>;

export const Alert = ({ msg, type = 'error' }) => msg ? <div className={`alert ${type}`}>{msg}</div> : null;

export const Modal = ({ icon = '🎉', title, children }) => (
  <div className="modal-back">
    <div className="modal">
      <div className="modal-icon">{icon}</div>
      <h2>{title}</h2>
      {children}
    </div>
  </div>
);
