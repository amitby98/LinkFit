import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import NavBar from "../NavBar/NavBar";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import "./Dashboard.css";
import { Post } from "../Post/Post";

export interface IPost {
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
  const ITEMS_PER_PAGE = 10;

  const fetchPosts = useCallback(
    async (pageNum: number) => {
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

  return (
    <>
      <NavBar />
      <div className='feed-container'>
        <div className='feed-content'>
          {/* Create Post Section */}
          <div className='create-post-container'>
            <h2>Create Post</h2>
            <form onSubmit={handlePostSubmit}>
              <div className='post-input-container'>
                <textarea placeholder="What's on your mind?" value={newPostText} onChange={e => setNewPostText(e.target.value)} className='post-input' />
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
                <button type='submit' className='post-submit-btn' disabled={isLoading || (!newPostText.trim() && !postImage)}>
                  {isLoading ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Dashboard */}
          <div className='posts-container'>
            <h2>Recent Posts</h2>

            {isLoading && posts.length === 0 && <div className='loading'>Loading posts...</div>}

            {!isLoading && posts.length === 0 && (
              <div className='no-posts'>
                <p>No posts yet. Be the first to share something!</p>
              </div>
            )}

            {user && posts.map(post => <Post key={post._id} post={post} setSelectedPostId={setSelectedPostId} user={user} handleAddComment={handleAddComment} onCommentInputChange={onCommentInputChange} showComment={false} newComment={newComment} handleLike={handleLike} refetchPosts={refreshPosts} updateSinglePost={updateSinglePost} />)}

            {loadingMore && <div className='loading-more'>Loading more posts...</div>}

            {!hasNextPage && posts.length > 0 && <div className='no-more-posts'>No more posts to load</div>}
          </div>
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
    </>
  );
};

export default Dashboard;
