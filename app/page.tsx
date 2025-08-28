import Link from 'next/link';
import { FiFileText, FiUpload, FiTarget, FiStar, FiZap, FiShield } from 'react-icons/fi';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)'
    }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px',
          paddingTop: '80px',
          paddingBottom: '64px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#dbeafe',
                borderRadius: '50%'
              }}>
                <FiFileText style={{ width: '48px', height: '48px', color: '#2563eb' }} />
              </div>
            </div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '24px'
            }}>
              Create Professional
              <span style={{ display: 'block', color: '#2563eb' }}>Resumes with AI</span>
            </h1>
            <p style={{
              fontSize: '20px',
              color: '#4b5563',
              marginBottom: '32px',
              maxWidth: '768px',
              margin: '0 auto 32px auto'
            }}>
              Build, optimize, and tailor your resume for specific job descriptions using advanced AI technology. 
              Stand out from the crowd with professionally crafted resumes.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Link 
                href="/create" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#4f46e5',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Get Started Free
              </Link>
              <Link 
                href="/upload" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#4f46e5',
                  backgroundColor: '#eef2ff',
                  border: '1px solid transparent',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Upload Existing Resume
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '64px 16px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Everything you need to succeed
            </h2>
            <p style={{
              fontSize: '20px',
              color: '#4b5563',
              maxWidth: '672px',
              margin: '0 auto'
            }}>
              Powerful tools to create, enhance, and customize your resume for any job opportunity.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            <Link href="/create" style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
              textDecoration: 'none',
              display: 'block'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiFileText style={{ width: '100%', height: '100%' }} />
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                Create Resume
              </h3>
              <p style={{
                color: '#4b5563',
                marginBottom: '16px'
              }}>
                Start building your professional resume from scratch with our intuitive builder and AI-powered suggestions.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#2563eb',
                fontWeight: '500'
              }}>
                Get Started
                <FiZap style={{ marginLeft: '8px', width: '16px', height: '16px' }} />
              </div>
            </Link>

            <Link href="/upload" style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
              textDecoration: 'none',
              display: 'block'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiUpload style={{ width: '100%', height: '100%' }} />
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                Upload & Enhance
              </h3>
              <p style={{
                color: '#4b5563',
                marginBottom: '16px'
              }}>
                Upload your existing resume and let our AI enhance it with better descriptions and formatting.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#2563eb',
                fontWeight: '500'
              }}>
                Upload Now
                <FiZap style={{ marginLeft: '8px', width: '16px', height: '16px' }} />
              </div>
            </Link>

            <Link href="/tailor" style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
              textDecoration: 'none',
              display: 'block'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiTarget style={{ width: '100%', height: '100%' }} />
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                Tailor for Jobs
              </h3>
              <p style={{
                color: '#4b5563',
                marginBottom: '16px'
              }}>
                Customize your resume for specific job descriptions to increase your chances of getting hired.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#2563eb',
                fontWeight: '500'
              }}>
                Start Tailoring
                <FiZap style={{ marginLeft: '8px', width: '16px', height: '16px' }} />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div style={{ padding: '64px 16px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '48px',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '24px'
              }}>
                Why choose ResuMaker?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiStar style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                    </div>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>AI-Powered Enhancement</h3>
                    <p style={{ color: '#4b5563' }}>Get intelligent suggestions to improve your resume content and make it more impactful.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#dcfce7',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiShield style={{ width: '16px', height: '16px', color: '#16a34a' }} />
                    </div>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Professional Templates</h3>
                    <p style={{ color: '#4b5563' }}>Choose from multiple professional templates designed to impress recruiters.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#f3e8ff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiTarget style={{ width: '16px', height: '16px', color: '#9333ea' }} />
                    </div>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Job-Specific Tailoring</h3>
                    <p style={{ color: '#4b5563' }}>Optimize your resume for specific job descriptions to increase your chances.</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '32px',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '75%' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '50%' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '83%' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '67%' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '80%' }}></div>
                </div>
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ height: '32px', backgroundColor: '#dbeafe', borderRadius: '4px', width: '96px' }}></div>
                    <div style={{ height: '32px', backgroundColor: '#dcfce7', borderRadius: '4px', width: '80px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: '64px 16px', backgroundColor: '#2563eb' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px'
          }}>
            Ready to create your professional resume?
          </h2>
          <p style={{
            color: '#dbeafe',
            marginBottom: '32px',
            fontSize: '18px'
          }}>
            Join thousands of job seekers who have successfully landed their dream jobs with ResuMaker.
          </p>
          <Link 
            href="/create" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '16px 32px',
              backgroundColor: 'white',
              color: '#2563eb',
              fontWeight: '600',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '18px'
            }}
          >
            Start Building Now
            <FiZap style={{ marginLeft: '8px', width: '20px', height: '20px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
