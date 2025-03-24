import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faCamera, faSave, faImage, faComment } from "@fortawesome/free-solid-svg-icons";
import "./Profile.css";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import NavBar from "../NavBar/NavBar";
import { IPost } from "../Dashboard/Dashboard";
import PostGrid from "../PostGrid/PostGrid";

interface ProfileProps {
  user: UserDetails | undefined;
  isLoadingUser: boolean;
  refetchUser: () => void;
  signOut: () => void;
}

function Profile({ user, isLoadingUser, refetchUser }: ProfileProps) {
  const [editedProfile, setEditedProfile] = useState<UserDetails | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    username: "",
    profilePicture: "",
  });
  const [posts, setPosts] = useState<IPost[]>([]);
  const [_isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(true);
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profileUser, setProfileUser] = useState<UserDetails | null>(null);
  const [_isLoadingProfileUser, setIsLoadingProfileUser] = useState(false);
  const postsRef = useRef<HTMLDivElement>(null);

  // Load user data when component mounts or userId changes
  useEffect(() => {
    if (isLoadingUser) {
      return;
    }
    const targetUserId = userId || user?._id;

    if (targetUserId) {
      fetchUserPosts(targetUserId);

      // Determine if viewing own profile
      const isOwnProfile = targetUserId === user?._id;
      setIsViewingOwnProfile(isOwnProfile);

      // If viewing another user's profile, fetch their details
      if (!isOwnProfile) {
        fetchUserDetails(targetUserId);
      }
    } else {
      navigate("/sign-up");
    }
  }, [userId, user, navigate, isLoadingUser]);

  // Add useEffect to refresh when userId changes
  useEffect(() => {
    if (userId && user && userId !== user._id && !isLoadingUser) {
      fetchUserDetails(userId);
    }
  }, [userId, user?._id]);

  // Separately fetch badges
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

  const fetchUserPosts = async (targetUserId?: string) => {
    setIsLoadingPosts(true);
    try {
      const targetId = targetUserId || userId || user?._id;
      if (!targetId) {
        setIsLoadingPosts(false);
        return;
      }
      const { data } = await httpService.get<IPost[]>(`/post/user/${targetId}`);
      setPosts(data);

      // Update isViewingOwnProfile flag
      const isOwnProfile = targetId === user?._id;
      setIsViewingOwnProfile(isOwnProfile);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setError("Failed to load posts");
    } finally {
      setIsLoadingPosts(false);
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

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      setImagePreview(null);
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

  const handleNavigateToAchievements = () => {
    navigate(`/achievements${isViewingOwnProfile ? "" : `/${userId}`}`);
  };

  const handleShowMoreClick = () => {
    postsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (isLoadingUser) {
    return <div className='loading-container'>Loading profile...</div>;
  }

  // Use current user data or fetched profile user data
  const displayUser = isViewingOwnProfile ? user : profileUser;

  return (
    <>
      <NavBar user={user} />
      <div className='profile-page'>
        {/* Profile Header Section */}
        <div className='profile-header'>
          <div className='profile-container'>
            <div className='profile-content'>
              {/* Profile picture container */}
              <div className='profile-picture-container'>
                {isViewingOwnProfile && editedProfile ? (
                  <>
                    <div className='profile-picture-edit'>
                      <img src={imagePreview ?? (displayUser?.profilePicture || "/default-avatar.png")} alt='Profile' className='profile-picture' />
                      <label className='profile-picture-upload'>
                        <FontAwesomeIcon icon={faCamera} />
                        <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
                      </label>
                    </div>
                    {validationErrors.profilePicture && <div className='validation-error'>{validationErrors.profilePicture}</div>}
                  </>
                ) : (
                  <img src={displayUser?.profilePicture || "/default-avatar.png"} alt='Profile' className='profile-picture' />
                )}
              </div>

              <div className='profile-actions'>
                <button className='message-btn' onClick={handleNavigateToAchievements}>
                  <FontAwesomeIcon icon={faComment} /> Achievements
                </button>
                {isViewingOwnProfile && (
                  <button className='edit-btn' onClick={toggleEditMode}>
                    <FontAwesomeIcon icon={editedProfile ? faSave : faEdit} /> {editedProfile ? "Cancel" : "Edit Profile"}
                  </button>
                )}
              </div>

              <div className='profile-details'>
                {error && <div className='error-message'>{error}</div>}

                <div className='profile-title'>
                  <h1>{displayUser?.username || "Update your username!"}</h1>
                </div>

                {isViewingOwnProfile && editedProfile ? (
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
                    <button className='edit-profile-btn save-btn' onClick={handleSaveProfile}>
                      <FontAwesomeIcon icon={faSave} /> Save Changes
                    </button>
                  </div>
                ) : (
                  <>
                    <div className='profile-info'>
                      <p className='profile-email'>{displayUser?.email}</p>

                      {displayUser?.bio ? (
                        <div className='bio'>
                          <p>{displayUser?.bio}</p>
                        </div>
                      ) : (
                        <div className='bio'>
                          <p className='empty-bio'>Your bio is empty—let others know who you are!</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Stats section */}
                <div className='profile-stats'>
                  <div className='stat-item'>
                    <div className='stat-number'>{posts.length}</div>
                    <div className='stat-label'>Posts</div>
                  </div>
                  <div className='stat-item'>
                    <div className='stat-number'>{displayUser?.badges?.length || 0}</div>
                    <div className='stat-label'>Badges</div>
                  </div>
                  <div className='stat-item'>
                    <div className='stat-number'>{posts.reduce((total, post) => total + post.comments.length, 0)}</div>
                    <div className='stat-label'>Comments</div>
                  </div>
                </div>

                {/* Show more button */}
                <button className='show-more-btn' onClick={handleShowMoreClick}>
                  Show more
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className='profile-posts-section' ref={postsRef}>
          <div className='profile-tabs'>
            <h3 className='tab-title'>
              <FontAwesomeIcon icon={faImage} />
              {isViewingOwnProfile ? "My Posts" : `${displayUser?.username}'s Posts`}
              <span className='subtitle'>{isViewingOwnProfile ? "Content you've shared with the community" : "Content shared with the community"}</span>
            </h3>

            <PostGrid user={user} isLoadingUser={isLoadingUser} type='profile' userId={userId} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
