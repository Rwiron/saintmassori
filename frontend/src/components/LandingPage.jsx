import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import schoolLogo from '../assets/logo/school.png'

const LandingPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const faqs = [
    {
      question: "What is the Montessori method?",
      answer: "The Montessori method is a child-centered educational approach based on scientific observations of children. It emphasizes hands-on learning, self-directed activity, and collaborative play."
    },
    {
      question: "What age groups do you serve?",
      answer: "We serve children from 18 months to 12 years old, with programs for Toddlers, Primary (3-6), and Elementary (6-12) age groups."
    },
    {
      question: "How do I enroll my child?",
      answer: "You can start the enrollment process by scheduling a school visit, completing our online application, and meeting with our admissions team."
    },
    {
      question: "What are your school hours?",
      answer: "Our school operates Monday through Friday, 8:00 AM to 3:00 PM, with extended care available from 7:00 AM to 6:00 PM."
    },
    {
      question: "Do you offer financial assistance?",
      answer: "Yes, we offer need-based financial assistance and flexible payment plans. Please contact our admissions office for more information."
    }
  ]

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleEnterPortal = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Ultra Modern Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg ring-1 ring-gray-100">
              <img 
                src={schoolLogo} 
                alt="Saint Maria Montessori School" 
                className="h-7 w-7"
              />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">Saint Maria</span>
          </div>
          
          {/* Desktop Enter Portal Button */}
          <button 
            onClick={handleEnterPortal}
            className="hidden md:flex px-6 py-2.5 bg-[#03a002] text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-300 hover:scale-105"
          >
            Enter Portal
          </button>
          
          {/* Mobile Hamburger Menu */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleEnterPortal()
                }}
                className="w-full px-6 py-3 bg-[#03a002] text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-300 text-center"
              >
                Enter Portal
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Ultra Modern Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 bg-gradient-to-br from-gray-50 via-white to-green-50">
        {/* Modern Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#03a002]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-100/50 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#03a002]/3 to-green-100/30 rounded-full blur-3xl"></div>
        </div>

        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-32 left-20 w-4 h-4 bg-[#03a002] rounded-full"></div>
          <div className="absolute top-48 right-32 w-6 h-6 border-2 border-[#03a002] rounded-full"></div>
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-[#03a002] rounded-full"></div>
          <div className="absolute bottom-60 right-1/4 w-8 h-8 border border-[#03a002] rotate-45"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          {/* Modern Logo */}
          <div className="mb-12">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl mx-auto mb-8 flex items-center justify-center ring-1 ring-gray-100">
              <img 
                src={schoolLogo} 
                alt="Saint Maria Montessori School" 
                className="h-12 w-12"
              />
            </div>
          </div>

          {/* Ultra Modern Typography */}
          <h1 className="text-7xl md:text-9xl font-black text-gray-900 mb-8 leading-[0.9] tracking-tight">
            Welcome to
            <br />
            <span className="bg-gradient-to-r from-[#03a002] to-green-600 bg-clip-text text-transparent">
              Saint Maria
            </span>
            <br />
            <span className="text-6xl md:text-7xl text-gray-700 font-light">
              Montessori School
            </span>
          </h1>

          {/* Modern Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-16 font-light max-w-3xl mx-auto leading-relaxed">
            Where young minds flourish through 
            <span className="text-[#03a002] font-medium"> discovery</span>, 
            <span className="text-[#03a002] font-medium"> independence</span>, and 
            <span className="text-[#03a002] font-medium"> joy</span>
          </p>

          {/* Ultra Modern CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <button 
              onClick={handleEnterPortal}
              className="group relative px-8 py-4 bg-[#03a002] text-white rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Enter Portal
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-[#03a002] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button className="group px-8 py-4 border-2 border-[#03a002] text-[#03a002] rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-[#03a002] hover:text-white hover:scale-105 hover:shadow-xl">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Visit
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Ultra Modern Stats Cards */}
      <section className="relative -mt-24 mb-24 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Years Card */}
            <div className="group relative bg-white rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-[#03a002]/5 to-green-100/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-6xl font-black text-[#03a002] mb-4 tracking-tight">25+</div>
                <div className="text-gray-600 text-lg font-medium">Years of Excellence</div>
              </div>
            </div>

            {/* Students Card */}
            <div className="group relative bg-white rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-[#03a002]/5 to-green-100/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-6xl font-black text-[#03a002] mb-4 tracking-tight">500+</div>
                <div className="text-gray-600 text-lg font-medium">Happy Students</div>
              </div>
            </div>

            {/* Satisfaction Card */}
            <div className="group relative bg-white rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-[#03a002]/5 to-green-100/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-6xl font-black text-[#03a002] mb-4 tracking-tight">98%</div>
                <div className="text-gray-600 text-lg font-medium">Parent Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ultra Modern FAQ */}
      <section className="py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight">
              Frequently Asked
              <br />
              <span className="bg-gradient-to-r from-[#03a002] to-green-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our Montessori approach
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-10 py-8 text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#03a002] transition-colors">
                    {faq.question}
                  </h3>
                  <div className={`w-10 h-10 rounded-2xl bg-[#03a002] flex items-center justify-center transition-all duration-300 ${
                    openFAQ === index ? 'rotate-45 bg-green-600' : 'group-hover:scale-110'
                  }`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
                
                {openFAQ === index && (
                  <div className="px-10 pb-8 animate-fadeIn">
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ultra Modern Footer */}
      <footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
        {/* Modern Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#03a002] to-green-600"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            {/* Logo at the top */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg">
                <img 
                  src={schoolLogo} 
                  alt="Saint Maria Montessori School" 
                  className="h-12 w-12"
                />
              </div>
            </div>
            
            {/* School Info */}
            <div className="mb-8">
              <h3 className="text-3xl font-bold mb-2">Saint Maria Montessori School</h3>
              <p className="text-gray-400 text-lg">Nurturing minds since 1999</p>
            </div>
            
            {/* Mission Statement */}
            <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
              Empowering children to become confident, capable, and compassionate learners 
              through the authentic Montessori method.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-6 md:mb-0 text-lg">
              © 2025 Saint Maria Montessori School. All rights reserved.
            </p>
            <div className="flex space-x-8">
              <a href="#" className="text-gray-400 hover:text-[#03a002] transition-colors text-lg font-medium">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-[#03a002] transition-colors text-lg font-medium">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-[#03a002] transition-colors text-lg font-medium">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 