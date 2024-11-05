import type Tag from "./Tag";

type FeedLink = {
  id: string;
  added_to_library: Date;
  article_date: Date | null;
  author: string | null;
  excerpt: string | null;
  header_image_url: string | null;
  hostname: string | null;
  last_viewed_at: Date | null;
  read_time_display: string | null;
  summary: string | null;
  tags: Tag[];
  title: string | null;
  archive: string | null;
};
export default FeedLink;
