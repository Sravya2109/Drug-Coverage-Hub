import React, { useState } from "react";
import "/src/styles/AuthPages.css";
import { Eye, EyeOff, UserPlus } from "lucide-react";

const UserSignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-top user-accent">
          <div className="auth-icon-wrap">
            <UserPlus size={28} />
          </div>
          <h1>User Sign Up</h1>
          <p>Create your account to access policy information</p>
        </div>

        <form className="auth-form">
          <div className="form-group">
            <label htmlFor="user-signup-name">Full Name</label>
            <input
              id="user-signup-name"
              type="text"
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-signup-email">Email</label>
            <input
              id="user-signup-email"
              type="email"
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-signup-password">Password</label>
            <div className="password-field">
              <input
                id="user-signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
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

          <div className="form-group">
            <label htmlFor="user-signup-confirm-password">Confirm Password</label>
            <input
              id="user-signup-confirm-password"
              type="password"
              placeholder="Confirm password"
            />
          </div>

          <label className="checkbox-row checkbox-full">
            <input type="checkbox" />
            <span>I agree to the terms and privacy policy</span>
          </label>

          <button type="submit" className="primary-btn user-btn">
            Create Account
          </button>

          <p className="auth-switch-text">
            Already have an account? <button type="button" className="text-btn inline-btn">Sign in</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default UserSignUp;