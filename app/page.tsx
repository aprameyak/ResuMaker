import Link from 'next/link';
import { FiFileText, FiUpload, FiTarget, FiStar, FiZap, FiShield } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <FiFileText className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Create Professional
              <span className="block text-blue-600">Resumes with AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Build, optimize, and tailor your resume for specific job descriptions using advanced AI technology. 
              Stand out from the crowd with professionally crafted resumes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/create" 
                className="btn-primary text-lg px-8 py-4"
              >
                Get Started Free
              </Link>
              <Link 
                href="/upload" 
                className="btn-secondary text-lg px-8 py-4"
              >
                Upload Existing Resume
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="section bg-white">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools to create, enhance, and customize your resume for any job opportunity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/create" className="feature-card group">
              <div className="feature-icon">
                <FiFileText className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Create Resume
              </h3>
              <p className="text-gray-600 mb-4">
                Start building your professional resume from scratch with our intuitive builder and AI-powered suggestions.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Get Started
                <FiZap className="ml-2 w-4 h-4" />
              </div>
            </Link>

            <Link href="/upload" className="feature-card group">
              <div className="feature-icon">
                <FiUpload className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Upload & Enhance
              </h3>
              <p className="text-gray-600 mb-4">
                Upload your existing resume and let our AI enhance it with better descriptions and formatting.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Upload Now
                <FiZap className="ml-2 w-4 h-4" />
              </div>
            </Link>

            <Link href="/tailor" className="feature-card group">
              <div className="feature-icon">
                <FiTarget className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Tailor for Jobs
              </h3>
              <p className="text-gray-600 mb-4">
                Customize your resume for specific job descriptions to increase your chances of getting hired.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Start Tailoring
                <FiZap className="ml-2 w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="section bg-gray-50">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why choose ResuMaker?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiStar className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Enhancement</h3>
                    <p className="text-gray-600">Get intelligent suggestions to improve your resume content and make it more impactful.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FiShield className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Professional Templates</h3>
                    <p className="text-gray-600">Choose from multiple professional templates designed to impress recruiters.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <FiTarget className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Job-Specific Tailoring</h3>
                    <p className="text-gray-600">Optimize your resume for specific job descriptions to increase your chances.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="h-8 bg-blue-100 rounded w-24"></div>
                    <div className="h-8 bg-green-100 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section bg-blue-600">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to create your professional resume?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of job seekers who have successfully landed their dream jobs with ResuMaker.
          </p>
          <Link 
            href="/create" 
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-lg"
          >
            Start Building Now
            <FiZap className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
