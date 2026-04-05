import React, { useState } from "react";
import "/src/styles/AuthPages.css";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const AdminSignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-top admin-accent">
          <div className="auth-icon-wrap">
            <ShieldCheck size={28} />
          </div>
          <h1>Admin Sign In</h1>
          <p>Access the admin portal</p>
        </div>

        <form className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-signin-email">Email</label>
            <input
              id="admin-signin-email"
              type="email"
              placeholder="admin@drugcoveragehub.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-signin-password">Password</label>
            <div className="password-field">
              <input
                id="admin-signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label className="checkbox-row">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <button type="button" className="text-btn">
              Forgot password?
            </button>
          </div>

          <button type="submit" className="primary-btn admin-btn">
            Sign In
          </button>

          <p className="auth-switch-text">
            Need admin access? <button type="button" className="text-btn inline-btn">Create account</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminSignIn;