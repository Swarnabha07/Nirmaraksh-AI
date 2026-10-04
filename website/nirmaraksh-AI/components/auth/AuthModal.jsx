"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { redirectAfterAuthentication, signInWithGithub, signInWithGoogle, signUpWithEmail } from "@/lib/auth/authClient";
import s from "./AuthModal.module.css";

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { name: "", email: "", password: "", confirm: "" };

function validate({ name, email, password, confirm }) {
  const errors = {};
  if (!name.trim()) errors.name = "Enter your name.";
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter a password.";
  if (!confirm) errors.confirm = "Confirm your password.";
  else if (password && confirm !== password) errors.confirm = "Passwords don't match.";
  return errors;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function Field({ id, label, type = "text", autoComplete, value, error, onChange, inputRef }) {
  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <p id={`${id}-error`} className={s["field-error"]}>{error}</p>}
    </div>
  );
}

export default function AuthModal({ onClose }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const nameRef = useRef(null);
  const [view, setView] = useState("choose");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab") return;
      const items = dialog.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    const target = view === "email" ? nameRef.current : dialogRef.current.querySelector("[data-provider]");
    target?.focus();
  }, [view]);

  function goTo(nextView) {
    setView(nextView);
    setErrors({});
    setMessage("");
  }

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function runProvider(handler) {
    setBusy(true);
    setMessage("");
    const result = await handler();
    setBusy(false);
    if (!result.ok) setMessage(result.message);
  }

  async function submitEmail(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    setMessage("");
    const result = await signUpWithEmail({ name: form.name.trim(), email: form.email.trim(), password: form.password });
    setBusy(false);
    if (result.ok) {
      onClose();
      redirectAfterAuthentication(router);
    } else {
      setMessage(result.message);
    }
  }

  return (
    <div className={s.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className={s.top}>
          {view === "email" ? (
            <button type="button" className={s.back} onClick={() => goTo("choose")}>← Back</button>
          ) : (
            <span className={s.eyebrow}>NIRMARAKSH AI</span>
          )}
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">×</button>
        </div>

        <h2 id="auth-title">{view === "email" ? "Create your account" : "Get started"}</h2>
        <p className={s.lede}>
          {view === "email" ? "Sign up with your email address." : "Sign up to open your Nirmaraksh AI workspace."}
        </p>

        {view === "choose" ? (
          <div className={s.providers}>
            <button type="button" data-provider disabled={busy} onClick={() => runProvider(signInWithGoogle)}><GoogleIcon />Sign up with Google</button>
            <button type="button" disabled={busy} onClick={() => runProvider(signInWithGithub)}><GithubIcon />Sign up with GitHub</button>
            <button type="button" disabled={busy} onClick={() => goTo("email")}><MailIcon />Sign up using Email</button>
          </div>
        ) : (
          <form className={s.form} onSubmit={submitEmail} noValidate>
            <Field id="auth-name" label="Name" autoComplete="name" value={form.name} error={errors.name} onChange={update("name")} inputRef={nameRef} />
            <Field id="auth-email" label="Email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={update("email")} />
            <Field id="auth-password" label="Password" type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={update("password")} />
            <Field id="auth-confirm" label="Confirm Password" type="password" autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={update("confirm")} />
            <button type="submit" className={s.submit} disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
          </form>
        )}

        {message && <p className={s.notice} role="alert">{message}</p>}
      </section>
    </div>
  );
}
