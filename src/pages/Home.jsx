import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaWifi, FaCreditCard, FaWallet, FaChartLine, FaShieldAlt, FaLightbulb, FaCheck, FaChartBar, FaBus, FaRedo, FaTwitter, FaInstagram, FaLinkedin, FaFacebook, FaBars, FaTimes, FaStar } from 'react-icons/fa';
import styles from './Home.module.css';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navTransparent, setNavTransparent] = useState(true);
  const statsRef = useRef(null);
  const [statsAnimated, setStatsAnimated] = useState(false);

  // Handle scroll for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setNavTransparent(window.scrollY < 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !statsAnimated) {
        setStatsAnimated(true);
      }
    }, { threshold: 0.3 });

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [statsAnimated]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <main className={styles.home}>
      {/* ==================== NAVBAR ==================== */}
      <nav className={`${styles.navbar} ${navTransparent ? styles.transparent : styles.solid}`}>
        <div className={styles.navContainer}>
          {/* Logo */}
          <div className={styles.logo}>
            <FaWifi className={styles.logoIcon} />
            <span className={styles.logoText}>C-Transit</span>
          </div>

          {/* Nav Links (hidden on mobile) */}
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#wallet">Wallet</a>
            <a href="#why-ctransit">Solutions</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </div>

          {/* Get Started Button */}
          <div className={styles.navRight}>
            <Link to="/register" className={styles.primaryBtn}>Get Started</Link>
          </div>

          {/* Hamburger Menu (mobile only) */}
          <button className={styles.hamburger} onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#wallet" onClick={() => setMobileMenuOpen(false)}>Wallet</a>
            <a href="#solutions" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
            <Link to="/register" className={styles.mobileGetStarted}>Get Started</Link>
          </div>
        )}
      </nav>

      {/* ==================== HERO ==================== */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          {/* Left Column - Text */}
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span>Smart Transit Payments</span>
            </div>
            <h1 className={styles.heroTitle}>
              Tap & Ride.<br />The Smarter Way to Move.
            </h1>
            <p className={styles.heroSubtitle}>
              Cashless. Contactless. Effortless. Just tap your NFC card or student ID and ride across the city.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/register" className={styles.primaryBtn}>Get Started</Link>
              <button className={styles.ghostBtn}>Fund Wallet</button>
            </div>
          </div>

          {/* Right Column - Phone Mockup */}
          <div className={styles.heroRight}>
            <div className={styles.phoneMockup}>
              <div className={styles.phoneScreen}>
                <div className={styles.statusBar}>
                  <span>C-Transit</span>
                  <span className={styles.checkmark}>✓</span>
                  <span>10:30 AM</span>
                </div>
                <div className={styles.screenContent}>
                  <div className={styles.nfcAnimation}>
                    <div className={styles.nfcRing}></div>
                    <div className={styles.nfcRing} style={{ animationDelay: '0.5s' }}></div>
                    <div className={styles.nfcRing} style={{ animationDelay: '1s' }}></div>
                  </div>
                  <p className={styles.tapText}>TAP YOUR CARD</p>
                  <p className={styles.tapSubtext}>Place your NFC card on the reader</p>
                </div>
              </div>
              <div className={styles.phoneGlow}></div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES STRIP ==================== */}
      <section id="features" className={styles.featuresStrip}>
        <div className={styles.featuresContainer}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FaWifi />
            </div>
            <h4>NFC Tap & Ride</h4>
            <p>Tap your card and go</p>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FaCreditCard />
            </div>
            <h4>Cashless Payments</h4>
            <p>Secure & instant</p>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FaWallet />
            </div>
            <h4>Smart Wallet</h4>
            <p>Top up and manage</p>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FaChartLine />
            </div>
            <h4>Real-time Analytics</h4>
            <p>Track & save more</p>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FaShieldAlt />
            </div>
            <h4>Safe & Secure</h4>
            <p>Bank grade security</p>
          </div>
        </div>
      </section>

      {/* ==================== WHY C-TRANSIT ==================== */}
      <section id="why-ctransit" className={styles.whySection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2>Why Choose C-Transit?</h2>
            <p>A complete mobility ecosystem built for the future of smart cities.</p>
          </div>

          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={styles.cardIconBox}>
                <FaLightbulb />
              </div>
              <h3>Instant Access</h3>
              <p>Tap your NFC card and get instant access to buses, trains, and metros.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconBox}>
                <FaWallet />
              </div>
              <h3>Smart Wallet</h3>
              <p>Load money, set limits, and enjoy seamless transactions and savings.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconBox}>
                <FaChartBar />
              </div>
              <h3>Track & Analyze</h3>
              <p>Get insights on your travel, spending, and destination patterns.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIconBox}>
                <FaShieldAlt />
              </div>
              <h3>Reliable & Secure</h3>
              <p>Your data and payments are 100% secure with advanced encryption.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2>How It Works</h2>
            <p>Just Tap, Ride & Go.</p>
          </div>

          <div className={styles.stepsContainer}>
            <div className={styles.step}>
              <div className={styles.stepBadge}>1</div>
              <div className={styles.stepIcon}>
                <FaCreditCard />
              </div>
              <h3>Tap Card</h3>
              <p>Tap your NFC card or student ID on the terminal.</p>
            </div>

            <div className={styles.arrow}></div>

            <div className={styles.step}>
              <div className={styles.stepBadge}>2</div>
              <div className={styles.stepIcon}>
                <FaCheck />
              </div>
              <h3>Validate</h3>
              <p>System validates your card and deducts the correct fare.</p>
            </div>

            <div className={styles.arrow}></div>

            <div className={styles.step}>
              <div className={styles.stepBadge}>3</div>
              <div className={styles.stepIcon}>
                <FaBus />
              </div>
              <h3>Ride</h3>
              <p>Enjoy your ride seamlessly.</p>
            </div>

            <div className={styles.arrow}></div>

            <div className={styles.step}>
              <div className={styles.stepBadge}>4</div>
              <div className={styles.stepIcon}>
                <FaRedo />
              </div>
              <h3>Go Again</h3>
              <p>Tap again at every boarding and destination stop.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS BAR ==================== */}
      <section ref={statsRef} className={styles.statsBar}>
        <div className={styles.statsContainer}>
          <div className={styles.stat}>
            <div className={styles.statNumber}>
              {statsAnimated ? '2.8M' : '0'}
              <span>+</span>
            </div>
            <p>Happy Riders</p>
          </div>

          <div className={styles.statDivider}></div>

          <div className={styles.stat}>
            <div className={styles.statNumber}>
              {statsAnimated ? '15M' : '0'}
              <span>+</span>
            </div>
            <p>Trips Completed</p>
          </div>

          <div className={styles.statDivider}></div>

          <div className={styles.stat}>
            <div className={styles.statNumber}>
              {statsAnimated ? '98.5' : '0'}
              <span>%</span>
            </div>
            <p>On-time Performance</p>
          </div>

          <div className={styles.statDivider}></div>

          <div className={styles.stat}>
            <div className={styles.statNumber}>
              {statsAnimated ? '500' : '0'}
              <span>+</span>
            </div>
            <p>Active Vehicles</p>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className={styles.testimonialSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2>What Riders Say</h2>
          </div>

          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.avatar}>AM</div>
              <h4>Aisha M.</h4>
              <span className={styles.role}>Student</span>
              <p>"C-Transit makes my daily commute so easy and convenient."</p>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={styles.star} />
                ))}
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <div className={styles.avatar}>DK</div>
              <h4>David K.</h4>
              <span className={styles.role}>Daily Commuter</span>
              <p>"Love the tap & ride experience. Fast, secure and reliable."</p>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={styles.star} />
                ))}
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <div className={styles.avatar}>MJ</div>
              <h4>Mary J.</h4>
              <span className={styles.role}>Traveler</span>
              <p>"Best transit card system I've used. Super convenient!"</p>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={styles.star} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA BANNER ==================== */}
      <section className={styles.ctaBanner}>
        <h2>Ready to Tap & Ride?</h2>
        <p>Join millions of riders enjoying seamless and smart travel.</p>
        <div className={styles.ctaButtonRow}>
          <Link to="/register" className={styles.primaryBtn}>Get Started</Link>
          <button className={styles.ghostBtn}>Learn More</button>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          {/* Brand Column */}
          <div className={styles.footerColumn}>
            <div className={styles.footerLogo}>
              <FaWifi className={styles.footerLogoIcon} />
              <span>C-Transit</span>
            </div>
            <p className={styles.footerTagline}>The Smarter Way to Move.</p>
            <div className={styles.socialIcons}>
              <a href="https://twitter.com/ctransit" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://instagram.com/ctransit" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://linkedin.com/company/ctransit" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
              <a href="https://facebook.com/ctransit" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
            </div>
          </div>

          {/* Product Column */}
          <div className={styles.footerColumn}>
            <h5>Product</h5>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#wallet">Wallet</a>
            <a href="#nfc">NFC Cards</a>
          </div>

          {/* Company Column */}
          <div className={styles.footerColumn}>
            <h5>Company</h5>
            <a href="#about">About Us</a>
            <a href="#careers">Careers</a>
            <a href="#blog">Blog</a>
            <a href="#press">Press</a>
            <a href="#contact">Contact</a>
          </div>

          {/* Support Column */}
          <div className={styles.footerColumn}>
            <h5>Support</h5>
            <a href="#help">Help Center</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#status">Status</a>
            <a href="#api">API Docs</a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.footerBottom}>
          <p>© 2025 C-Transit. All rights reserved.</p>
          <p>Made with care for Nigerian commuters</p>
        </div>
      </footer>
    </main>
  );
}
