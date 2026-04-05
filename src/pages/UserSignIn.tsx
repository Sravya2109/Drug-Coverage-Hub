import React, { useState } from "react";
import "/src/styles/AuthPages.css";
import { Eye, EyeOff, UserRound } from "lucide-react";

const UserSignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-top user-accent">
          <div className="auth-icon-wrap">
            <UserRound size={28} />
          </div>
          <h1>User Sign In</h1>
          <p>Sign in to view your coverage details</p>
        </div>

        <form className="auth-form">
          <div className="form-group">
            <label htmlFor="user-signin-email">Email</label>
            <input
              id="user-signin-email"
              type="email"
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-signin-password">Password</label>
            <div className="password-field">
              <input
                id="user-signin-password"
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

          <button type="submit" className="primary-btn user-btn">
            Sign In
          </button>

          <p className="auth-switch-text">
            New user? <button type="button" className="text-btn inline-btn">Create account</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default UserSignIn;