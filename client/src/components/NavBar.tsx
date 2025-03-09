import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../pics/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import CloseMenu from "../assets/x.svg";
import MenuIcon from "../assets/menu.svg";
import "../styles/NavBar.css";
import { getAuth } from "firebase/auth";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/sign-up");
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className='main-navbar'>
      <div className='nav-menu'>
        <div className='logo-container'>
          <Link to='/dashboard'>
            <img src={logo} className='app-logo' alt='LinkFit Logo' />
          </Link>
        </div>
        <ul className={menuOpen ? "nav-items active" : "nav-items"}>
          <li className='nav-item' onClick={closeMenu}>
            <Link to='/dashboard' className='nav-link'>
              Feed
            </Link>
          </li>
          <li className='nav-item' onClick={closeMenu}>
            <a href='/exercises' className='nav-link'>
              Workouts
            </a>
          </li>
          <li className='nav-item' onClick={closeMenu}>
            <a href='/profile' className='nav-link'>
              Profile
            </a>
          </li>
          <li className='nav-item'>
            <div className='notification-icon'>
              <div className='notification-button'>
                <FontAwesomeIcon icon={faBell} color='white' className='bell-icon' />
                <div className='notification-dropdown'>
                  <div className='notification-content'>
                    <div className='content-container'>
                      {/* <div className='alerts-div'>
                        {requests &&
                          requests.map((item, index) => (
                            <div className='alert trainee-sec' key={"alert" + index}>
                              <div>{item.image && <img className='trainee-card-image' src={item.image} />}</div>
                              <div className='coach-card-con'>
                                {item.trainee_name}
                                <p>{item.email}</p>
                                <div className='trainee-card-details'>
                                  <p>
                                    Message <span>{item.content}</span>
                                  </p>
                                </div>

                                <div className='trainees-item txt' key={"C" + index}>
                                  <p className='date-requests'>{new Date(item.updatedAt).toLocaleDateString("it-IT") + ", " + new Date(item.updatedAt).toLocaleTimeString("it-IT")}</p>
                                  <div className='coach-card-btn'>
                                    <Link to={`/chat/${item.trainee_id}/${userDetails.id}`}>
                                      <button className='chat-btn'>Chat</button>
                                    </Link>
                                    <button className='requests-btn' onClick={() => handleRequest(true, item.trainee_id)}>
                                      <FontAwesomeIcon icon={faCheck} color='#acacac' className='fa-fa' />
                                    </button>
                                    <button className='requests-btn' onClick={() => handleRequest(false, item.trainee_id)}>
                                      <FontAwesomeIcon icon={faTimes} color='#acacac' className='fa-fa' />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
          <li className='mobile-nav-item' onClick={closeMenu}>
            <a className='sign-in-link' onClick={handleSignOut}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Sign Out
            </a>
          </li>
        </ul>
      </div>
      <ul className='auth-container'>
        <li onClick={closeMenu}>
          <a className='signout-btn' onClick={handleSignOut}>
            SignOut
          </a>
        </li>
      </ul>
      <div className='mobile-menu-toggle' onClick={toggleMenu}>
        {menuOpen ? <img src={CloseMenu} className='menu-icon' alt='Close Menu' /> : <img src={MenuIcon} className='menu-icon' alt='Menu Icon' />}
      </div>
    </div>
  );
};

export default NavBar;
