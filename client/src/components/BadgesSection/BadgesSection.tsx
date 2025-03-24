import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faTrophy, faFire, faBolt, faDumbbell, faShare, faCrown, faLock } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { httpService } from "../../httpService";
import "./BadgesSection.css";
import { UserDetails } from "../../App";

interface Badge {
  id: string;
  name: string;
  icon: IconDefinition;
  description: string;
  completed: boolean;
  requiredDays: number;
  color: string;
  colorDark: string;
  glowColor: string;
}

interface BadgeSectionProps {
  user: UserDetails;
  onBadgeClick: (badge: Badge) => void;
  onShareBadge: () => void;
}

interface Day {
  completed: boolean;
}

function BadgesSection({ user }: BadgeSectionProps) {
  const [userProgress, setUserProgress] = useState<number>(0);
  const [showBadgeSharedModal, setShowBadgeSharedModal] = useState<boolean>(false);
  const [sharedBadgeName, setSharedBadgeName] = useState<string>("");
  const [_selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [_showBadgeModal, setShowBadgeModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Define badge data with dynamic completion status
  const getBadges = (progress: number): Badge[] => [
    {
      id: "day10",
      name: "Quick Start",
      icon: faBolt,
      description: "Completed 10 days of exercises",
      completed: progress >= 10,
      requiredDays: 10,
      color: "#64b5f6",
      colorDark: "#1e88e5",
      glowColor: "rgba(33, 150, 243, 0.5)",
    },
    {
      id: "day20",
      name: "Momentum Builder",
      icon: faFire,
      description: "Completed 20 days of exercises",
      completed: progress >= 20,
      requiredDays: 20,
      color: "#64b5f6",
      colorDark: "#1e88e5",
      glowColor: "rgba(33, 150, 243, 0.5)",
    },
    {
      id: "day30",
      name: "Habit Former",
      icon: faDumbbell,
      description: "Completed 30 days of exercises",
      completed: progress >= 30,
      requiredDays: 30,
      color: "#ba68c8",
      colorDark: "#8e24aa",
      glowColor: "rgba(156, 39, 176, 0.5)",
    },
    {
      id: "day40",
      name: "Consistent Athlete",
      icon: faDumbbell,
      description: "Completed 40 days of exercises",
      completed: progress >= 40,
      requiredDays: 40,
      color: "#ba68c8",
      colorDark: "#8e24aa",
      glowColor: "rgba(156, 39, 176, 0.5)",
    },
    {
      id: "day50",
      name: "Halfway Hero",
      icon: faTrophy,
      description: "Completed 50 days of exercises",
      completed: progress >= 50,
      requiredDays: 50,
      color: "#ba68c8",
      colorDark: "#8e24aa",
      glowColor: "rgba(156, 39, 176, 0.5)",
    },
    {
      id: "day60",
      name: "Dedication Star",
      icon: faStar,
      description: "Completed 60 days of exercises",
      completed: progress >= 60,
      requiredDays: 60,
      color: "#ffb74d",
      colorDark: "#ff9800",
      glowColor: "rgba(255, 152, 0, 0.5)",
    },
    {
      id: "day70",
      name: "Fitness Warrior",
      icon: faBolt,
      description: "Completed 70 days of exercises",
      completed: progress >= 70,
      requiredDays: 70,
      color: "#ffb74d",
      colorDark: "#ff9800",
      glowColor: "rgba(255, 152, 0, 0.5)",
    },
    {
      id: "day80",
      name: "Elite Performer",
      icon: faTrophy,
      description: "Completed 80 days of exercises",
      completed: progress >= 80,
      requiredDays: 80,
      color: "#ffb74d",
      colorDark: "#ff9800",
      glowColor: "rgba(255, 152, 0, 0.5)",
    },
    {
      id: "day90",
      name: "Transformation Master",
      icon: faStar,
      description: "Completed 90 days of exercises",
      completed: progress >= 90,
      requiredDays: 90,
      color: "#ff8a65",
      colorDark: "#f4511e",
      glowColor: "rgba(244, 67, 54, 0.5)",
    },
    {
      id: "day100",
      name: "Challenge Champion",
      icon: faCrown,
      description: "Completed all 100 days of exercises",
      completed: progress >= 100,
      requiredDays: 100,
      color: "#ff8a65",
      colorDark: "#f4511e",
      glowColor: "rgba(244, 67, 54, 0.5)",
    },
  ];

  // Fetch user progress and badges
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // First try to get the progress from the server for the specific user being viewed
        const { data } = await httpService.get(`/user/${user._id}/progress`);
        const progressData = data as { completedDays: number };
        let daysCompleted = progressData.completedDays || 0;

        // Only check local storage if viewing current user, not other profiles
        const token = localStorage.getItem("token");
        let userId = "";

        if (token) {
          try {
            // Decode the JWT to get the user ID
            const decoded = JSON.parse(atob(token.split(".")[1]));
            userId = decoded.id || "";

            // Only check local storage if we're viewing our own profile
            if (userId === user._id) {
              // Check the local storage for challenge progress
              const storageKey = `exerciseChallenge_${userId}`;
              const savedChallenge = localStorage.getItem(storageKey);

              if (savedChallenge) {
                const parsed = JSON.parse(savedChallenge);
                const localCompletedDays = parsed.filter((day: Day) => day.completed).length;

                // Use the higher value between server and local storage
                if (localCompletedDays > daysCompleted) {
                  daysCompleted = localCompletedDays;

                  // We'll update this on server but won't wait for it to avoid re-renders
                  httpService
                    .post(`/user/${user._id}/progress`, {
                      completedDays: localCompletedDays,
                    })
                    .catch(updateError => {
                      console.error("Error updating server progress:", updateError);
                    });
                }
              }
            }
          } catch (error) {
            console.error("Error decoding token:", error);
          }
        }

        setUserProgress(daysCompleted);
      } catch (error) {
        console.error("Error fetching user progress:", error);

        // Fallback to local storage if server request fails - but only for current user
        const token = localStorage.getItem("token");
        let userId = "";

        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split(".")[1]));
            userId = decoded.id || "";

            // Only use local storage for current user
            if (userId === user._id) {
              const storageKey = `exerciseChallenge_${userId}`;
              const savedChallenge = localStorage.getItem(storageKey);

              if (savedChallenge) {
                const parsed = JSON.parse(savedChallenge);
                const completedDays = parsed.filter((day: Day) => day.completed).length;
                setUserProgress(completedDays);
              }
            } else {
              // For other users' profiles, set progress to 0 if we couldn't fetch it
              setUserProgress(0);
            }
          } catch (error) {
            console.error("Error decoding token:", error);
            setUserProgress(0);
          }
        } else {
          setUserProgress(0);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, [user?._id]); // Depend on user._id to refetch when viewing different profiles

  // Check for newly earned badge when progress changes
  useEffect(() => {
    if (userProgress > 0 && userProgress % 10 === 0) {
      const badgeIndex = Math.floor(userProgress / 10) - 1;
      const badges = getBadges(userProgress);

      if (badgeIndex >= 0 && badgeIndex < badges.length) {
        const newBadge = badges[badgeIndex];

        // Only show badge modal for current user, not when viewing other profiles
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split(".")[1]));
            const currentUserId = decoded.id || "";

            // Only show badge modal if viewing own profile
            if (currentUserId === user._id) {
              const badgeKey = `badge_shown_${newBadge.id}_${currentUserId}`;
              const badgeAlreadyShown = localStorage.getItem(badgeKey);

              if (!badgeAlreadyShown) {
                setSelectedBadge(newBadge);
                setShowBadgeModal(true);
                localStorage.setItem(badgeKey, "true");
              }
            }
          } catch (error) {
            console.error("Error decoding token:", error);
          }
        }
      }
    }
  }, [userProgress, user?._id]);

  const badges = getBadges(userProgress);
  const nextBadge = badges.find(badge => !badge.completed);

  const calculateProgressToNextBadge = () => {
    if (!nextBadge) return 100;
    const prevMilestone = nextBadge.requiredDays - 10;
    const progress = ((userProgress - prevMilestone) / 10) * 100;
    return Math.min(Math.max(0, progress), 100);
  };

  // Handle badge sharing
  const shareBadge = async (badge: Badge, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Create a post sharing the badge
      await httpService.post("/post", {
        body: `I just earned the "${badge.name}" badge for completing ${badge.requiredDays} exercises in my fitness challenge! 🏆 #FitnessGoals`,
        // You might want to generate an image or use an icon URL here
        image: `/badges/${badge.id}.png`, // Placeholder, replace with actual badge image URL
      });

      // Show success modal
      setSharedBadgeName(badge.name);
      setShowBadgeSharedModal(true);
    } catch (error) {
      console.error("Error sharing badge:", error);
    }
  };

  // Handle badge click to show achievement modal
  const handleBadgeClick = (badge: Badge) => {
    if (badge.completed) {
      setSelectedBadge(badge);
    }
  };

  if (isLoading) {
    return <div className='loading-badges'>Loading achievements...</div>;
  }

  return (
    <div className='badges-section'>
      <div className='badge-rays'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='ray'></div>
        ))}
      </div>

      <h3>Fitness Journey</h3>

      {/* Progress indicator */}
      <div className='next-achievement'>
        <h4>Next Achievement: {nextBadge ? nextBadge.name : "All Achievements Unlocked!"}</h4>
        <div className='achievement-progress'>
          <div className='badges-progress-bar'>
            <div className='badges-progress-fill' style={{ width: `${calculateProgressToNextBadge()}%` }}></div>
          </div>
          <div className='progress-text'>{nextBadge ? `${userProgress}/${nextBadge.requiredDays} days completed` : "Challenge completed! 100/100 days"}</div>
        </div>
      </div>

      {/* Badges grid */}
      <div className='achievements-grid'>
        {badges.map(badge => (
          <div key={badge.id} className={`achievement-badge ${badge.completed ? "completed" : "locked"}`} onClick={() => handleBadgeClick(badge)}>
            <div
              className='badge-icon'
              style={{
                background: badge.completed ? `radial-gradient(circle at 30% 30%, ${badge.color}, ${badge.colorDark})` : "#303146",
                boxShadow: badge.completed ? `0 0 15px ${badge.glowColor}` : "none",
              }}>
              {badge.completed ? <FontAwesomeIcon icon={badge.icon} /> : <FontAwesomeIcon icon={faLock} />}
            </div>
            <div className='badge-info'>
              <h4>{badge.name}</h4>
              <p>{badge.description}</p>
              {badge.completed && (
                <button className='share-badge' onClick={e => shareBadge(badge, e)}>
                  <FontAwesomeIcon icon={faShare} /> Share
                </button>
              )}
            </div>
            {badge.completed && (
              <div className='badge-completion'>
                <div className='badge-checkmark'>✓</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Badge shared modal */}
      {showBadgeSharedModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h2>🎉 Badge Shared Successfully! 🏆</h2>
            <p>Your "{sharedBadgeName}" badge has been shared with your followers!</p>
            <button className='modal-button' onClick={() => setShowBadgeSharedModal(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BadgesSection;
