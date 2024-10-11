// import fetch from 'fetch';

import { FeedQueryItem, convertFeedQueryItemToFeedLink } from "@/hooks/useLinksFeedQuery";
import FeedLink from "@/types/FeedLink";
import Client from "pocketbase";

const parseNewLink = async (url: string, pb: Client, feedItemId?: string): Promise<FeedLink> => {
  const formData = new FormData();
  formData.append("url", url);
  if (feedItemId) {
    formData.append("feed_item", feedItemId)
  }
  const result = await pb.send("/lynx/parse_link", {method: 'POST', body: formData});
  const queryResult = await pb
    .collection("links_feed")
    .getOne<FeedQueryItem>(result.id,{
      expand: "tags",
    });
  return convertFeedQueryItemToFeedLink(queryResult);
};

export default parseNewLink;
