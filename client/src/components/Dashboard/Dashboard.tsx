import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faPaperPlane, faPen } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import "./Dashboard.css";
import { Post } from "../Post/Post";

export interface IPost {
  imageUrl: string;
  text: string;
  _id: string;
  user: { username: string; profilePicture: string; _id: string };
  body: string;
  image: string;
  likes: string[];
  comments: IComment[];
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  user: Pick<UserDetails, "profilePicture" | "username" | "_id">;
  body: string;
  createdAt: string;
}

interface NextExerciseChallenge {
  day: number;
  exerciseName: string;
  muscleGroup: string;
}

interface ChallengeDay {
  day: number;
  completed: boolean;
  exercise?: { name: string };
  muscleGroup?: string;
}

const Dashboard = ({ user }: { user: UserDetails | undefined }) => {
  const [newPostText, setNewPostText] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextChallenge, setNextChallenge] = useState<NextExerciseChallenge | null>(null);
  const [allUsers, setAllUsers] = useState<UserDetails[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Load next challenge data from local storage
  useEffect(() => {
    // Get user ID from token (same logic as in ExerciseChallenge.tsx)
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

    const storageKey = userId ? `exerciseChallenge_${userId}` : "exerciseChallenge_guest";
    const savedChallenge = localStorage.getItem(storageKey);

    if (savedChallenge) {
      const parsedChallenge = JSON.parse(savedChallenge);

      const completedDays = (parsedChallenge as ChallengeDay[]).filter(day => day.completed);
      let nextDay = 1;

      if (completedDays.length > 0) {
        const sortedDays = [...completedDays].sort((a: ChallengeDay, b: ChallengeDay) => a.day - b.day);
        const lastCompletedDay = sortedDays[sortedDays.length - 1];

        if (sortedDays.length === lastCompletedDay.day) {
          nextDay = lastCompletedDay.day + 1;
        } else {
          for (let i = 1; i <= sortedDays.length + 1; i++) {
            if (!parsedChallenge.some((day: ChallengeDay) => day.day === i && day.completed)) {
              nextDay = i;
              break;
            }
          }
        }
      }

      // Make sure we don't go past 100
      nextDay = Math.min(nextDay, 100);

      // Get the exercise for that day
      const nextDayData = parsedChallenge[nextDay - 1];

      if (nextDayData && nextDayData.exercise) {
        setNextChallenge({
          day: nextDay,
          exerciseName: nextDayData.exercise.name || "Exercise",
          muscleGroup: nextDayData.muscleGroup || "Fitness",
        });
      } else {
        // Set default values if no exercise data is available yet
        setNextChallenge({
          day: nextDay,
          exerciseName: "Day's Exercise",
          muscleGroup: nextDayData?.muscleGroup || "Fitness",
        });
      }
    }
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await httpService.get<UserDetails[]>("/user/all"); // שינוי כאן
        setAllUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Initialize navigate function
  const navigate = useNavigate();

  // Navigate to user profile when clicked
  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const fetchPosts = useCallback(
    async (pageNum: number) => {
      // Rest of your fetchPosts code unchanged
      if (loadingMore) return false;

      try {
        setLoadingMore(true);
        const { data } = await httpService.get<IPost[]>(`/post?page=${pageNum}`);

        if (data.length === 0) {
          setHasNextPage(false);
        } else if (data.length < ITEMS_PER_PAGE) {
          // If we get fewer items than the page size, we're on the last page
          setHasNextPage(false);
          setPosts(prev => {
            // Verify there are no duplicate posts
            const newPosts = data.filter(newPost => !prev.find(post => post._id === newPost._id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(prev => {
            const newPosts = data.filter(newPost => !prev.find(post => post._id === newPost._id));
            return [...prev, ...newPosts];
          });
          // There might be more pages since we got exactly ITEMS_PER_PAGE items
          setHasNextPage(true);
        }
        setLoadingMore(false);
        return true;
      } catch (err) {
        console.error("Error fetching posts:", err);
        setLoadingMore(false);
        return false;
      }
    },
    [loadingMore]
  );

  // Rest of your Dashboard component code remains unchanged
  const updateSinglePost = (updatedPost: IPost) => {
    setPosts(prevPosts => prevPosts.map(post => (post._id === updatedPost._id ? updatedPost : post)));
  };

  // Improved scroll handler with debounce
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isFetching = false;

    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.body.offsetHeight;
      const scrollThreshold = documentHeight - 300;

      // Clear any existing timeout to prevent multiple rapid calls
      clearTimeout(scrollTimeout);

      // Set a new timeout to debounce the scroll event
      scrollTimeout = setTimeout(async () => {
        if (scrollPosition >= scrollThreshold && hasNextPage && !loadingMore && !isFetching) {
          isFetching = true; // Local flag to prevent concurrent fetches
          console.log(`Loading more posts from page ${page + 1}`);

          const success = await fetchPosts(page + 1);
          if (success) {
            setPage(prev => prev + 1);
          }

          isFetching = false;
        }
      }, 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [fetchPosts, hasNextPage, loadingMore, page]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchPosts(1);
  }, []);

  const refreshPosts = () => {
    // Reset page and posts when we want to refresh
    setPage(1);
    setPosts([]);
    setHasNextPage(true);
    setLoadingMore(false);
    httpService
      .get<IPost[]>(`/post?page=1`)
      .then(({ data }) => {
        setPosts(data);
        setHasNextPage(data.length === ITEMS_PER_PAGE);
      })
      .catch(err => {
        console.error("Error refreshing posts:", err);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPEG, PNG, and GIF images are allowed");
        console.log("Only JPEG, PNG, and GIF images are allowed");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size cannot exceed 5MB");
        console.log("Image size cannot exceed 5MB");
        return;
      }

      setPostImage(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setError("");
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPostText.trim() && !postImage) {
      setError("Post must contain text or an image");
      return;
    }

    try {
      setIsLoading(true);

      let imageUrl = "";

      // If there's an image, upload it first
      if (postImage) {
        const formData = new FormData();
        formData.append("postImage", postImage);

        const uploadResponse = await httpService.post<{ imageUrl: string }>("/post/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        imageUrl = uploadResponse.data.imageUrl;
      }

      // Create the post
      const postData = {
        body: newPostText,
        imageUrl: imageUrl || undefined,
      };

      await httpService.post("/post", postData);

      // Reset form and fetch updated posts
      setNewPostText("");
      setError("");
      setPostImage(null);
      setImagePreview(null);
      refreshPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await httpService.post(`/post/${postId}/like`);

      // Update posts state
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post._id === postId) {
            const userId = user?._id || "";
            // Toggle like
            if (post.likes.includes(userId)) {
              return { ...post, likes: post.likes.filter(id => id !== userId) };
            } else {
              return { ...post, likes: [...post.likes, userId] };
            }
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error liking post:", error);
      setError("Failed to like post");
    }
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    setImagePreview(null);
  };

  const onCommentInputChange = (postId: string, value: string) => {
    setNewComment(prev => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment[postId]?.trim()) return;

    try {
      await httpService.post(`/post/${postId}/comment`, {
        text: newComment[postId],
      });

      // Clear comment input
      setNewComment(prev => ({
        ...prev,
        [postId]: "",
      }));

      // Refresh the specific post to show new comment immediately
      const updatedPost = await httpService.get<IPost>(`/post/${postId}`);
      if (updatedPost.data) {
        setPosts(prevPosts => prevPosts.map(post => (post._id === postId ? updatedPost.data : post)));
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment");
    }
  };

  // Helper function to get emoji for muscle group
  const getMuscleGroupEmoji = (muscleGroup: string): string => {
    const group = muscleGroup?.toLowerCase() || "";

    if (group.includes("back")) return "🔙";
    if (group.includes("cardio")) return "🏃";
    if (group.includes("chest")) return "💪";
    if (group.includes("arm")) return "💪";
    if (group.includes("leg")) return "🦵";
    if (group.includes("neck")) return "🧘";
    if (group.includes("shoulder")) return "🏋️";
    if (group.includes("waist")) return "🔥";

    return "🏆";
  };

  return (
    <div className='dashboard-container'>
      <NavBar user={user} />
      <div className='dashboard-content'>
        {/* Left Sidebar - 20% */}
        <div className='left-sidebar'>
          {/* Groups Section */}
          <div className='group-section'>
            <div className='section-header'>
              <h3>MY GROUP</h3>
              <span className='section-header-dots'>···</span>
            </div>
            <div className='group-list'>
              <div className='group-item'>
                <div className='group-icon' style={{ backgroundColor: "#8CDCFE" }}>
                  P
                </div>
                <div className='group-name'>Pickolab Studio</div>
              </div>
              <div className='group-item'>
                <div className='group-icon' style={{ backgroundColor: "#1c1c1c", color: "white" }}>
                  A
                </div>
                <div className='group-name'>Aksantara Digital</div>
              </div>
              <div className='group-item'>
                <div className='group-icon' style={{ backgroundColor: "#f0f2f5" }}>
                  D
                </div>
                <div className='group-name'>Design Jam Indonesia</div>
              </div>
              <div className='group-item'>
                <div className='group-icon' style={{ backgroundColor: "#6244BB", color: "white" }}>
                  T
                </div>
                <div className='group-name'>The Design Thinker</div>
              </div>
            </div>
          </div>

          {/* Friends Section */}
          <div className='friends-section'>
            <div className='section-header'>
              <h3>USERS</h3>
              <span className='section-header-dots'>···</span>
            </div>
            <div className='friends-list'>
              {loadingUsers ? (
                <div className='loading'>Loading users...</div>
              ) : allUsers.length > 0 ? (
                allUsers.map(userItem => (
                  <div key={userItem._id} className='friend-item' onClick={() => handleUserClick(userItem._id)} style={{ cursor: "pointer" }}>
                    <img src={userItem.profilePicture || "/default-avatar.png"} alt={userItem.username} className='friend-avatar' />
                    <div className='friend-name'>{userItem.username}</div>
                    <div className='friend-online-indicator'></div>
                  </div>
                ))
              ) : (
                <div className='no-users'>No users found</div>
              )}
            </div>
          </div>
        </div>
        {/* Main Content Area - 80% */}
        <div className='main-content'>
          {/* Create Post Section */}
          <div className='create-post-container'>
            <h2>Welcome Back, {user?.username} 👋</h2>
            <form onSubmit={handlePostSubmit}>
              <div className='post-input-container'>
                <img src={user?.profilePicture || "/default-avatar.png"} alt='Profile' className='profile-image-input' />
                <input type='text' placeholder="What's on your mind?" value={newPostText} onChange={e => setNewPostText(e.target.value)} className='post-input' />
              </div>

              {imagePreview && (
                <div className='image-preview-container'>
                  <img src={imagePreview} alt='Preview' className='image-preview' />
                  <button type='button' className='remove-image-btn' onClick={handleRemoveImage}>
                    ×
                  </button>
                </div>
              )}

              {error && <div className='error-message'>{error}</div>}

              <div className='post-actions'>
                <label className='upload-image-btn'>
                  <FontAwesomeIcon icon={faImage} /> Add Photo
                  <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                <div>
                  <button type='submit' className='post-submit-btn' disabled={isLoading || (!newPostText.trim() && !postImage)}>
                    {isLoading ? " Posting... " : " Post "} &nbsp;
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Posts Section */}
          <div className='posts-container'>
            {isLoading && posts.length === 0 && <div className='loading'>Loading posts...</div>}

            {!isLoading && posts.length === 0 && (
              <div className='no-posts'>
                <p>No posts yet. Be the first to share something!</p>
              </div>
            )}

            {user && posts.map(post => <Post key={post._id} post={post} handleAddComment={handleAddComment} user={user} setSelectedPostId={setSelectedPostId} showComment={false} newComment={newComment} handleLike={handleLike} refetchPosts={refreshPosts} updateSinglePost={updateSinglePost} onCommentInputChange={onCommentInputChange} />)}

            {loadingMore && <div className='loading-more'>Loading more posts...</div>}
            {!hasNextPage && posts.length > 0 && <div className='no-more-posts'>No more posts to load</div>}
          </div>
        </div>

        {selectedPostId && user && (
          <div className='modal'>
            <div className='modal-content'>
              <button className='close-btn' onClick={() => setSelectedPostId(null)}>
                ×
              </button>
              <Post post={posts.find(p => p._id === selectedPostId)!} setSelectedPostId={setSelectedPostId} user={user} handleAddComment={handleAddComment} onCommentInputChange={onCommentInputChange} showComment={true} newComment={newComment} handleLike={handleLike} refetchPosts={refreshPosts} updateSinglePost={updateSinglePost} />
            </div>
          </div>
        )}

        {/* Right Sidebar - 20% */}
        <div className='sidebar'>
          {/* Next Challenge Section */}
          <div className='sidebar-section'>
            <h3>Your Next Challenge</h3>
            {nextChallenge ? (
              <div className='challenge-card'>
                <h4>
                  {getMuscleGroupEmoji(nextChallenge.muscleGroup)} Day {nextChallenge.day}: {nextChallenge.exerciseName}
                </h4>
                <p>{nextChallenge.muscleGroup} exercise</p>
                <Link to='/exercises'>
                  <button className='challenge-btn'>Start Now</button>
                </Link>
              </div>
            ) : (
              <div className='challenge-card'>
                <h4>Great Job!</h4>
                <p>You finished the challenge! 🏆</p>
                <Link to='/exercises'>
                  <button className='challenge-btn'>See your process</button>
                </Link>
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className='sidebar-section'>
            <h3>Achievements</h3>
            <div className='badges-container'>
              <div className='badge'>🏃</div>
              <div className='badge'>🏋️</div>
              <div className='badge'>🚴</div>
              <div className='badge'>🏅</div>
            </div>
          </div>

          {/* Latest Activity Section */}
          <div className='sidebar-section'>
            <h3>Latest Activity</h3>
            <div className='activity-empty'>
              <p>No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
