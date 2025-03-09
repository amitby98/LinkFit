import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faCamera, faSave, faSignOutAlt, faImage } from "@fortawesome/free-solid-svg-icons";
import "../styles/Profile.css";
import { httpService } from "../httpService";
import { UserDetails } from "../App";

interface ProfileProps {
  user: UserDetails;
  isLoadingUser: boolean;
  refetchUser: () => void;
  signOut: () => void;
}

function Profile({ user, isLoadingUser, refetchUser, signOut }: ProfileProps) {
  const [editedProfile, setEditedProfile] = useState<UserDetails | null>(null);
  console.log({ editedProfile });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    username: "",
    profilePicture: "",
  });
  interface Post {
    id: string;
    // Add other post properties here
  }

  const [posts, setPosts] = useState<Post[]>([]);

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (isLoadingUser) {
      return;
    }

    if (user && user.email) {
      // Use the user prop to fetch profile data
      fetchUserPosts();
      console.log("Current user:", user);
    } else {
      // If no user prop, redirect to login
      navigate("/sign-up");
    }
  }, [user, navigate, isLoadingUser]);

  const fetchUserPosts = async () => {
    // This function will be implemented when you add posts functionality
    // For now, we'll just set an empty array
    setPosts([]);
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

      // Create a preview URL
      const reader = new FileReader();
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
      const userId = user._id;

      const profileData = { ...editedProfile };

      // If there's a new profile picture, upload it first
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append("profilePicture", profilePictureFile);

        const uploadResponse = await httpService.post<{ imageUrl: string }>(`http://localhost:3001/api/user/upload-profile-picture/${userId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Update the profile data with the new image URL
        profileData.profilePicture = uploadResponse.data.imageUrl;
      }

      // Update the user profile
      const updateResponse = await httpService.put(`http://localhost:3001/api/user/update-profile/${userId}`, profileData);

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
      setProfilePictureFile(null);
      setValidationErrors({ username: "", profilePicture: "" });
    } else {
      setEditedProfile(user);
    }
  };

  if (isLoadingUser) {
    return <div className='loading-container'>Loading profile...</div>;
  }

  return (
    <div className='profile-page'>
      {/* Profile Header Section */}
      <div className='profile-header'>
        <div className='profile-container'>
          <div className='profile-content'>
            <div className='profile-picture-container'>
              {editedProfile ? (
                <>
                  <div className='profile-picture-edit'>
                    <img src={user.profilePicture} alt='Profile2' className='profile-picture' />
                    <label className='profile-picture-upload'>
                      <FontAwesomeIcon icon={faCamera} />
                      <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
                    </label>
                  </div>
                  {validationErrors.profilePicture && <div className='validation-error'>{validationErrors.profilePicture}</div>}
                </>
              ) : (
                <img src={user.profilePicture} alt='Profile' className='profile-picture' />
              )}
            </div>

            <div className='profile-details'>
              <div className='profile-title'>
                <h1>{user?.username}</h1>
                <div className='profile-actions'>
                  <button className='btn edit-btn' onClick={toggleEditMode}>
                    <FontAwesomeIcon icon={editedProfile ? faSave : faEdit} />
                    {editedProfile ? " Cancel" : " Edit Profile"}
                  </button>
                  <button className='btn logout-btn' onClick={signOut}>
                    <FontAwesomeIcon icon={faSignOutAlt} /> Sign Out
                  </button>
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
                  {/* <div className='form-group'>
                    <label>Bio</label>
                    <textarea name='bio' value={editedProfile?.bio || ""} onChange={handleInputChange} rows={4} placeholder='Write something about yourself...' />
                  </div> */}
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
          <div className='posts-grid'>
            {posts.length > 0 ? (
              posts.map(post => (
                <div className='post-item' key={post.id}>
                  {/* This will be filled when you implement posts */}
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
  );
}

export default Profile;
