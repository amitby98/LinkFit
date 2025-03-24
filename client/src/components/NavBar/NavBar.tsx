import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faSignOutAlt, faSearch } from "@fortawesome/free-solid-svg-icons";
import "./NavBar.scss";
import { getAuth } from "firebase/auth";
import { UserDetails } from "../../App";

const NavBar = ({ user }: { user: UserDetails | undefined }) => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

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
    <div className='custom-navbar'>
      <div className='navbar-left'>
        <div className='navbar-logo'>
          <Link to='/dashboard'>
            <img src={logo} className='app-logo' alt='LinkFit Logo' />
          </Link>
        </div>
        <div className='navbar-separator'></div>
      </div>

      <div className='navbar-center'>
        <div className='navbar-links'>
          <Link to='/dashboard' className={`navbar-link ${location.pathname === "/dashboard" ? "active" : ""}`}>
            HOME
          </Link>
          <Link to='/exercises' className={`navbar-link ${location.pathname === "/exercises" ? "active" : ""}`}>
            CHALLENGE
          </Link>
        </div>
        <div className='navbar-search'>
          <FontAwesomeIcon icon={faSearch} className='search-icon' />
          <input type='text' placeholder='Search...' className='search-input' />
        </div>
      </div>

      <div className='navbar-right'>
        <div className='navbar-notifications' onClick={() => setShowNotifications(!showNotifications)}>
          <FontAwesomeIcon icon={faBell} />
          <span className='notification-badge'>3</span>
          {showNotifications && (
            <div className='notifications-dropdown'>
              <div className='notification-item'>
                <p>John liked your post</p>
                <span>2 hours ago</span>
              </div>
              <div className='notification-item'>
                <p>New challenge available!</p>
                <span>1 day ago</span>
              </div>
            </div>
          )}
        </div>

        <div className='navbar-actions'>
          <Link to='/profile' className='navbar-action-btn profile-btn'>
            PROFILE
          </Link>
          <button onClick={handleSignOut} className='navbar-action-btn signout-btn'>
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
