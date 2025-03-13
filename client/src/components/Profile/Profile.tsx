import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faCamera, faSave, faImage, faThumbsUp, faComment } from "@fortawesome/free-solid-svg-icons";
import "./Profile.css";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import NavBar from "../NavBar/NavBar";

////////////////////////
interface Post {
  _id: string;
  userId: string;
  user: UserDetails;
  text: string;
  imageUrl?: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: string;
  user: UserDetails;
  text: string;
  createdAt: string;
}

interface ProfileProps {
  user: UserDetails | undefined;
  isLoadingUser: boolean;
  refetchUser: () => void;
  signOut: () => void;
}

function Profile({ user, isLoadingUser, refetchUser }: ProfileProps) {
  const [editedProfile, setEditedProfile] = useState<UserDetails | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    username: "",
    profilePicture: "",
  });

  // State for user posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const navigate = useNavigate();
  const { userId } = useParams(); // For viewing other profiles
  const auth = getAuth();

  useEffect(() => {
    if (isLoadingUser) {
      return;
    }

    if (user && user.email) {
      // Use the user prop to fetch profile data
      fetchUserPosts();
    } else {
      // If no user prop, redirect to login
      navigate("/sign-up");
    }
  }, [user, navigate, isLoadingUser]);

  const fetchUserPosts = async () => {
    setIsLoadingPosts(true);
    try {
      // Determine which user's posts to fetch
      const targetUserId = userId || user?._id;

      if (!targetUserId) {
        setIsLoadingPosts(false);
        return;
      }

      const { data } = await httpService.get<Post[]>(`/post/user/${targetUserId}`);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setError("Failed to load posts");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  const validateProfileData = (): boolean => {
    let isValid = true;
    const errors = {
      username: "",
      profilePicture: "",
    };

    // Validate username
    if (!editedProfile?.username) {
      errors.username = "Username is required";
      isValid = false;
    } else if (editedProfile.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
      isValid = false;
    } else if (editedProfile.username.length > 30) {
      errors.username = "Username cannot exceed 30 characters";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_.]+$/.test(editedProfile.username)) {
      errors.username = "Username can only contain letters, numbers, underscores and periods";
      isValid = false;
    }

    // Validate profile picture if one is selected
    if (profilePictureFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(profilePictureFile.type)) {
        errors.profilePicture = "Only JPEG, PNG, and GIF images are allowed";
        isValid = false;
      } else if (profilePictureFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        errors.profilePicture = "Image size cannot exceed 5MB";
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setValidationErrors({ ...validationErrors, profilePicture: "" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [name]: value,
      });

      if (name === "username") {
        setValidationErrors({ ...validationErrors, username: "" });
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    // Validate input before saving
    if (!validateProfileData()) {
      return;
    }

    try {
      const userId = user!._id;

      const profileData = { ...editedProfile };

      // If there's a new profile picture, upload it first
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append("profilePicture", profilePictureFile);

        const uploadResponse = await httpService.post<{ imageUrl: string }>(`/user/upload-profile-picture/${userId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Update the profile data with the new image URL
        profileData.profilePicture = uploadResponse.data.imageUrl;
      }

      // Update the user profile
      const updateResponse = await httpService.put(`/user/update-profile/${userId}`, profileData);

      console.log("Profile updated:", updateResponse.data);

      setEditedProfile(null);
      setError("");
      refetchUser();
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      if (error instanceof Error) {
        setError(`Failed to update profile: ${error.message}`);
      } else {
        setError("Failed to update profile: Unknown error");
      }
    }
  };

  const toggleEditMode = () => {
    if (editedProfile) {
      // Cancel editing - reset to original values
      setEditedProfile(null);
      setProfilePictureFile(null);
      setValidationErrors({ username: "", profilePicture: "" });
      setError("");
    } else {
      setEditedProfile(user!);
    }
  };

  if (isLoadingUser) {
    return <div className='loading-container'>Loading profile...</div>;
  }

  return (
    <>
      <NavBar />
      <div className='profile-page'>
        {/* Profile Header Section */}
        <div className='profile-header'>
          <div className='profile-container'>
            <div className='profile-content'>
              <div className='profile-picture-container'>
                {editedProfile ? (
                  <>
                    <div className='profile-picture-edit'>
                      <img src={user?.profilePicture || "/default-avatar.png"} alt='Profile' className='profile-picture' />
                      <label className='profile-picture-upload'>
                        <FontAwesomeIcon icon={faCamera} />
                        <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
                      </label>
                    </div>
                    {validationErrors.profilePicture && <div className='validation-error'>{validationErrors.profilePicture}</div>}
                  </>
                ) : (
                  <img src={user?.profilePicture || "/default-avatar.png"} alt='Profile' className='profile-picture' />
                )}
              </div>

              <div className='profile-details'>
                <div className='profile-title'>
                  <h1>{user?.username}</h1>
                  <div className='profile-actions'>
                    {editedProfile ? (
                      <button className='btn edit-btn' onClick={toggleEditMode}>
                        <FontAwesomeIcon icon={faSave} /> Cancel
                      </button>
                    ) : (
                      <button className='btn edit-btn' onClick={toggleEditMode}>
                        <FontAwesomeIcon icon={faEdit} /> Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {error && <div className='error-message'>{error}</div>}

                {editedProfile ? (
                  <div className='profile-form'>
                    <div className='form-group'>
                      <label>Username</label>
                      <input type='text' name='username' value={editedProfile?.username || ""} onChange={handleInputChange} className={validationErrors.username ? "error" : ""} />
                      {validationErrors.username && <div className='validation-error'>{validationErrors.username}</div>}
                    </div>
                    <div className='form-group'>
                      <label>Bio</label>
                      <textarea name='bio' value={editedProfile?.bio || ""} onChange={handleInputChange} rows={4} placeholder='Write something about yourself...' />
                    </div>
                    <button className='btn save-btn' onClick={handleSaveProfile}>
                      <FontAwesomeIcon icon={faSave} /> Save Changes
                    </button>
                  </div>
                ) : (
                  <>
                    <div className='profile-info'>
                      {user?.bio ? (
                        <div className='bio'>
                          <h3>Bio</h3>
                          <p>{user?.bio}</p>
                        </div>
                      ) : (
                        <div className='bio'>
                          <p className='empty-bio'>No bio yet</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className='profile-posts-section'>
          <div className='profile-container'>
            <h2>
              <FontAwesomeIcon icon={faImage} /> My Posts
            </h2>
            <div className='posts-container'>
              {isLoadingPosts ? (
                <div className='loading'>Loading posts...</div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <div key={post._id} className='post-card'>
                    <div className='post-header'>
                      <img src={post.user.profilePicture || "/default-avatar.png"} alt={`${post.user.username}'s profile`} className='post-avatar' onClick={() => navigate(`/profile/${post.userId}`)} />
                      <div className='post-user-info'>
                        <h3 className='post-username' onClick={() => navigate(`/profile/${post.userId}`)}>
                          {post.user.username}
                        </h3>
                        <p className='post-date'>{formatDate(post.createdAt)}</p>
                      </div>
                    </div>

                    <div className='post-content'>
                      {post.text && <p className='post-text'>{post.text}</p>}
                      {post.imageUrl && (
                        <div className='post-image-container'>
                          <img src={post.imageUrl} alt='Post content' className='post-image' />
                        </div>
                      )}
                    </div>

                    <div className='post-stats'>
                      <span className='like-count'>
                        {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
                      </span>
                      <span className='comment-count'>
                        {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
                      </span>
                    </div>

                    <div className='post-actions'>
                      <button className={`action-btn like-btn ${post.likes.includes(user?._id || "") ? "liked" : ""}`} onClick={() => handleLike(post._id)}>
                        <FontAwesomeIcon icon={faThumbsUp} />
                        {post.likes.includes(user?._id || "") ? "Liked" : "Like"}
                      </button>
                      <button className='action-btn comment-btn' onClick={() => navigate(`/dashboard#post-${post._id}`)}>
                        <FontAwesomeIcon icon={faComment} /> Comment
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='empty-posts'>
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
