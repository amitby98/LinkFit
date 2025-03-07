import { useState } from "react";
import { Link } from "react-router-dom";
import CloseMenu from "../assets/x.svg";
import MenuIcon from "../assets/menu.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import "../styles/HomePage.css";
import homeVideo from "../pics/homeVideo.mp4";
import logo from "../pics/logo.png";

function HomePage() {
  const [click, setClick] = useState(false);
  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  return (
    <>
      <div className='homeNav'>
        <div className='logo-nav'>
          <div className='logo-container'>
            <Link to='/'>
              <img src={logo} id='logo' alt='LinkFit Logo' />
            </Link>
          </div>
          <ul className={click ? "nav-options active" : "nav-options"}>
            <li className='option' onClick={closeMobileMenu}>
              <Link to='/' className='link'>
                Home
              </Link>
            </li>
            <li className='option' onClick={closeMobileMenu}>
              <a href='#guideView' className='link'>
                How It Works
              </a>
            </li>
            <li className='option' onClick={closeMobileMenu}>
              <a href='#aboutView' className='link'>
                About
              </a>
            </li>
            <li className='option mobile-option' onClick={closeMobileMenu}>
              <Link to='/sign-up' className='sign-in link'>
                Login
              </Link>
            </li>
          </ul>
        </div>
        <ul className='signIn'>
          <li onClick={closeMobileMenu}>
            <Link to='/sign-up' className='signIn-btn'>
              Login
            </Link>
          </li>
        </ul>
        <div className='mobile-menu' onClick={handleClick}>
          {click ? <img src={CloseMenu} className='menu-icon' alt='Close Menu' /> : <img src={MenuIcon} className='menu-icon' alt='Menu Icon' />}
        </div>
      </div>
      <video autoPlay muted loop id='homeVideo'>
        <source src={homeVideo} type='video/mp4' />
      </video>
      <div className='homeView'>
        <div className='welcome'>
          <h1 id='welcome-header'> Find. Meet. Get fit. </h1>
          <span id='welcome-span'>Personal training has never been so easy.</span>
          <Link to='/sign-up'>
            <button id='start-btn'>Start your change now</button>
          </Link>
        </div>
      </div>
      <div id='guideView'>
        <h1>How It Works</h1>
        <p>khfddfuijbhvfgtuuyoijkbhvgchfdtu</p>
      </div>
      <div id='aboutView'>
        <h1>About</h1>
        <p>khfddfuijbhvfgtuuyoijkbhvgchfdtuyuk</p>
      </div>

      <div className='main-footer'>
        <div className='footer-container'>
          <div className='inner-left'>
            <ul>
              <li>
                <p>Natali Mizrahi</p>
                <a href='https://github.com/DannyIsa' target='_blank' rel='noreferrer' className='social-icon'>
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </li>
              <li>
                <p>Amit Ben Yaakov</p>
                <a href='https://github.com/amitby98' target='_blank' rel='noreferrer' className='social-icon'>
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </li>
            </ul>
          </div>
          <div className='inner-right'>
            <p>
              © 2025, LinkFit Team. All Rights Reserved. <br />
              <Link to='/privacy-policy'>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
