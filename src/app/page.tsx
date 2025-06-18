import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-2xl">FlowForge</span>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li><Link href="/wallet" className="hover:text-blue-400 transition-colors">Wallet</Link></li>
            <li><Link href="/services" className="hover:text-blue-400 transition-colors">Services</Link></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Build Powerful AI Workflows with FlowForge
          </h1>
          <p className="text-xl mb-10 text-gray-300">
            Create, deploy, and monetize AI agents with our powerful platform. Connect to various services and build complex workflows with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/agents" 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-lg transition-colors"
            >
              Explore Agents
            </Link>
            <Link 
              href="/wallet" 
              className="px-8 py-3 border border-blue-600 text-blue-400 hover:bg-blue-900/20 rounded-lg font-medium text-lg transition-colors"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-800 rounded-lg">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Agents</h3>
              <p className="text-gray-400">Access a library of pre-built agents or create your own custom workflows.</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg">
              <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Crypto Payments</h3>
              <p className="text-gray-400">Securely pay for services using cryptocurrency with our integrated wallet.</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg">
              <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">API Services</h3>
              <p className="text-gray-400">Connect to various paid APIs and services to enhance your workflows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="font-bold text-xl">FlowForge</span>
            <p className="text-gray-400 text-sm mt-1">Building the future of AI workflows</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <Link href="/agents" className="text-gray-400 hover:text-white transition-colors">Agents</Link>
            <Link href="/wallet" className="text-gray-400 hover:text-white transition-colors">Wallet</Link>
            <Link href="/services" className="text-gray-400 hover:text-white transition-colors">Services</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
