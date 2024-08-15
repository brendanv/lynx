import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useLinksFeedQuery, {
  convertFeedQueryItemToFeedLink,
} from "./useLinksFeedQuery";
import { PocketBaseProvider } from "@/hooks/usePocketBase";
import Client from "pocketbase";

// Mock PocketBase
vi.mock("pocketbase");

describe("useLinksFeedQuery", () => {
  let mockPocketBase;

  beforeEach(() => {
    mockPocketBase = {
      collection: vi.fn().mockReturnThis(),
      getList: vi.fn(),
      authStore: {
        model: { id: "user123" },
        onChange: (_) => {},
      },
      filter: vi.fn((str) => str),
    };

    Client.mockImplementation(() => mockPocketBase);
  });

  const wrapper = ({ children }) => (
    <div>
      <PocketBaseProvider>{children}</PocketBaseProvider>
    </div>
  );

  it("passes unread state and tag parameters correctly", async () => {
    const props = {
      page: 2,
      readState: "unread",
      tagId: "tag123",
    };

    renderHook(() => useLinksFeedQuery(props), { wrapper });

    await act(async () => {
      // Wait for the useEffect to complete
    });

    expect(mockPocketBase.getList).toHaveBeenCalledWith(
      2, // page
      15, // PAGE_SIZE
      {
        filter: "last_viewed_at = null && tags.id ?= {:tagId}",
        expand: "tags",
        sort: "-added_to_library",
      },
    );

    expect(mockPocketBase.filter).toHaveBeenCalledWith("tags.id ?= {:tagId}", {
      tagId: "tag123",
    });
  });

  it("passes read state correctly without tag", async () => {
    const props = {
      page: 1,
      readState: "read",
    };

    renderHook(() => useLinksFeedQuery(props), { wrapper });

    await act(async () => {
      // Wait for the useEffect to complete
    });

    expect(mockPocketBase.getList).toHaveBeenCalledWith(
      1, // page
      15, // PAGE_SIZE
      {
        filter: "last_viewed_at != null",
        expand: "tags",
        sort: "-added_to_library",
      },
    );
  });

  it("passes all read state correctly with tag", async () => {
    const props = {
      page: 3,
      readState: "all",
      tagId: "tag456",
    };

    renderHook(() => useLinksFeedQuery(props), { wrapper });

    await act(async () => {
      // Wait for the useEffect to complete
    });

    expect(mockPocketBase.getList).toHaveBeenCalledWith(
      3, // page
      15, // PAGE_SIZE
      {
        filter: "tags.id ?= {:tagId}",
        expand: "tags",
        sort: "-added_to_library",
      },
    );

    expect(mockPocketBase.filter).toHaveBeenCalledWith("tags.id ?= {:tagId}", {
      tagId: "tag456",
    });
  });

  it("uses default page when not provided", async () => {
    const props = {
      readState: "all",
    };

    renderHook(() => useLinksFeedQuery(props), { wrapper });

    await act(async () => {
      // Wait for the useEffect to complete
    });

    expect(mockPocketBase.getList).toHaveBeenCalledWith(
      1, // default page
      15, // PAGE_SIZE
      {
        filter: "",
        expand: "tags",
        sort: "-added_to_library",
      },
    );
  });
});

describe("convertFeedQueryItemToFeedLink", () => {
  it("correctly converts FeedQueryItem to FeedLink", () => {
    const mockFeedQueryItem: FeedQueryItem = {
      id: "1234",
      added_to_library: "2023-08-14T12:00:00Z",
      article_date: "2023-08-13T10:00:00Z",
      author: "John Doe",
      collectionId: "col123",
      collectionName: "links",
      excerpt: "This is a test excerpt",
      expand: {
        tags: [
          { id: "tag1", name: "Technology", slug: "technology" },
          { id: "tag2", name: "Science", slug: "science" },
        ],
      },
      header_image_url: "https://example.com/image.jpg",
      hostname: "example.com",
      last_viewed_at: "2023-08-14T13:00:00Z",
      read_time_display: "5 min read",
      tags: ["tag1", "tag2"],
      title: "Test Article",
      user: "user123",
    };

    const result = convertFeedQueryItemToFeedLink(mockFeedQueryItem);

    expect(result).toEqual({
      id: "1234",
      added_to_library: new Date("2023-08-14T12:00:00Z"),
      article_date: new Date("2023-08-13T10:00:00Z"),
      author: "John Doe",
      excerpt: "This is a test excerpt",
      header_image_url: "https://example.com/image.jpg",
      hostname: "example.com",
      last_viewed_at: new Date("2023-08-14T13:00:00Z"),
      read_time_display: "5 min read",
      title: "Test Article",
      tags: [
        { id: "tag1", name: "Technology", slug: "technology" },
        { id: "tag2", name: "Science", slug: "science" },
      ],
    });
  });

  it("handles null values correctly", () => {
    const mockFeedQueryItem: FeedQueryItem = {
      id: "5678",
      added_to_library: "2023-08-14T12:00:00Z",
      article_date: null,
      author: null,
      collectionId: "col123",
      collectionName: "links",
      excerpt: null,
      expand: { tags: [] },
      header_image_url: null,
      hostname: null,
      last_viewed_at: null,
      read_time_display: null,
      tags: [],
      title: null,
      user: "user123",
    };

    const result = convertFeedQueryItemToFeedLink(mockFeedQueryItem);

    expect(result).toEqual({
      id: "5678",
      added_to_library: new Date("2023-08-14T12:00:00Z"),
      article_date: null,
      author: null,
      excerpt: null,
      header_image_url: null,
      hostname: null,
      last_viewed_at: null,
      read_time_display: null,
      title: null,
      tags: [],
    });
  });
});
