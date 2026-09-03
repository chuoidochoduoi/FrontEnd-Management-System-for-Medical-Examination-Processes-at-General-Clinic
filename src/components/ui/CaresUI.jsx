import { forwardRef } from 'react';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';

export const CaresButton = forwardRef(function CaresButton(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, children, className = '', disabled, ...props }, ref
) {
  return (
    <button ref={ref} type="button" className={`cares-button is-${variant} is-${size} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle className="cares-spin" size={18} /> : Icon ? <Icon size={18} /> : null}
      <span>{children}</span>
    </button>
  );
});

export function CaresCard({ children, className = '', ...props }) {
  return <section className={`cares-card ${className}`} {...props}>{children}</section>;
}

export function CaresPageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={`cares-page-header ${className}`}>
      <div>{eyebrow && <span className="cares-page-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="cares-page-actions">{actions}</div>}
    </div>
  );
}

export const CaresField = forwardRef(function CaresField(
  { label, error, hint, required, className = '', children, ...inputProps }, ref
) {
  const id = inputProps.id || inputProps.name;
  return (
    <label className={`cares-field ${error ? 'has-error' : ''} ${className}`} htmlFor={id}>
      {label && <span className="cares-field-label">{label}{required && <b aria-hidden="true"> *</b>}</span>}
      {children || <input ref={ref} {...inputProps} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />}
      {error ? <span className="cares-field-error" id={`${id}-error`}><AlertCircle size={14} />{error}</span> : hint ? <span className="cares-field-hint">{hint}</span> : null}
    </label>
  );
});

export function CaresState({ type = 'empty', title, description, action }) {
  const Icon = type === 'loading' ? LoaderCircle : type === 'error' ? AlertCircle : Inbox;
  return (
    <div className={`cares-state is-${type}`} role={type === 'error' ? 'alert' : undefined}>
      <Icon className={type === 'loading' ? 'cares-spin' : ''} size={34} />
      {title && <h3>{title}</h3>}{description && <p>{description}</p>}{action}
    </div>
  );
}
