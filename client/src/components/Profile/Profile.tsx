import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faCamera, faSave, faImage } from "@fortawesome/free-solid-svg-icons";
import "./Profile.css";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import NavBar from "../NavBar/NavBar";
import { IPost } from "../Dashboard/Dashboard";
import BadgesSection from "../BadgesSection/BadgesSection";
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
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(true);
  const [showBadgeSharedModal, setShowBadgeSharedModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    if (isLoadingUser) {
      return;
    }
    const targetUserId = userId || user?._id;

    if (targetUserId) {
      fetchUserPosts(targetUserId);
      setIsViewingOwnProfile(targetUserId === user?._id);

      if (targetUserId !== user?._id) {
        fetchUserDetails(targetUserId);
      }
    } else {
      navigate("/sign-up");
    }
  }, [userId, user, navigate, isLoadingUser]);

  const [profileUser, setProfileUser] = useState<UserDetails | null>(null);
  const [isLoadingProfileUser, setIsLoadingProfileUser] = useState(false);

  const fetchUserDetails = async (targetUserId: string) => {
    setIsLoadingProfileUser(true);
    try {
      const { data } = await httpService.get<UserDetails>(`/user/${targetUserId}`);
      setProfileUser(data);
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
      const targetUserId = userId || user?._id;
      if (!targetUserId) {
        setIsLoadingPosts(false);
        return;
      }
      const { data } = await httpService.get<IPost[]>(`/post/user/${targetUserId}`);
      setPosts(data);
      // Store whether we're viewing our own profile or someone else's
      const isOwnProfile = targetUserId === user?._id;
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

  if (isLoadingUser) {
    return <div className='loading-container'>Loading profile...</div>;
  }

  const displayUser = isViewingOwnProfile ? user : profileUser;

  // Badge Shared Modal Component
  const BadgeSharedModal = () => {
    if (!showBadgeSharedModal) return null;

    return (
      <div className='modal-overlay'>
        <div className='modal-content'>
          <h2>🎉 Badge Shared Successfully! 🎖️</h2>
          <p>Now your friends can see your achievement!</p>
          <button className='modal-button' onClick={() => setShowBadgeSharedModal(false)}>
            OK
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <NavBar user={user} />
      <div className='profile-page'>
        {/* Profile Header Section */}
        <div className='profile-header'>
          <div className='profile-container'>
            <div className='profile-content'>
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

              <div className='profile-details'>
                <div className='profile-title'>
                  <h1>{displayUser?.username}</h1>
                  {isViewingOwnProfile && (
                    <div className='profile-actions'>
                      {editedProfile ? (
                        <button className='btn edit-btn' onClick={toggleEditMode}>
                          <FontAwesomeIcon icon={faSave} /> Cancel
                        </button>
                      ) : (
                        <button className='btn edit-btn' onClick={toggleEditMode}>
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {error && <div className='error-message'>{error}</div>}

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
                    <button className='btn save-btn' onClick={handleSaveProfile}>
                      <FontAwesomeIcon icon={faSave} /> Save Changes
                    </button>
                  </div>
                ) : (
                  <>
                    <div className='profile-info'>
                      {displayUser?.bio ? (
                        <div className='bio'>
                          <h3>Bio</h3>
                          <p>{displayUser?.bio}</p>
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

        <div className='badges-section'>
          <h3>Achievements</h3>
          <div className='badges-container'>{isLoadingProfileUser ? <p>Loading badges...</p> : displayUser ? <BadgesSection user={displayUser} /> : <p>No user data available</p>}</div>
        </div>

        {/* Posts Section - Modified to remove favorites tab */}
        <div className='profile-posts-section'>
          <div className='profile-container'>
            <div className='profile-tabs'>
              <h3 className='tab-title'>
                <FontAwesomeIcon icon={faImage} /> {isViewingOwnProfile ? "My Posts" : "Posts"}
              </h3>

              <PostGrid user={user} isLoadingUser={isLoadingUser} type='profile' userId={userId} />
            </div>
          </div>
        </div>

        <BadgeSharedModal />
      </div>
    </>
  );
}

export default Profile;
