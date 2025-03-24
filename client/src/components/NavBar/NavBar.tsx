import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faSignOutAlt, faSearch, faHome, faBookmark, faDumbbell } from "@fortawesome/free-solid-svg-icons";
import "./NavBar.scss";
import { getAuth } from "firebase/auth";
import { UserDetails } from "../../App";
import { httpService } from "../../httpService";

const NavBar = ({ user }: { user: UserDetails | undefined }) => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserDetails[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    // Update the input field immediately so we can see what we're typing
    setSearchQuery(query);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // Show or hide search results based on input
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    } else {
      // Always show the search results container, even with a single character
      setShowSearchResults(true);

      // Set searching state while we wait for results
      setIsSearching(true);
    }

    // Set a timeout with a shorter delay (100ms)
    searchTimeoutRef.current = window.setTimeout(() => {
      performSearch(query);
    }, 100);
  };

  // Perform search API call
  const performSearch = async (query: string) => {
    if (query.trim().length === 0) return;

    try {
      setIsSearching(true);

      try {
        const { data } = await httpService.get<UserDetails[]>(`/user/search?username=${query}`);

        // Filter to show only users whose username starts with the query
        const filteredResults = data.filter(user => user.username.toLowerCase().startsWith(query.toLowerCase()));

        setSearchResults(filteredResults);
        setShowSearchResults(true);
      } catch (searchError) {
        console.error("Error with /user/search endpoint:", searchError);

        try {
          const { data } = await httpService.get<UserDetails[]>("/user/all");

          const filteredUsers = data.filter(user => user.username.toLowerCase().startsWith(query.toLowerCase()));

          setSearchResults(filteredUsers);
          setShowSearchResults(true);
        } catch (fallbackError) {
          console.error("Error with fallback search:", fallbackError);
          throw fallbackError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle user selection from search results
  const handleUserSelect = (userId: string) => {
    navigate(`/profile/${userId}`);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        <div className='navbar-icons'>
          <Link to='/dashboard' className={`navbar-icon ${location.pathname === "/dashboard" ? "active" : ""}`}>
            <FontAwesomeIcon icon={faHome} />
          </Link>
          <Link to='/exercises' className={`navbar-icon ${location.pathname === "/exercises" ? "active" : ""}`}>
            <FontAwesomeIcon icon={faDumbbell} />
          </Link>
          <Link to='/favorites' className={`navbar-icon ${location.pathname === "/favorites" ? "active" : ""}`}>
            <FontAwesomeIcon icon={faBookmark} />
          </Link>
        </div>
        <div className='navbar-search' ref={searchResultsRef}>
          <FontAwesomeIcon icon={faSearch} className='search-icon' />
          <input
            type='text'
            placeholder='Search users...'
            className='search-input'
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setShowSearchResults(true);
              }
            }}
          />

          {showSearchResults && (
            <div className='search-results-dropdown'>
              {isSearching ? (
                <div className='search-loading'>Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user._id} className='search-result-item' onClick={() => handleUserSelect(user._id)}>
                    <img src={user.profilePicture || "/default-avatar.png"} alt={user.username} className='search-result-avatar' />
                    <span className='search-result-username'>{user.username}</span>
                  </div>
                ))
              ) : (
                <div className='no-results'>No users found</div>
              )}
            </div>
          )}
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
              <Link to='/profile'>Profile</Link>
              <a onClick={handleSignOut}>
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
