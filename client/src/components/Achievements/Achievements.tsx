import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faStar, faAward, faFire, faCheck } from "@fortawesome/free-solid-svg-icons";
import NavBar from "../NavBar/NavBar";
import BadgesSection from "../BadgesSection/BadgesSection";
import { UserDetails } from "../../App";
import { httpService } from "../../httpService";
import "./Achievements.css";

interface AchievementsProps {
  user: UserDetails | undefined;
  isLoadingUser: boolean;
}

interface ChallengeDay {
  day: number;
  completed: boolean;
  exercise?: { name: string };
  muscleGroup?: string;
  timeSpent?: number;
  date?: string;
}

interface Post {
  body: string;
}

// Add this to the UserDetails interface
declare module "../../App" {
  interface UserDetails {
    posts?: Post[];
  }
}

function Achievements({ user, isLoadingUser }: AchievementsProps) {
  const [profileUser, setProfileUser] = useState<UserDetails | null>(null);
  const [isLoadingProfileUser, setIsLoadingProfileUser] = useState(false);
  const [showBadgeSharedModal, setShowBadgeSharedModal] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [challengeData, setChallengeData] = useState<ChallengeDay[]>([]);
  const [completedDays, setCompletedDays] = useState(0);
  const [sharedBadges, setSharedBadges] = useState(0);
  const { userId } = useParams();

  // Determine if we're viewing our own achievements or someone else's
  const isViewingOwnProfile = userId === undefined || (user && userId === user._id);

  // Load challenge data from localStorage
  useEffect(() => {
    if (!isViewingOwnProfile || !user) return;

    try {
      // Get the current user ID from token
      const token = localStorage.getItem("token");
      let userId = "";

      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          userId = decoded.id || "";
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }

      // Use user-specific storage key
      const storageKey = userId ? `exerciseChallenge_${userId}` : "exerciseChallenge_guest";
      const savedChallenge = localStorage.getItem(storageKey);

      if (savedChallenge) {
        const parsedChallenge = JSON.parse(savedChallenge) as ChallengeDay[];
        setChallengeData(parsedChallenge);

        // Calculate completed days
        const completed = parsedChallenge.filter(day => day.completed).length;
        setCompletedDays(completed);

        // Get shared badge count from user data
        if (user?.posts) {
          const badgePosts = user.posts.filter((post: Post) => post.body && (post.body.includes("badge") || post.body.includes("achievement")));
          setSharedBadges(badgePosts.length);
        } else {
          // If we don't have posts data, use a default count based on completed days
          const estimatedSharedBadges = Math.min(Math.floor(completed / 10), 10);
          setSharedBadges(Math.floor(estimatedSharedBadges));
        }
      }
    } catch (error) {
      console.error("Error loading challenge data:", error);
    }
  }, [isViewingOwnProfile, user]);

  // Load user profile if viewing someone else's profile
  useEffect(() => {
    if (isLoadingUser) {
      return;
    }

    const targetUserId = userId || user?._id;

    if (targetUserId) {
      // If viewing another user's profile, fetch their details
      if (!isViewingOwnProfile) {
        fetchUserDetails(targetUserId);
      }
    }
  }, [userId, user, isLoadingUser, isViewingOwnProfile]);

  const fetchUserDetails = async (targetUserId: string) => {
    setIsLoadingProfileUser(true);
    try {
      // Get the user details
      const { data } = await httpService.get<UserDetails>(`/user/${targetUserId}`);

      // Make sure to fetch badges separately to ensure fresh data
      const badgesResponse = await httpService.get<{ id: string; name: string; description?: string }[]>(`/user/${targetUserId}/badges`);

      // Separately fetch user progress for badges
      const progressResponse = await httpService.get(`/user/${targetUserId}/progress`);

      // Merge all the data with the user data
      setProfileUser({
        ...data,
        badges: badgesResponse.data,
        progress: progressResponse.data as Record<string, unknown>,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError("Failed to load user profile");
    } finally {
      setIsLoadingProfileUser(false);
    }
  };

  // Handle badge share
  const handleBadgeShare = () => {
    setShowBadgeSharedModal(true);
  };

  // Use current user data or fetched profile user data
  const displayUser = isViewingOwnProfile ? user : profileUser;

  // Define statistics for the user using real data
  const userStats = [
    { icon: faTrophy, number: displayUser?.badges?.length || 0, label: "Total Achievements" },
    { icon: faFire, number: isViewingOwnProfile ? completedDays.toString() : "0", label: "Days Completed" },
    { icon: faStar, number: isViewingOwnProfile ? `${Math.floor((completedDays / 100) * 100)}%` : "0", label: "Completion Rate" },
    { icon: faAward, number: isViewingOwnProfile ? sharedBadges.toString() : "0", label: "Shared Badges" },
  ];

  // Badge Shared Modal Component
  const BadgeSharedModal = () => {
    if (!showBadgeSharedModal) return null;

    return (
      <div className='modal-overlay'>
        <div className='modal-content'>
          <button className='close-modal' onClick={() => setShowBadgeSharedModal(false)}>
            ×
          </button>
          <h2>🎉 Badge Shared Successfully! 🏆</h2>
          <p>Your achievement has been shared with your followers and friends!</p>
          <div style={{ marginTop: "20px" }}>
            <FontAwesomeIcon icon={faFire} style={{ fontSize: "40px", color: "#FFD700" }} />
          </div>
          <button className='modal-button' onClick={() => setShowBadgeSharedModal(false)}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <NavBar user={user} />
      <div className='achievements-page'>
        <div className='achievements-container'>
          <div className='achievements-header'>
            <FontAwesomeIcon icon={faTrophy} className='achievements-icon' />
            <h1>Achievements</h1>
            <p>{isViewingOwnProfile ? "Track your progress and showcase your accomplishments! Collect badges by completing fitness challenges." : `${displayUser?.username}'s accomplishments and earned badges`}</p>
          </div>

          {/* Achievement Statistics */}
          <div className='achievement-stats'>
            {userStats.map((stat, index) => (
              <div className='stat-card' key={index}>
                <div className='stat-icon'>
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
                <div className='stat-number'>{stat.number}</div>
                <div className='stat-label'>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className='achievements-content'>
            {error ? (
              <div className='error-message'>
                <FontAwesomeIcon icon={faCheck} /> {error}
              </div>
            ) : isLoadingProfileUser || isLoadingUser ? (
              <div className='loading-container'>
                <div className='loader'></div>
                <p>Loading achievements...</p>
              </div>
            ) : !displayUser ? (
              <p>No user data available</p>
            ) : (
              <BadgesSection user={displayUser} onShareBadge={handleBadgeShare} onBadgeClick={() => {}} />
            )}
          </div>
        </div>

        <BadgeSharedModal />
      </div>
    </>
  );
}

export default Achievements;
