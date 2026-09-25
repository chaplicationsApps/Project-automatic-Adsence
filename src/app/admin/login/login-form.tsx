"use client";

import { useActionState } from "react";
import { signIn } from "../actions";
import styles from "../admin.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, { error: null });

  return (
    <form action={action} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required aria-describedby={state.error ? "login-error" : undefined} />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" maxLength={4096} required aria-describedby={state.error ? "login-error" : undefined} />
      </div>
      {state.error && <p id="login-error" className={styles.error} role="alert">{state.error}</p>}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Accediendo…" : "Entrar al panel"}
      </button>
      <p className={styles.help}>Acceso reservado a la cuenta administradora del proyecto.</p>
    </form>
  );
}
