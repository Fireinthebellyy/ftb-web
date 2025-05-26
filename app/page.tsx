import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Users,
  BookOpen,
  TrendingUp,
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Globe,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/images/fire-logo.png"
            alt="Fire in the Belly Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Fire in the Belly
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#mentors"
            className="text-sm font-medium hover:text-red-600 transition-colors"
          >
            Find Mentors
          </Link>
          <Link
            href="#resources"
            className="text-sm font-medium hover:text-red-600 transition-colors"
          >
            Resources
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium hover:text-red-600 transition-colors"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium hover:text-red-600 transition-colors"
          >
            About
          </Link>
        </nav>
        <div className="ml-6 flex gap-2">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Ignite Your Learning Journey with{" "}
                    <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                      Trusted Mentors
                    </span>
                  </h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl">
                    Connect with certified mentors across all domains. Discover
                    trending resources, create your own content, and accelerate
                    your growth with personalized guidance.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    Find Your Mentor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg">
                    Explore Resources
                  </Button>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>1000+ Certified Mentors</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>50+ Domains</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Free to Start</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                  <Image
                    src="/images/fire-logo.png"
                    alt="Fire in the Belly"
                    width={400}
                    height={400}
                    className="relative z-10 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter">
                Find What You Need
              </h2>
              <p className="max-w-[600px] text-gray-600">
                Search for mentors by domain, skill, or experience level.
                Discover resources tailored to your learning goals.
              </p>
              <div className="w-full max-w-2xl flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search mentors, skills, or resources..."
                    className="pl-10 h-12"
                  />
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  Search
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Web Development</Badge>
                <Badge variant="secondary">Data Science</Badge>
                <Badge variant="secondary">Design</Badge>
                <Badge variant="secondary">Business</Badge>
                <Badge variant="secondary">Marketing</Badge>
                <Badge variant="secondary">Engineering</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Everything You Need to Succeed
              </h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform combines mentorship, resources, and community to
                create the perfect learning environment.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="border-2 hover:border-red-200 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Certified Mentors</CardTitle>
                  <CardDescription>
                    Connect with industry experts who are verified and trusted
                    by our community.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Background verified mentors</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Domain expertise validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Student feedback ratings</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-red-200 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Rich Resources</CardTitle>
                  <CardDescription>
                    Access curated content and create your own resources to
                    share with the community.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Trending learning materials</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Create and share content</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Personalized recommendations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-red-200 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Track Progress</CardTitle>
                  <CardDescription>
                    Monitor your learning journey with detailed analytics and
                    milestone tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Learning path visualization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Goal setting and tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Achievement badges</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Mentors */}
        <section
          id="mentors"
          className="w-full py-12 md:py-24 lg:py-32 bg-white"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Meet Our Top Mentors
              </h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Learn from industry leaders who are passionate about sharing
                their knowledge and helping you succeed.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-8">
              {[
                {
                  name: "Sarah Chen",
                  role: "Senior Software Engineer at Google",
                  domain: "Web Development",
                  rating: 4.9,
                  students: 150,
                  image: "/placeholder.svg?height=100&width=100",
                },
                {
                  name: "Dr. Michael Rodriguez",
                  role: "Data Science Lead at Meta",
                  domain: "Data Science & AI",
                  rating: 4.8,
                  students: 200,
                  image: "/placeholder.svg?height=100&width=100",
                },
                {
                  name: "Emily Johnson",
                  role: "Creative Director at Adobe",
                  domain: "UI/UX Design",
                  rating: 4.9,
                  students: 120,
                  image: "/placeholder.svg?height=100&width=100",
                },
              ].map((mentor, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage
                        src={mentor.image || "/placeholder.svg"}
                        alt={mentor.name}
                      />
                      <AvatarFallback>
                        {mentor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{mentor.name}</CardTitle>
                    <CardDescription>{mentor.role}</CardDescription>
                    <Badge className="mx-auto w-fit">{mentor.domain}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{mentor.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{mentor.students} students</span>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Resources */}
        <section id="resources" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Trending Resources
              </h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Discover the most popular learning materials curated by our
                community of mentors and students.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-8">
              {[
                {
                  title: "Complete React Development Guide",
                  author: "Sarah Chen",
                  type: "Course Series",
                  trending: true,
                  views: "12.5k",
                  domain: "Web Development",
                },
                {
                  title: "Machine Learning Fundamentals",
                  author: "Dr. Michael Rodriguez",
                  type: "Interactive Tutorial",
                  trending: true,
                  views: "8.2k",
                  domain: "Data Science",
                },
                {
                  title: "Design System Best Practices",
                  author: "Emily Johnson",
                  type: "Workshop",
                  trending: false,
                  views: "6.1k",
                  domain: "Design",
                },
                {
                  title: "Python for Beginners",
                  author: "Community",
                  type: "Learning Path",
                  trending: true,
                  views: "15.3k",
                  domain: "Programming",
                },
              ].map((resource, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            variant={
                              resource.trending ? "default" : "secondary"
                            }
                          >
                            {resource.trending ? (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Trending
                              </>
                            ) : (
                              resource.type
                            )}
                          </Badge>
                          <Badge variant="outline">{resource.domain}</Badge>
                        </div>
                        <CardTitle className="text-lg">
                          {resource.title}
                        </CardTitle>
                        <CardDescription>By {resource.author}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {resource.views} views
                      </span>
                      <Button size="sm">Access Resource</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-red-600 to-orange-600">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center text-white">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Ready to Ignite Your Learning?
              </h2>
              <p className="max-w-[600px] text-red-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of students who are already accelerating their
                growth with personalized mentorship and curated resources.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-red-600 hover:bg-gray-100"
                >
                  Start Free Today
                  <Zap className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-red-600"
                >
                  Learn More
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-red-100 pt-4">
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>Available worldwide</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <div className="flex items-center space-x-3">
          <Image
            src="/images/fire-logo.png"
            alt="Fire in the Belly Logo"
            width={24}
            height={24}
            className="object-contain"
          />
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Fire in the Belly. All rights reserved.
          </p>
        </div>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4 text-gray-600"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-xs hover:underline underline-offset-4 text-gray-600"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4 text-gray-600"
          >
            Contact
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4 text-gray-600"
          >
            Help
          </Link>
        </nav>
      </footer>
    </div>
  );
}
