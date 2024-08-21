import React from 'react';
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
    <PocketBaseProvider>{children}</PocketBaseProvider>
  );
  it("passes unread state, tag parameters, and search text correctly", async () => {
    const props = {
      page: 2,
      readState: "unread",
      tagId: "tag123",
      searchText: "test query",
      sortBy: "added_to_library",
    };
    const { result } = renderHook(() => useLinksFeedQuery(props), { wrapper });
    await act(async () => {
      // Wait for the useEffect to complete
    });
    expect(mockPocketBase.getList).toHaveBeenCalledWith(
      2, // page
      15, // PAGE_SIZE
      {
        filter:
          "last_viewed_at = null && tags.id ?= {:tagId} && (title ~ {:search} || excerpt ~ {:search})",
        expand: "tags",
        sort: "-added_to_library",
      },
    );
    expect(mockPocketBase.filter).toHaveBeenCalledWith("tags.id ?= {:tagId}", {
      tagId: "tag123",
    });
    expect(mockPocketBase.filter).toHaveBeenCalledWith(
      "(title ~ {:search} || excerpt ~ {:search})",
      {
        search: "test query",
      },
    );
    // Check if the result includes loading, error, result, and refetch properties
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("result");
    expect(result.current).toHaveProperty("refetch");
    expect(typeof result.current.refetch).toBe("function");
  });
  it("refetches data when refetch is called", async () => {
    const props = {
      page: 1,
      readState: "all",
      sortBy: "added_to_library",
    };
    const { result } = renderHook(() => useLinksFeedQuery(props), { wrapper });
    await act(async () => {
      // Wait for the initial useEffect to complete
    });
    // Clear the mock calls
    mockPocketBase.getList.mockClear();
    // Call refetch
    await act(async () => {
      await result.current.refetch();
    });
    // Check if getList was called again
    expect(mockPocketBase.getList).toHaveBeenCalledTimes(1);
  });
  it("updates query when props change", async () => {
    const initialProps = {
      page: 1,
      readState: "all",
      sortBy: "added_to_library",
    };
    const { result, rerender } = renderHook(
      (props) => useLinksFeedQuery(props),
      {
        wrapper,
        initialProps,
      },
    );
    await act(async () => {
      // Wait for the initial useEffect to complete
    });
    // Clear the mock calls
    mockPocketBase.getList.mockClear();
    // Update props
    const newProps = {
      ...initialProps,
      page: 2,
      readState: "unread",
    };
    rerender(newProps);
    await act(async () => {
      // Wait for the useEffect to complete after props change
    });
    // Check if getList was called with updated parameters
    expect(mockPocketBase.getList).toHaveBeenCalledWith(
      2, // updated page
      15, // PAGE_SIZE
      {
        filter: "last_viewed_at = null",
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
