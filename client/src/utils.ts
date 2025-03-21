import { differenceInHours, format } from "date-fns";

export function formatDate(timestamp: string) {
  const postDate = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / 60000);
  const diffInHours = differenceInHours(now, postDate);

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return format(postDate, "MMMM d, yyyy");
  }
}
