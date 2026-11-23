'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

const LINKS = [
  { href: '/create', label: 'Create' },
  { href: '/upload', label: 'Upload' },
  { href: '/tailor', label: 'Tailor' },
];

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav style={{
      backgroundColor: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '56px'
        }}>
          <Link href="/" style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text)',
            textDecoration: 'none'
          }}>
            ResuMaker
          </Link>

          {/* Desktop Navigation */}
          <div style={{ display: 'none', alignItems: 'center', gap: '24px' }} className="desktop-nav">
            {user ? (
              <>
                {LINKS.map(l => (
                  <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
                ))}
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                  {user.email}
                </span>
                <button onClick={handleSignOut} className="btn-secondary" style={{ minHeight: '40px', padding: '6px 14px', fontSize: '15px' }}>
                  <FiLogOut aria-hidden="true" style={{ width: '16px', height: '16px' }} />
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/auth" className="btn" style={{ minHeight: '40px', padding: '6px 16px', fontSize: '15px' }}>
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div style={{ display: 'block' }} className="mobile-nav">
            <button
              className="btn-icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <FiX style={{ width: '22px', height: '22px' }} /> : <FiMenu style={{ width: '22px', height: '22px' }} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0 16px' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {LINKS.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="nav-link"
                    style={{ minHeight: '44px' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                <div style={{ paddingTop: '12px', marginTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px', overflowWrap: 'anywhere' }}>
                    {user.email}
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <FiLogOut aria-hidden="true" style={{ width: '16px', height: '16px' }} />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                className="btn"
                style={{ width: '100%' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
