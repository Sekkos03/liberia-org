import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./home.css";
import DonationPopup from "../components/Donationpopup";
import { getEvents, type EventDto } from "../lib/events";
import UlanLogo from "../assets/Ulan_logo-removebg-preview.png";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Fetch events
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });

  const nextEvent = (() => {
    if (!eventsQuery.data) return null;
    const now = new Date();
    const upcoming = eventsQuery.data
      .filter(e => e.startAt && new Date(e.startAt) >= now)
      .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime());
    return upcoming[0] || null;
  })();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="page-root">
      <Navbar />

      {/* Hero Section */}
      <main className="home-hero">
        <div className="particles">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="particle" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>

        <div className="floating-shapes">
          <div className="shape shape--1" />
          <div className="shape shape--2" />
          <div className="shape shape--3" />
        </div>

        <div className={`hero-inner ${isLoaded ? 'hero-inner--loaded' : ''}`}>
          <div className="hero-badge">
            <span className="hero-badge__dot" />
            <span>Welcome to our community</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title__line">ULAN</span>
          </h1>
          
          <p className="hero-subtitle">Union Of Liberian Associations in Norway</p>

          <p className="hero-description">
            Connecting, empowering, and celebrating the Liberian community across Norway.
          </p>

          <div className="actions">
            <Link to="/membership" className="btn btn--primary">
              <span>Join our community</span>
              <svg className="btn__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link to="/about" className="btn btn--ghost">
              <span>Learn more</span>
            </Link>
          </div>
        </div>

        <div className="scroll-indicator">
          <span>Explore what we offer</span>
          <div className="scroll-indicator__mouse">
            <div className="scroll-indicator__wheel" />
          </div>
        </div>
      </main>

      {/* Quick Navigation Cards */}
      <section 
        id="quick-nav" 
        ref={setRef('quick-nav')} 
        className={`quick-nav-section ${visibleSections.has('quick-nav') ? 'section--visible' : ''}`}
      >
        <div className="section-container">
          <h2 className="section-title">Explore ULAN</h2>
          <p className="section-subtitle">Discover everything our community has to offer</p>
          
          <div className="nav-cards-grid">
            {/* Forms - FIXED: Changed from /forms to /membership */}
            <Link to="/membership" className="nav-card nav-card--forms">
              <div className="nav-card__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3 className="nav-card__title">Forms</h3>
              <p className="nav-card__desc">Access membership applications, event registrations, and official documents.</p>
              <span className="nav-card__link">
                View forms <span className="nav-card__arrow">→</span>
              </span>
            </Link>

            {/* Events */}
            <Link to="/events" className="nav-card nav-card--events">
              <div className="nav-card__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <circle cx="12" cy="16" r="2"/>
                </svg>
              </div>
              <h3 className="nav-card__title">Events</h3>
              <p className="nav-card__desc">Discover upcoming celebrations, meetings, and cultural gatherings.</p>
              <span className="nav-card__link">
                See events <span className="nav-card__arrow">→</span>
              </span>
            </Link>

            {/* Adverts */}
            <Link to="/adverts" className="nav-card nav-card--adverts">
              <div className="nav-card__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  <path d="M12 9v6"/>
                  <path d="M9 12h6"/>
                </svg>
              </div>
              <h3 className="nav-card__title">Adverts</h3>
              <p className="nav-card__desc">Browse community announcements, job listings, and business promotions.</p>
              <span className="nav-card__link">
                View adverts <span className="nav-card__arrow">→</span>
              </span>
            </Link>

            {/* Albums */}
            <Link to="/albums" className="nav-card nav-card--albums">
              <div className="nav-card__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <h3 className="nav-card__title">Albums</h3>
              <p className="nav-card__desc">Relive memories through photos and videos from our events and gatherings.</p>
              <span className="nav-card__link">
                View gallery <span className="nav-card__arrow">→</span>
              </span>
            </Link>

            {/* Post Box */}
            <Link to="/postbox" className="nav-card nav-card--postbox">
              <div className="nav-card__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3 className="nav-card__title">Post Box</h3>
              <p className="nav-card__desc">Send messages, share ideas, and communicate with the community.</p>
              <span className="nav-card__link">
                Open inbox <span className="nav-card__arrow">→</span>
              </span>
            </Link>

            {/* About Us */}
            <Link to="/about" className="nav-card nav-card--about">
              <div className="nav-card__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </div>
              <h3 className="nav-card__title">About Us</h3>
              <p className="nav-card__desc">Learn about our history, mission, leadership, and community values.</p>
              <span className="nav-card__link">
                Our story <span className="nav-card__arrow">→</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section 
        id="events-preview" 
        ref={setRef('events-preview')} 
        className={`events-preview-section ${visibleSections.has('events-preview') ? 'section--visible' : ''}`}
      >
        <div className="section-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Upcoming Events</h2>
              <p className="section-subtitle">Join us at our next community gathering</p>
            </div>
            <Link to="/events" className="btn btn--outline">
              View all events
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          <div className="events-preview-grid">
            <div className="event-preview-card event-preview-card--featured">
              <div className="event-preview-card__badge">Next Event</div>
              <div className="event-preview-card__content">
                {nextEvent ? (
                  <>
                    <div className="event-preview-card__date">
                      <span className="event-preview-card__day">{formatDay(nextEvent.startAt!)}</span>
                      <span className="event-preview-card__month">{formatMonth(nextEvent.startAt!)}</span>
                    </div>
                    <div className="event-preview-card__info">
                      <h3 className="event-preview-card__title">{nextEvent.title}</h3>
                      <p className="event-preview-card__location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {nextEvent.location || "TBA"}
                      </p>
                      <Link to={`/events/${nextEvent.slug}`} className="event-preview-card__btn">
                        View details
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="event-preview-card__date">
                      <span className="event-preview-card__day">—</span>
                      <span className="event-preview-card__month">TBA</span>
                    </div>
                    <div className="event-preview-card__info">
                      <h3 className="event-preview-card__title">No upcoming events</h3>
                      <p className="event-preview-card__location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Check back soon
                      </p>
                      <Link to="/events" className="event-preview-card__btn">
                        View all events
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="event-preview-info">
              <h3>Never Miss an Event</h3>
              <p>Stay updated with all our community activities, cultural celebrations, and important meetings.</p>
              <ul className="event-features-list">
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Cultural festivals & celebrations
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Community meetings
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Educational workshops
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Social gatherings
                </li>
              </ul>
              <Link to="/events/calendar" className="btn btn--secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Open Calendar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section 
        id="gallery-preview" 
        ref={setRef('gallery-preview')} 
        className={`gallery-preview-section ${visibleSections.has('gallery-preview') ? 'section--visible' : ''}`}
      >
        <div className="section-container">
          <div className="section-header section-header--center">
            <h2 className="section-title">Memory Lane</h2>
            <p className="section-subtitle">Capturing moments that bring us together</p>
          </div>

          <div className="gallery-preview-grid">
            <div className="gallery-preview-item gallery-preview-item--1">
              <div className="gallery-preview-overlay">
                <span>Cultural Events</span>
              </div>
            </div>
            <div className="gallery-preview-item gallery-preview-item--2">
              <div className="gallery-preview-overlay">
                <span>Community</span>
              </div>
            </div>
            <div className="gallery-preview-item gallery-preview-item--3">
              <div className="gallery-preview-overlay">
                <span>Celebrations</span>
              </div>
            </div>
            <div className="gallery-preview-item gallery-preview-item--4">
              <div className="gallery-preview-overlay">
                <span>Together</span>
              </div>
            </div>
          </div>

          <div className="gallery-cta">
            <Link to="/albums" className="btn btn--primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Explore All Albums
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section 
        id="about-preview" 
        ref={setRef('about-preview')} 
        className={`about-preview-section ${visibleSections.has('about-preview') ? 'section--visible' : ''}`}
      >
        <div className="section-container">
          <div className="about-preview-grid">
            <div className="about-preview-content">
              <span className="about-preview-tag">About ULAN</span>
              <h2 className="about-preview-title">Building Bridges, Preserving Heritage</h2>
              <p className="about-preview-text">
                The Union of Liberian Associations in Norway (ULAN) serves as the umbrella organization 
                for Liberians living in Norway. We are dedicated to preserving our rich cultural heritage 
                while helping our community thrive in their new home.
              </p>
              <p className="about-preview-text">
                Through community programs, cultural events, and support services, we create opportunities 
                for connection, growth, and celebration of our shared identity.
              </p>
              
              <div className="about-preview-values">
                <div className="about-value">
                  <div className="about-value__icon">🤝</div>
                  <span>Unity</span>
                </div>
                <div className="about-value">
                  <div className="about-value__icon">🌍</div>
                  <span>Heritage</span>
                </div>
                <div className="about-value">
                  <div className="about-value__icon">💪</div>
                  <span>Support</span>
                </div>
                <div className="about-value">
                  <div className="about-value__icon">🎉</div>
                  <span>Culture</span>
                </div>
              </div>

              <Link to="/about" className="btn btn--primary">
                Learn More About Us
                <svg className="btn__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            {/* ULAN Logo */}
            <div className="about-preview-logo">
              <img 
                src={UlanLogo} 
                alt="ULAN - Union of Liberian Associations in Norway" 
                className="about-preview-logo__img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Donate CTA */}
      <section 
        id="cta-section" 
        ref={setRef('cta-section')} 
        className={`cta-section ${visibleSections.has('cta-section') ? 'section--visible' : ''}`}
      >
        <div className="section-container">
          <div className="cta-grid">
            {/* Contact Card */}
            <div className="cta-card cta-card--contact">
              <div className="cta-card__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3 className="cta-card__title">Get in Touch</h3>
              <p className="cta-card__text">Have questions? Want to get involved? We'd love to hear from you.</p>
              <Link to="/contact" className="btn btn--ghost btn--light">
                Contact Us
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            {/* Donate Card */}
            <div className="cta-card cta-card--donate">
              <div className="cta-card__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h3 className="cta-card__title">Support Our Mission</h3>
              <p className="cta-card__text">Your generosity helps us continue serving the Liberian community in Norway.</p>
              <Link to="/donate" className="btn btn--donate">
                Donate Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <DonationPopup />
      <Footer />
    </div>
  );
}

/* Helper functions for date formatting */
function formatDay(iso: string) {
  return new Date(iso).toLocaleString(undefined, { day: "2-digit" });
}

function formatMonth(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short" }).toUpperCase();
}