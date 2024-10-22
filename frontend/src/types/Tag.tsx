type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type TagWithMetadata = Tag & {
  link_count: number;
  highlight_count: number;
};

export default Tag;
