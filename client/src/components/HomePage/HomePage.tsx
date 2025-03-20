import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import "./HomePage.scss";
import CloseMenu from "/src/assets/x.svg";
import MenuIcon from "/src/assets/menu.svg";
import homeVideo from "/homeVideo.mp4";
import logo from "/logo.png";

const HomePage = () => {
  const [click, setClick] = useState(false);
  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  return (
    <div className='homepage-container'>
      <div className='homeNav'>
        <div className='logo-nav'>
          <div className='logo-container'>
            <Link to='/'>
              <img src={logo} className='homepage-logo' alt='LinkFit Logo' />
            </Link>
          </div>

          <ul className={click ? "nav-options active" : "nav-options"}>
            <li className='nav-option' onClick={closeMobileMenu}>
              <Link to='/' className='home-nav-link'>
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

      <video autoPlay muted loop className='homepage-video'>
        <source src={homeVideo} type='video/mp4' />
      </video>
      <div className='homeView'>
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
      <div id='guide-view' className='guide-view'>
        <h1 className='guide-title'>How It Works</h1>
        <p className='guide-content'>How It Works page</p>
      </div>
      <div id='about-view' className='about-view'>
        <h1 className='about-title'>About</h1>
        <p className='about-content'>About page</p>
      </div>
      <div className='homepage-footer'>
        <div className='footer-container'>
          <div className='footer-left'>
            <ul className='footer-list'>
              <li className='footer-list-item'>
                <p className='footer-text'>Natali Mizrahi</p>
                <a href='https://github.com/DannyIsa' target='_blank' rel='noreferrer' className='social-icon'>
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
