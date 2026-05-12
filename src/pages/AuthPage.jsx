import AuthLayout from '../components/Auth/AuthLayout';

/**
 * AuthPage Component
 * 
 * A simple wrapper component that serves as the main authentication page.
 * This page is used for both /login and /register routes.
 * 
 * The AuthPage handles:
 * - Route entry point for authentication flows
 * - Renders the split-screen AuthLayout component
 * - Manages the toggle between login and register forms
 * 
 * @returns {JSX.Element} The AuthLayout component with split-screen design
 */
export default function AuthPage() {
  return <AuthLayout />;
}
