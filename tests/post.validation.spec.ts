import {
  commentSchema,
  createPostSchema,
  feedSchema,
} from "../src/modules/post/posts/post.validation";

describe("post validation", () => {
  it("applies defaults to a feed query", () => {
    expect(feedSchema.query.parse({})).toEqual({
      page: 1,
      limit: 20,
      scope: "friends",
    });
  });

  it("rejects an invalid feed scope", () => {
    const result = feedSchema.query.safeParse({ scope: "unknown" });

    expect(result.success).toBe(false);
  });

  it("accepts a post with content", () => {
    expect(
      createPostSchema.body.safeParse({ content: "Hello from a test" }).success,
    ).toBe(true);
  });

  it("rejects an empty comment", () => {
    expect(commentSchema.body.safeParse({ content: " " }).success).toBe(false);
  });
});
