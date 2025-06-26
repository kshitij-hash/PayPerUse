"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Code, DollarSign, CheckCircle, GitBranch } from "lucide-react";

export default function DevelopersPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    github: "",
    experience: "",
    expertise: "",
    description: "",
    portfolio: "",
    languages: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'developer',
          ...formData
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Application submitted successfully! We'll review your information and get back to you soon.");
        setFormData({
          name: "",
          email: "",
          company: "",
          github: "",
          experience: "",
          expertise: "",
          description: "",
          portfolio: "",
          languages: "",
        });
      } else {
        throw new Error(data.error || 'Failed to submit application');
      }
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden relative pt-20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      <Header />

      {/* Main Content */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            API Endpoint Developers
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join our ecosystem of API developers and create powerful endpoints that enable AI agent creators to build innovative solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-white text-xl">Build API Endpoints</CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Create powerful API endpoints using our data and infrastructure to support AI agent creators.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-white text-xl">Repository Access</CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Get access to our repository and contribute directly to our ecosystem of API endpoints.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-white text-xl">Earn Revenue</CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Earn a portion of revenue based on the usage of AI agents that utilize your API endpoints.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm mb-12">
          <CardHeader>
            <CardTitle className="text-white text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-purple-400 font-bold">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Apply</h3>
                <p className="text-gray-400 text-sm">Submit your application with your technical expertise</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-purple-400 font-bold">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Review</h3>
                <p className="text-gray-400 text-sm">Our team reviews your technical background and skills</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-purple-400 font-bold">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Access</h3>
                <p className="text-gray-400 text-sm">Gain access to our repository and development environment</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-purple-400 font-bold">4</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Develop & Earn</h3>
                <p className="text-gray-400 text-sm">Create API endpoints and earn revenue from their usage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Apply to Become an API Developer</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Fill out the form below to apply for our API endpoint developer program. Our team will review your application and get back to you within 3-5 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white">Company/Organization (Optional)</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your Company"
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-white">GitHub Profile</Label>
                  <Input
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="https://github.com/yourusername"
                    required
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-white">Years of Development Experience</Label>
                  <Select 
                    name="experience" 
                    value={formData.experience} 
                    onValueChange={(value) => handleSelectChange("experience", value)}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">Less than 1 year</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5+">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expertise" className="text-white">Primary Technical Expertise</Label>
                  <Select 
                    name="expertise" 
                    value={formData.expertise} 
                    onValueChange={(value) => handleSelectChange("expertise", value)}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                      <SelectValue placeholder="Select expertise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backend">Backend Development</SelectItem>
                      <SelectItem value="api">API Design</SelectItem>
                      <SelectItem value="ml">Machine Learning</SelectItem>
                      <SelectItem value="data">Data Engineering</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="languages" className="text-white">Programming Languages & Frameworks</Label>
                <Input
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="Python, Node.js, TensorFlow, etc."
                  required
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Tell us about your experience with API development</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your experience building APIs, relevant projects, and what you hope to create on our platform..."
                  required
                  className="min-h-[120px] bg-gray-800/50 border-gray-700 focus:border-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolio" className="text-white">Links to relevant projects or repositories (Optional)</Label>
                <Textarea
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://github.com/yourusername/project1&#10;https://yourproject.com"
                  className="min-h-[80px] bg-gray-800/50 border-gray-700 focus:border-purple-500"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Submit Application <CheckCircle className="ml-2 h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
