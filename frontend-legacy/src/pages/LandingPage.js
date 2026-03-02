import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Smartphone, Tv, FileText, Shield, TrendingUp, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Smartphone className="w-8 h-8 text-accent" />,
      title: 'Mobile Recharge',
      description: 'Instant recharges for all major operators nationwide',
    },
    {
      icon: <Tv className="w-8 h-8 text-accent" />,
      title: 'DTH Recharge',
      description: 'Quick DTH top-ups with best commission rates',
    },
    {
      icon: <FileText className="w-8 h-8 text-accent" />,
      title: 'Bill Payments',
      description: 'Pay electricity, gas, water & more bills easily',
    },
    {
      icon: <Shield className="w-8 h-8 text-accent" />,
      title: 'Secure Platform',
      description: 'Bank-grade security with double-entry ledger system',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-accent" />,
      title: 'High Commissions',
      description: 'Earn competitive commissions on every transaction',
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: 'Multi-Role System',
      description: 'Support for Retailers, Distributors & API Users',
    },
  ];

  const benefits = [
    'Instant transaction processing',
    'Real-time balance updates',
    'Comprehensive reporting dashboard',
    'API integration for developers',
    '24/7 platform availability',
    'Manual wallet top-up with quick approval',
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/images/paisape-logo.png" alt="PaisaPe" className="h-8" />
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              data-testid="nav-login-btn"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-accent hover:bg-accent-hover"
              data-testid="nav-register-btn"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight">
                Multi-Service Recharge & Bill Payment Platform
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Empower your business with India's most reliable recharge platform.
                Process mobile, DTH, and bill payments with competitive commissions.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent-hover text-white font-semibold px-8"
                  onClick={() => navigate('/register')}
                  data-testid="hero-get-started-btn"
                >
                  Start Earning Today <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                  onClick={() => navigate('/login')}
                  data-testid="hero-login-btn"
                >
                  Login to Account
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1677078610152-8a627d8ced8d?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="PaisaPe Platform"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-primary mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run a successful recharge business
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200" data-testid={`feature-card-${index}`}>
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-heading font-semibold mb-2 text-primary">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-heading font-bold text-primary mb-6">Why Choose PaisaPe?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Built for scale with enterprise-grade security and reliability. Our platform handles
                thousands of transactions daily with 99.9% uptime.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3" data-testid={`benefit-item-${index}`}>
                    <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1594025741613-c039c2c3bffa?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Mobile Recharge"
                className="rounded-xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-heading font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of retailers and distributors earning with PaisaPe
          </p>
          <Button
            size="lg"
            className="bg-accent hover:bg-accent-hover text-white font-semibold px-10"
            onClick={() => navigate('/register')}
            data-testid="cta-register-btn"
          >
            Create Free Account
          </Button>
        </div>
      </section>

      <footer className="bg-primary/95 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <img src="/images/paisape-logo.png" alt="PaisaPe" className="h-10 mb-4" />
              <p className="text-white/80">
                Your trusted partner for multi-service recharge and bill payments.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/80">
                <li>About Us</li>
                <li>Services</li>
                <li>API Documentation</li>
                <li>Contact Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-lg mb-4">Contact</h4>
              <p className="text-white/80">
                Email: support@paisape.com<br />
                Phone: +91 1800-123-4567
              </p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20 text-center text-white/60">
            <p>&copy; 2026 PaisaPe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
