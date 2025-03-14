import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils";
import { IPost } from "../Dashboard/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faImage, faPaperPlane, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { UserDetails } from "../../App";
import { useState } from "react";
import { httpService } from "../../httpService";
import "./Post.css";

export function Post({
  newComment,
  onCommentInputChange,
  post,
  setSelectedPostId,
  user,
  handleAddComment,
  showComment,
  handleLike,
  refetchPosts,
}: {
  handleAddComment: (postId: string) => Promise<void>;
  user: UserDetails;
  post: IPost;
  setSelectedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  showComment: boolean;
  onCommentInputChange: (postId: string, value: string) => void;
  newComment: {
    [key: string]: string;
  };
  handleLike: (postId: string) => Promise<void>;
  refetchPosts: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState(post);
  const navigate = useNavigate();
  const [postImage, setPostImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handlePostSave = async () => {
    if (!editedPost.body.trim() && !postImage && !editedPost.image) {
      setError("Post must contain text or an image");
      return;
    }

    try {
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
        body: editedPost.body,
        imageUrl: imageUrl || editedPost.image,
      };

      await httpService.put("/post/" + editedPost._id, postData);

      // Reset form and fetch updated posts
      setError("");
      setPostImage(null);
      setImagePreview(null);
      setIsEditing(false);
      refetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post");
    }
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    setImagePreview(null);
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

  const confirmDelete = async () => {
    try {
      await httpService.delete(`/post/${post._id}`);
      setShowDeleteModal(false);
      refetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      setError("Failed to delete post");
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div key={post._id} className='post-card'>
      <div className='post-header'>
        <img src={post.user.profilePicture} alt={`${post.user.username}'s profile`} className='post-avatar' onClick={() => navigate(`/profile/${post.user._id}`)} />
        <div className='post-user-info'>
          <h3 className='post-username' onClick={() => navigate(`/profile/${post.user._id}`)}>
            {post.user.username}
          </h3>
          <p className='post-date'>{formatDate(post.createdAt)}</p>
        </div>

        {user._id === post.user._id && (
          <>
            <button
              onClick={() => {
                setIsEditing(isEditing => !isEditing);
                setEditedPost(post);
              }}
            >
              edit
            </button>
            <button onClick={() => setShowDeleteModal(true)}>delete</button>
          </>
        )}
      </div>
      <div className='post-content'>
        {post.body && !isEditing && <p className='post-text'>{post.body}</p>}
        {isEditing && (
          <input
            className='post-text'
            value={editedPost.body ?? ""}
            onChange={e => {
              setEditedPost({ ...editedPost, body: e.target.value });
            }}
          />
        )}
        {post.image && !isEditing && (
          <div className='post-image-container'>
            <img src={post.image} alt='Post content' className='post-image' />
          </div>
        )}
        {isEditing && (
          <>
            <label className='upload-image-btn'>
              <FontAwesomeIcon icon={faImage} /> {post.image ? "replace" : "add"}
              <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            <button onClick={handlePostSave}>Save</button>
          </>
        )}
        {imagePreview && (
          <div className='image-preview-container'>
            <img src={imagePreview} alt='Preview' className='image-preview' />
            <button type='button' className='remove-image-btn' onClick={handleRemoveImage}>
              ×
            </button>
          </div>
        )}
      </div>
      <div className='post-stats'>
        <span className='like-count' onClick={() => handleLike(post._id)}>
          {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
        </span>
        <span className='comment-count' onClick={() => setSelectedPostId(post._id)}>
          {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>
      <div className='post-actions'>
        <button className={`action-btn like-btn ${post.likes.includes(user?._id || "") ? "liked" : ""}`} onClick={() => handleLike(post._id)}>
          <FontAwesomeIcon icon={faThumbsUp} />
          {post.likes.includes(user?._id || "") ? "Liked" : "Like"}
        </button>
        <button className='action-btn comment-btn' onClick={() => setSelectedPostId(post._id)}>
          <FontAwesomeIcon icon={faComment} /> Comment
        </button>
      </div>

      {/* Comments Section */}
      {showComment && (
        <div className='comments-section'>
          {post.comments.length > 0 && (
            <div className='comments-list'>
              {post.comments.map(comment => (
                <div key={comment._id} className='comment'>
                  <img src={comment.user.profilePicture || "/default-avatar.png"} alt={`${comment.user.username}'s profile`} className='comment-avatar' />
                  <div className='comment-content'>
                    <div className='comment-header'>
                      <span className='comment-username'>{comment.user.username}</span>
                      <span className='comment-date'>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className='comment-text'>{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <div className='add-comment'>
            <img src={user?.profilePicture || "/default-avatar.png"} alt='Your profile' className='comment-avatar' />
            <form
              className='comment-input-container'
              onSubmit={e => {
                e.preventDefault();
                handleAddComment(post._id);
              }}
            >
              <input type='text' placeholder='Write a comment...' value={newComment[post._id] || ""} onChange={e => onCommentInputChange(post._id, e.target.value)} className='comment-input' />
              <button type='submit' className='send-comment-btn' disabled={!newComment[post._id]?.trim()}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='modal-overlay'>
          <div className='delete-modal'>
            <h3>Delete Post</h3>
            <p>Are you sure you want to delete this post?</p>
            <div className='delete-modal-actions'>
              <button onClick={cancelDelete} className='cancel-btn'>
                Cancel
              </button>
              <button onClick={confirmDelete} className='delete-btn'>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
