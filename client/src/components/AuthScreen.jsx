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
    <div className="auth-viewport-wrapper">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-brand-logo">M</div>
          <h1 className="auth-brand-title">Meru CRM</h1>
          <p className="auth-brand-subtitle">
            {mode === 'login'
              ? 'Sign in to access your isolated sales pipeline'
              : 'Create your private CRM workspace'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs-group" role="tablist">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
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
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
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

        {/* Auth Form */}
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

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" />
                <span>{mode === 'login' ? 'Signing in…' : 'Creating account…'}</span>
              </>
            ) : mode === 'login' ? (
              'Sign In to Dashboard'
            ) : (
              'Create My Workspace'
            )}
          </button>
        </form>

        {/* Demo Account Quick Access */}
        <div className="auth-divider">
          <span>OR QUICK ACCESS</span>
        </div>

        <button
          type="button"
          className="btn-demo-account"
          onClick={handleDemoLogin}
          disabled={loading}
          title="Sign in with pre-seeded demo user (demo@merucrm.com)"
        >
          <span className="demo-badge">1-Click</span>
          <span>Open Seeded Demo Account (11 Leads)</span>
        </button>

        {/* Security & Isolation Callout */}
        <div className="auth-isolation-notice">
          <CheckIcon size={13} className="text-emerald" />
          <span>Multi-tenant data isolation: Each user only sees their own leads.</span>
        </div>
      </div>
    </div>
  );
}
