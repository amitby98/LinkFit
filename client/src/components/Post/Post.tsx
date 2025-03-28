import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils";
import { IPost, IComment } from "../Dashboard/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faImage, faPaperPlane, faHeart as solidHeart, faEdit, faTrash, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useRef, useEffect } from "react";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";

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
  updateSinglePost,
}: {
  handleAddComment: (postId: string) => Promise<void>;
  user: UserDetails | undefined;
  post: IPost;
  setSelectedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  showComment: boolean;
  onCommentInputChange: (postId: string, value: string) => void;
  newComment: {
    [key: string]: string;
  };
  handleLike: (postId: string) => Promise<void>;
  refetchPosts: () => void;
  updateSinglePost: (updatedPost: IPost) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState(post);
  const navigate = useNavigate();
  const [postImage, setPostImage] = useState<File | null>(null);
  const [_error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState<string | null>(null);
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if the current user has liked the post
  const isLiked = post.likes.includes(user?._id || "");

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuOptions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size cannot exceed 5MB");
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

  const navigateToUserProfile = (userId: string) => {
    if (!isEditing) {
      navigate(`/profile/${userId}`);
    }
  };

  const startEditComment = (comment: IComment) => {
    setEditingCommentId(comment._id);
    setEditedCommentText(comment.body);
  };

  // For deleting a comment
  const deleteComment = async (commentId: string) => {
    try {
      await httpService.delete(`/comment/${commentId}`);
      setShowDeleteCommentModal(null);

      // Instead of calling refetchPosts, fetch only this post's updated data
      const updatedPost = await httpService.get<IPost>(`/post/${post._id}`);
      if (updatedPost.data) {
        updateSinglePost(updatedPost.data);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setError("Failed to delete comment");
    }
  };

  // For editing a comment
  const saveEditedComment = async () => {
    if (!editingCommentId || !editedCommentText.trim()) return;

    try {
      await httpService.put(`/comment/${editingCommentId}`, {
        body: editedCommentText,
      });

      setEditingCommentId(null);
      setEditedCommentText("");

      // Fetch only this post's updated data
      const updatedPost = await httpService.get<IPost>(`/post/${post._id}`);
      if (updatedPost.data) {
        updateSinglePost(updatedPost.data);
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      setError("Failed to edit comment");
    }
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  return (
    <div key={post._id} className='post-card'>
      {/* Post Header */}
      <div className='post-header'>
        <div className='header-left' onClick={() => navigateToUserProfile(post.user._id)}>
          <img src={post.user?.profilePicture || "/default-avatar.png"} alt={`${post.user?.username || "User"}'s profile`} className='post-avatar' />
          <div className='post-user-info'>
            <h3 className='post-username'>{post.user.username}</h3>
          </div>
        </div>
        <div className='post-actions-menu' ref={menuRef}>
          <p className='post-date'>{formatDate(post.createdAt)}</p>
          {user?._id === post.user._id && (
            <button className='post-menu-dots' onClick={() => setShowMenuOptions(!showMenuOptions)}>
              <FontAwesomeIcon icon={faEllipsisH} />
            </button>
          )}
          <div className={`post-menu-options ${showMenuOptions ? "visible" : ""}`}>
            <button
              className='menu-option edit-option'
              onClick={() => {
                setIsEditing(!isEditing);
                setShowMenuOptions(false);
              }}>
              <FontAwesomeIcon icon={faEdit} /> Edit Post
            </button>
            <button
              className='menu-option delete-option'
              onClick={() => {
                setShowDeleteModal(true);
                setShowMenuOptions(false);
              }}>
              <FontAwesomeIcon icon={faTrash} /> Delete Post
            </button>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className='post-content'>
        {/* Text in Post */}
        {post.body && !isEditing && <p className='post-text'>{post.body}</p>}
        {isEditing && (
          <input
            className='post-text-edit'
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
          <div className='post-edit-actions'>
            <label className='upload-image-btn'>
              <FontAwesomeIcon icon={faImage} /> {post.image ? "Replace Image" : "Add Image"}
              <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            <button className='save-post-btn' onClick={handlePostSave}>
              Save
            </button>
            <button className='cancel-edit-btn' onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
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

      {/* Post Actions */}
      <div className='post-engagement'>
        <div className='add-comment'>
          <img src={user?.profilePicture || "/default-avatar.png"} alt='Your profile' className='comment-avatar' />
          <form
            className='comment-input-container'
            onSubmit={e => {
              e.preventDefault();
              handleAddComment(post._id);
            }}>
            <input type='text' placeholder='Write your comment...' value={newComment[post._id] || ""} onChange={e => onCommentInputChange(post._id, e.target.value)} className='comment-input' />
            <button type='submit' className='send-comment-btn' disabled={!newComment[post._id]?.trim()}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
        <div className='post-stats'>
          <button className={`action-btn like-btn ${isLiked ? "liked" : ""}`} onClick={() => handleLike(post._id)}>
            <span className='like-count'>
              <FontAwesomeIcon icon={isLiked ? solidHeart : regularHeart} /> {post.likes.length}
            </span>
          </button>
          <button className='action-btn comment-btn' onClick={() => setSelectedPostId(post._id)}>
            <span className='comment-count'>
              <FontAwesomeIcon icon={faComment} /> {post.comments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComment && (
        <div className='comments-section'>
          {showComment && post.comments.length > 0 && (
            <div className='comments-list'>
              {post.comments.map(comment => (
                <div key={comment._id} className='comment'>
                  <img src={comment.user.profilePicture || "/default-avatar.png"} alt={`${comment.user.username}'s profile`} className='comment-avatar' />
                  <div className='comment-content'>
                    <div className='comment-header'>
                      <span className='comment-username'>{comment.user.username}</span>
                      <span className='comment-date'>{formatDate(comment.createdAt)}</span>
                      {user?._id === comment.user._id && (
                        <div className='comment-actions'>
                          <button className='comment-action-btn' onClick={() => startEditComment(comment)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className='comment-action-btn' onClick={() => setShowDeleteCommentModal(comment._id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment._id ? (
                      <div className='edit-comment-container'>
                        <input type='text' value={editedCommentText} onChange={e => setEditedCommentText(e.target.value)} className='edit-comment-input' />
                        <div className='edit-comment-actions'>
                          <button onClick={saveEditedComment} className='save-comment-btn'>
                            Save
                          </button>
                          <button onClick={cancelEditComment} className='cancel-comment-btn'>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className='comment-text'>{comment.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='post-modal-overlay'>
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

      {/* Delete Comment Confirmation Modal */}
      {showDeleteCommentModal && (
        <div className='post-modal-overlay'>
          <div className='delete-modal'>
            <h3>Delete Comment</h3>
            <p>Are you sure you want to delete this comment?</p>
            <div className='delete-modal-actions'>
              <button onClick={() => setShowDeleteCommentModal(null)} className='cancel-btn'>
                Cancel
              </button>
              <button onClick={() => deleteComment(showDeleteCommentModal)} className='delete-btn'>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
