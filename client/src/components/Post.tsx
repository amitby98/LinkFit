import { useNavigate } from "react-router-dom";
import { formatDate } from "../utils";
import { IPost } from "./Dashboard/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faPaperPlane, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { UserDetails } from "../App";

export function Post({
  newComment,
  onCommentInputChange,
  post,
  setSelectedPostId,
  user,
  handleAddComment,
  showComment,
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
}) {
  const navigate = useNavigate();

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
      </div>

      <div className='post-content'>
        {post.body && <p className='post-text'>{post.body}</p>}
        {post.image && (
          <div className='post-image-container'>
            <img src={post.image} alt='Post content' className='post-image' />
          </div>
        )}
      </div>

      <div className='post-stats'>
        <span className='like-count'>
          {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
        </span>
        <span className='comment-count' onClick={() => setSelectedPostId(post._id)}>
          {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      <div className='post-actions'>
        <button
          className={`action-btn like-btn ${post.likes.includes(user?._id || "") ? "liked" : ""}`}
          //   onClick={() => handleLike(post._id)}
        >
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
              }}>
              <input type='text' placeholder='Write a comment...' value={newComment[post._id] || ""} onChange={e => onCommentInputChange(post._id, e.target.value)} className='comment-input' />
              <button className='send-comment-btn' onClick={() => handleAddComment(post._id)} disabled={!newComment[post._id]?.trim()}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
