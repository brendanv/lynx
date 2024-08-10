// import fetch from 'fetch';

import Client from "pocketbase";

type LinkCreate = {
  added_to_library: string;
  user: string;
  last_viewed_at: string | null;
  original_url: string;
  cleaned_url: string;
  hostname: string | null;
  article_date: string | null;
  author: string | null;
  title: string | null;
  excerpt: string | null;
  header_image_url: string | null;
  article_html: string | null;
  raw_text_content: string | null;
  full_page_html: string | null;
  summary: string | null;
  read_time_seconds: number | null;
  read_time_display: string | null;
  tags: string[];
  created_from_feed: string | null;
};

const parseNewLink = async (url: string, pb: Client): LinkCreate => {
  // const result = await pb.send("/parse_link", { body: { url } });
  const formData = new FormData();
  formData.append("url", url);
  const result = await pb.send("/lynx/parse_link", {method: 'POST', body: formData});
  // const result = await fetch(url, {mode: 'no-cors'});
  console.log(result);
};

export default parseNewLink;
