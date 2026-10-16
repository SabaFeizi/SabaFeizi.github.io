// Directory data for blog posts (src/blog/*.md).
// Posts with an external_url, or marked as draft, do not get their own page.
export default {
  layout: "layouts/post.njk",
  tags: ["posts"],
  eleventyComputed: {
    permalink: (data) => {
      if (data.draft || data.external_url) return false;
      return `/blog/${data.page.fileSlug}/`;
    },
    eleventyExcludeFromCollections: (data) => Boolean(data.draft),
  },
};
