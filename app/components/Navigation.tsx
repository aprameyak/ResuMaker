'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

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
      backgroundColor: 'white',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          <Link href="/" style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2563eb',
            textDecoration: 'none'
          }}>
            ResuMaker
          </Link>
          
          {/* Desktop Navigation */}
          <div style={{ display: 'none', alignItems: 'center', gap: '32px' }} className="desktop-nav">
            {user ? (
              <>
                <Link 
                  href="/create" 
                  style={{
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  Create
                </Link>
                <Link 
                  href="/upload" 
                  style={{
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  Upload
                </Link>
                <Link 
                  href="/tailor" 
                  style={{
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  Tailor
                </Link>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginLeft: '16px',
                  paddingLeft: '16px',
                  borderLeft: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiUser style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                    </div>
                    <span style={{ color: '#374151', fontWeight: '500' }}>{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6b7280',
                      border: 'none',
                      background: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    title="Sign out"
                  >
                    <FiLogOut style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/auth" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#4f46e5',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div style={{ display: 'block' }} className="mobile-nav">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                color: '#6b7280',
                border: 'none',
                background: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {isMenuOpen ? <FiX style={{ width: '24px', height: '24px' }} /> : <FiMenu style={{ width: '24px', height: '24px' }} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '16px 0'
          }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link 
                  href="/create" 
                  style={{
                    display: 'block',
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create
                </Link>
                <Link 
                  href="/upload" 
                  style={{
                    display: 'block',
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Upload
                </Link>
                <Link 
                  href="/tailor" 
                  style={{
                    display: 'block',
                    color: '#6b7280',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tailor
                </Link>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiUser style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                    </div>
                    <span style={{ color: '#374151', fontWeight: '500' }}>{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6b7280',
                      border: 'none',
                      background: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <FiLogOut style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/auth" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#4f46e5',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
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
