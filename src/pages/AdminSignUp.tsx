import React, { useState } from "react";
import "/src/styles/AuthPages.css";
import { Eye, EyeOff, ShieldPlus } from "lucide-react";

const AdminSignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-top admin-accent">
          <div className="auth-icon-wrap">
            <ShieldPlus size={28} />
          </div>
          <h1>Admin Sign Up</h1>
          <p>Create an administrator account</p>
        </div>

        <form className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-signup-name">Full Name</label>
            <input
              id="admin-signup-name"
              type="text"
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-signup-email">Work Email</label>
            <input
              id="admin-signup-email"
              type="email"
              placeholder="admin@drugcoveragehub.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-signup-role">Role</label>
            <input
              id="admin-signup-role"
              type="text"
              placeholder="System Administrator"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-signup-password">Password</label>
            <div className="password-field">
              <input
                id="admin-signup-password"
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
            <label htmlFor="admin-signup-confirm-password">Confirm Password</label>
            <input
              id="admin-signup-confirm-password"
              type="password"
              placeholder="Confirm password"
            />
          </div>

          <label className="checkbox-row checkbox-full">
            <input type="checkbox" />
            <span>I agree to the platform terms and admin access policies</span>
          </label>

          <button type="submit" className="primary-btn admin-btn">
            Create Admin Account
          </button>

          <p className="auth-switch-text">
            Already have an account? <button type="button" className="text-btn inline-btn">Sign in</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminSignUp;