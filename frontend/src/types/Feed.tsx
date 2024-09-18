type Feed = {
  id: string;
  name: string;
  feed_url: string;
  description: string;
  image_url: string;
  auto_add_feed_items_to_library: boolean;
  last_fetched_at: string;
};

export default Feed;
