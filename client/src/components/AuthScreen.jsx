import { useState } from 'react';
import { MailIcon, LockIcon, UserIcon, CheckIcon } from './Icons';

export function AuthScreen({ onLogin, onSignup }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (mode === 'signup') {
      if (!formData.name.trim()) errs.name = 'Full name is required';
      else if (formData.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid work email';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        errs.confirmPassword = 'Confirm password is required';
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(formData.email.trim(), formData.password);
      } else {
        await onSignup({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }
    } catch (err) {
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const fieldErrors = {};
        err.details.forEach(({ field, message }) => {
          if (field) fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setServerError('');
    setLoading(true);
    try {
      await onLogin('demo@merucrm.com', 'Password123!');
    } catch (err) {
      setServerError(err.message || 'Failed to authenticate demo account. Please register a new account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-editorial-viewport">
      <div className="auth-split-wrapper">
        {/* Left: Deep Forest Brand Canvas */}
        <div className="auth-editorial-showcase">
          <div className="showcase-brand-mark">
            <div className="showcase-monogram">M</div>
            <div className="showcase-brand-label">
              <span className="brand-name">Meru CRM</span>
              <span className="brand-role">Sales Pipeline Workbench</span>
            </div>
          </div>

          <div className="showcase-hero-copy">
            <h2 className="showcase-headline">
              Engineered for velocity. Built for deal momentum.
            </h2>
            <p className="showcase-manifesto">
              A bespoke, multi-tenant lead management environment built with zero-lag SQLite persistence, direct pipeline manipulation, and progressive disclosure workflows.
            </p>
          </div>

          <div className="showcase-pillars-list">
            <div className="pillar-item">
              <span className="pillar-bullet">✦</span>
              <div className="pillar-text">
                <strong>Isolated Multi-Tenant Security:</strong> Every user’s leads are strictly bounded and scoped in persistent storage.
              </div>
            </div>
            <div className="pillar-item">
              <span className="pillar-bullet">✦</span>
              <div className="pillar-text">
                <strong>Apple HIG Usability:</strong> Instant direct manipulation, unsaved changes safeguards, and keyboard fluidity.
              </div>
            </div>
            <div className="pillar-item">
              <span className="pillar-bullet">✦</span>
              <div className="pillar-text">
                <strong>Zero Native Build Burden:</strong> Native SQLite performance via standard Node.js architecture.
              </div>
            </div>
          </div>

          <div className="showcase-footer-note">
            <span>Meru Technosoft Full Stack Assessment • Production Edition</span>
          </div>
        </div>

        {/* Right: Warm Stone Authentication Card */}
        <div className="auth-editorial-form-panel">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h1 className="auth-form-title">
                {mode === 'login' ? 'Sign in to workspace' : 'Create your workspace'}
              </h1>
              <p className="auth-form-subtitle">
                {mode === 'login'
                  ? 'Access your private sales pipeline and lead telemetry'
                  : 'Start tracking deals with an isolated multi-tenant ledger'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="auth-segmented-tabs" role="tablist">
              <button
                type="button"
                className={`auth-segment-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setMode('login');
                  setErrors({});
                  setServerError('');
                }}
                role="tab"
                aria-selected={mode === 'login'}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-segment-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setErrors({});
                  setServerError('');
                }}
                role="tab"
                aria-selected={mode === 'signup'}
              >
                Create Account
              </button>
            </div>

            {/* Alert Banner */}
            {serverError && (
              <div className="auth-error-banner" role="alert">
                <span className="auth-error-icon">⚠️</span>
                <span className="auth-error-text">{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="auth-form-body">
              {mode === 'signup' && (
                <div className="auth-field-group">
                  <label className="auth-field-label" htmlFor="auth-name">
                    Full Name
                  </label>
                  <div className="auth-input-wrap">
                    <UserIcon size={14} className="auth-leading-icon" />
                    <input
                      id="auth-name"
                      name="name"
                      type="text"
                      placeholder="Maya Sharma"
                      className={`auth-input-field ${errors.name ? 'input-error' : ''}`}
                      value={formData.name}
                      onChange={handleInputChange}
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && <span className="auth-field-error">{errors.name}</span>}
                </div>
              )}

              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-email">
                  Work Email
                </label>
                <div className="auth-input-wrap">
                  <MailIcon size={14} className="auth-leading-icon" />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    placeholder="maya@company.com"
                    className={`auth-input-field ${errors.email ? 'input-error' : ''}`}
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <LockIcon size={14} className="auth-leading-icon" />
                  <input
                    id="auth-password"
                    name="password"
                    type="password"
                    placeholder="••••••••••••"
                    className={`auth-input-field ${errors.password ? 'input-error' : ''}`}
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>

              {mode === 'signup' && (
                <div className="auth-field-group">
                  <label className="auth-field-label" htmlFor="auth-confirm-password">
                    Confirm Password
                  </label>
                  <div className="auth-input-wrap">
                    <LockIcon size={14} className="auth-leading-icon" />
                    <input
                      id="auth-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••••••"
                      className={`auth-input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="auth-field-error">{errors.confirmPassword}</span>
                  )}
                </div>
              )}

              <button type="submit" className="btn-forest-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>{mode === 'login' ? 'Signing in…' : 'Creating workspace…'}</span>
                  </>
                ) : mode === 'login' ? (
                  'Sign In to Pipeline'
                ) : (
                  'Create My Workspace'
                )}
              </button>
            </form>

            {/* Quick Demo Access */}
            <div className="auth-divider">
              <span>OR EVALUATE DEMONSTRATION DATA</span>
            </div>

            <button
              type="button"
              className="btn-demo-warm"
              onClick={handleDemoLogin}
              disabled={loading}
              title="Sign in with pre-seeded demo user (demo@merucrm.com)"
            >
              <div className="demo-warm-left">
                <span className="demo-kicker">1-CLICK DEMO</span>
                <span className="demo-account-label">Open Seeded Account (11 Leads)</span>
              </div>
              <span className="demo-warm-arrow">→</span>
            </button>

            <div className="auth-security-badge">
              <CheckIcon size={13} className="security-icon" />
              <span>Multi-tenant data isolation: Each user only accesses their own leads.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
