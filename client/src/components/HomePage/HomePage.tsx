import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faUserGroup, faCalendarCheck, faStopwatch, faChartLine, faTrophy } from "@fortawesome/free-solid-svg-icons";
import "./HomePage.scss";
import CloseMenu from "/src/assets/x.svg";
import MenuIcon from "/src/assets/menu.svg";
import homeVideo from "/homeVideo.mp4";
import logo from "/logo.png";

const HomePage = () => {
  const [click, setClick] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [animateSection1, setAnimateSection1] = useState(false);
  const [animateSection2, setAnimateSection2] = useState(false);
  const [animateSection3, setAnimateSection3] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const homeViewRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrollPosition(scrollY);

      if (videoRef.current) {
        if (scrollY > window.innerHeight * 0.5 && !videoRef.current.paused) {
          videoRef.current.pause();
        } else if (scrollY <= window.innerHeight * 0.5 && videoRef.current.paused) {
          videoRef.current.play();
        }
      }

      const isElementVisible = (element: HTMLElement | null, threshold = 0.3) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= window.innerHeight * (1 - threshold);
      };

      if (section1Ref.current && isElementVisible(section1Ref.current)) {
        setAnimateSection1(true);
      }

      if (section2Ref.current && isElementVisible(section2Ref.current)) {
        setAnimateSection2(true);
      }

      if (section3Ref.current && isElementVisible(section3Ref.current)) {
        setAnimateSection3(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navbarStyle = {
    backgroundColor: scrollPosition > 50 ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.1)",
    boxShadow: scrollPosition > 50 ? "0 2px 10px rgba(0, 0, 0, 0.2)" : "none",
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
  };

  const logoStyle = {
    transform: scrollPosition > 50 ? "scale(0.85)" : "scale(1)",
    transition: "transform 0.3s ease",
  };

  const videoStyle = {
    opacity: Math.max(0, 1 - scrollPosition / (window.innerHeight * 0.5)),
    transform: `translateY(${scrollPosition * 0.1}px)`,
    transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
    visibility: scrollPosition > window.innerHeight ? ("hidden" as React.CSSProperties["visibility"]) : ("visible" as React.CSSProperties["visibility"]),
  };

  const homeViewStyle = {
    opacity: Math.max(0, 1 - scrollPosition / (window.innerHeight * 0.5)),
    transform: `translateY(${scrollPosition * 0.05}px)`,
    transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
  };

  const overlayStyle = {
    opacity: Math.min(1, scrollPosition / (window.innerHeight * 0.5)),
    visibility: scrollPosition < 50 ? ("hidden" as React.CSSProperties["visibility"]) : ("visible" as React.CSSProperties["visibility"]),
    background: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 70%, rgba(255, 255, 255, 1) 100%)",
  };

  return (
    <div className='homepage-container'>
      <div className='homeNav' style={navbarStyle}>
        <div className='logo-nav'>
          <div className='logo-container'>
            <Link to='/'>
              <img src={logo} className='homepage-logo' alt='LinkFit Logo' style={logoStyle} />
            </Link>
          </div>

          <ul className={click ? "nav-options active" : "nav-options"}>
            <li className='nav-option' onClick={closeMobileMenu}>
              <Link to='/home' className='home-nav-link'>
                Home
              </Link>
            </li>
            <li className='nav-option' onClick={closeMobileMenu}>
              <a href='#guide-view' className='home-nav-link'>
                How It Works
              </a>
            </li>
            <li className='nav-option' onClick={closeMobileMenu}>
              <a href='#about-view' className='home-nav-link'>
                About
              </a>
            </li>
            <li className='nav-option mobile-option' onClick={closeMobileMenu}>
              <Link to='/sign-up' className='sign-in home-nav-link'>
                Login
              </Link>
            </li>
          </ul>
          <ul className='nav-signIn'>
            <li className='nav-signIn-item' onClick={closeMobileMenu}>
              <Link to='/sign-up' className='signIn-btn'>
                Login
              </Link>
            </li>
          </ul>
          <div className='mobile-menu' onClick={handleClick}>
            {click ? <img src={CloseMenu} className='menu-icon' alt='Close Menu' /> : <img src={MenuIcon} className='menu-icon' alt='Menu Icon' />}
          </div>
        </div>
      </div>

      <video ref={videoRef} autoPlay muted loop className='homepage-video' style={videoStyle}>
        <source src={homeVideo} type='video/mp4' />
      </video>

      <div className='video-overlay' style={overlayStyle}></div>

      <div className='homeView' ref={homeViewRef} style={homeViewStyle}>
        <div className='welcome'>
          <h1 className='welcome-header'>
            Challenge Yourself. <br /> Support Each Other.
          </h1>
          <span className='welcome-span'>Join the 100-day journey and reach your fitness goals together</span>
          <Link to='/sign-up'>
            <button className='start-btn'>Join the Challenge</button>
          </Link>
        </div>
      </div>

      <div
        className='scroll-transition'
        style={{
          opacity: Math.max(0, 1 - (scrollPosition - 100) / 200),
          transition: "opacity 0.3s ease-out",
        }}>
        <div className='scroll-indicator'>
          <div className='arrow-container'>
            <div className='arrow'></div>
            <div className='arrow'></div>
          </div>
          <p className='scroll-text'>Scroll to explore</p>
        </div>
      </div>

      <div id='guide-view' ref={section1Ref} className={`guide-view ${animateSection1 ? "slide-from-bottom" : ""}`}>
        <h1 className={`guide-title ${animateSection1 ? "slide-from-bottom delay-1" : ""}`}>How It Works</h1>
        <div className={`features-intro ${animateSection1 ? "slide-from-bottom delay-2" : ""}`}>
          <p>Join our 100-day fitness challenge and transform your workout routine with community support. Track your progress, connect with others, and achieve your fitness goals together.</p>
        </div>

        <div className='features-container'>
          <div className='feature-row'>
            <div className={`feature-item ${animateSection1 ? "slide-from-left delay-1" : ""}`}>
              <div className='feature-icon'>
                <FontAwesomeIcon icon={faUserGroup} />
              </div>
              <h3 className='feature-title'>COMMUNITY CONNECTION</h3>
              <p className='feature-description'>Connect with like-minded fitness enthusiasts, share workout tips, and find training partners in your area. Post questions about exercises or invite others to join your workouts.</p>
            </div>

            <div className={`feature-item ${animateSection1 ? "slide-from-left delay-2" : ""}`}>
              <div className='feature-icon'>
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>
              <h3 className='feature-title'>DAILY CHALLENGES</h3>
              <p className='feature-description'>Receive a new exercise challenge every day for 100 days. Each workout is designed to build strength, endurance, and consistency while keeping you motivated throughout your journey.</p>
            </div>

            <div className={`feature-item ${animateSection1 ? "slide-from-left delay-3" : ""}`}>
              <div className='feature-icon'>
                <FontAwesomeIcon icon={faStopwatch} />
              </div>
              <h3 className='feature-title'>PERFORMANCE TIMER</h3>
              <p className='feature-description'>Track your workout duration with our built-in timer. Compare your times with previous attempts and challenge yourself to improve with each session.</p>
            </div>
          </div>

          <div className='feature-row center-row'>
            <div className={`feature-item ${animateSection1 ? "slide-from-right delay-2" : ""}`}>
              <div className='feature-icon'>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <h3 className='feature-title'>PROGRESS TRACKING</h3>
              <p className='feature-description'>Visualize your fitness journey with personalized graphs and statistics. Monitor improvements, identify patterns, and celebrate your achievements throughout the 100-day challenge.</p>
            </div>

            <div className={`feature-item ${animateSection1 ? "slide-from-right delay-3" : ""}`}>
              <div className='feature-icon'>
                <FontAwesomeIcon icon={faTrophy} />
              </div>
              <h3 className='feature-title'>ACHIEVEMENT REWARDS</h3>
              <p className='feature-description'>Earn badges and milestones as you complete challenges. Share your accomplishments on your profile and inspire others to join the fitness movement.</p>
            </div>
          </div>
        </div>
      </div>

      <div className='section-transition' ref={section2Ref}>
        <div className='transition-wave'></div>
        <div className='transition-content'>
          <div className={`count-up-container ${animateSection2 ? "slide-from-bottom" : ""}`}>
            <div className={`count-item ${animateSection2 ? "slide-from-left delay-1" : ""}`}>
              <div className='count-value'>100</div>
              <div className='count-label'>Challenge Days</div>
            </div>
            <div className={`count-item ${animateSection2 ? "slide-from-bottom delay-2" : ""}`}>
              <div className='count-value'>5K+</div>
              <div className='count-label'>Active Users</div>
            </div>
            <div className={`count-item ${animateSection2 ? "slide-from-right delay-1" : ""}`}>
              <div className='count-value'>95%</div>
              <div className='count-label'>Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div id='about-view' ref={section3Ref} className='about-view'>
        <h1 className={`about-title ${animateSection3 ? "slide-from-bottom" : ""}`}>About Us</h1>
        <div className='about-steps-container'>
          <div className={`about-step ${animateSection3 ? "slide-from-left delay-1" : ""}`}>
            <div className='step-card'>
              <div className='step-number'>1</div>
              <div className='step-content'>
                <h2>Our Mission</h2>
                <p>At LinkFit, we believe that fitness thrives in community. Our mission is to create a supportive environment where athletes of all levels can connect, challenge themselves, and achieve their fitness goals together through shared experiences</p>
              </div>
            </div>
          </div>

          <div className={`about-step ${animateSection3 ? "slide-from-bottom delay-2" : ""}`}>
            <div className='step-card'>
              <div className='step-number'>2</div>
              <div className='step-content'>
                <h2>Our Story</h2>
                <p>LinkFit was born from a simple observation: people achieve more when they train together. What began as a local fitness group sharing workout results has evolved into a global platform connecting athletes who believe in the power of community-driven fitness.</p>
              </div>
            </div>
          </div>

          <div className={`about-step ${animateSection3 ? "slide-from-bottom delay-3" : ""}`}>
            <div className='step-card'>
              <div className='step-number'>3</div>
              <div className='step-content'>
                <h2> Our Values</h2>
                <p>We stand by three core values: Inclusivity - welcoming athletes of all backgrounds and abilities; Accountability - fostering commitment through community support; and Growth - celebrating progress at every step of your fitness journey</p>
              </div>
            </div>
          </div>

          <div className={`about-step ${animateSection3 ? "slide-from-right delay-2" : ""}`}>
            <div className='step-card'>
              <div className='step-number'>4</div>
              <div className='step-content'>
                <h2>Our Team</h2>
                <p>The LinkFit team comprises fitness enthusiasts, tech innovators, and community builders. We bring diverse experiences but share one passion: helping people transform their fitness journeys from solitary pursuits into shared adventures fueled by mutual support.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='homepage-footer' ref={footerRef}>
        <div className='footer-container'>
          <div className='footer-left'>
            <ul className='footer-list'>
              <li className='footer-list-item'>
                <p className='footer-text'>Natali Mizrahi</p>
                <a href='https://github.com/natalimizrahi1' target='_blank' rel='noreferrer' className='social-icon'>
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </li>
              <li className='footer-list-item'>
                <p className='footer-text'>Amit Ben Yaakov</p>
                <a href='https://github.com/amitby98' target='_blank' rel='noreferrer' className='social-icon'>
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </li>
            </ul>
          </div>
          <div className='footer-right'>
            <p className='footer-text'>
              © 2025, LinkFit Team. All Rights Reserved. <br />
              <Link to='/privacy-policy' className='footer-link'>
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
