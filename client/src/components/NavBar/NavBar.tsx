import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faSignOutAlt, faSearch, faHome, faTrophy, faBookmark } from "@fortawesome/free-solid-svg-icons";
import "./NavBar.scss";
import { getAuth } from "firebase/auth";
import { UserDetails } from "../../App";

const NavBar = ({ user }: { user: UserDetails | undefined }) => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
        <div className='navbar-search'>
          <FontAwesomeIcon icon={faSearch} className='search-icon' />
          <input type='text' placeholder='Search...' className='search-input' />
        </div>
        <div className='navbar-icons'>
          <Link to='/dashboard' className='navbar-icon active'>
            <FontAwesomeIcon icon={faHome} />
          </Link>
          <Link to='/exercises' className='navbar-icon'>
            <FontAwesomeIcon icon={faTrophy} />
          </Link>
          <Link to='/favorites' className='navbar-icon'>
            <FontAwesomeIcon icon={faBookmark} />
          </Link>
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

        <div className='navbar-profile' onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
          <img src={user?.profilePicture || "/default-avatar.png"} alt='Profile' className='profile-image' />
          <span className='profile-name'>{user?.username}</span>
          {showProfileDropdown && (
            <div className='profile-dropdown'>
              <a href='/profile'>
                {" "}
                <Link to='/profile'>Profile</Link>
              </a>
              <a className='sign-in-link' onClick={handleSignOut}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
