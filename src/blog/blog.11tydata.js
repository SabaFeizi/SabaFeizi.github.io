// Directory data for blog posts (src/blog/*.md).
// Posts with an external_url, or marked as draft, do not get their own page.
export default {
  layout: "layouts/post.njk",
  tags: ["posts"],
  eleventyComputed: {
    permalink: (data) => {
      // No page for drafts, external posts, or when the Blog tab is switched off.
      if (data.draft || data.external_url || data.site?.tabs?.blog === false) return false;
      return `/blog/${data.page.fileSlug}/`;
    },
    eleventyExcludeFromCollections: (data) => Boolean(data.draft),
  },
};
