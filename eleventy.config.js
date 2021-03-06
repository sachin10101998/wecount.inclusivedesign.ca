const errorOverlay = require("eleventy-plugin-error-overlay");
const fs = require("fs");

const dataFetcher = require("./src/utils/data-fetcher");
const htmlMinifyTransform = require("./src/transforms/html-minify.js");
const parseTransform = require("./src/transforms/parse.js");
const dateFilter = require("./src/filters/date.js");
const markdownFilter = require("./src/filters/markdown.js");
const w3DateFilter = require("./src/filters/w3-date.js");

module.exports = function(eleventyConfig) {
	// Use .eleventyignore instead of .gitignore.
	eleventyConfig.setUseGitIgnore(false);

	// Add custom collections.
	eleventyConfig.addCollection("pages", async function(collection) {
		collection = dataFetcher.sitePages();
		return collection;
	});

	eleventyConfig.addCollection("posts", async function(collection) {
		collection = dataFetcher.sitePosts();
		return collection;
	});

	eleventyConfig.addCollection("news", async function(collection) {
		collection = dataFetcher.categorizedItems("news", 8);
		return collection;
	});

	eleventyConfig.addCollection("views", async function(collection) {
		collection = dataFetcher.categorizedItems("views", 1);
		return collection;
	});

	eleventyConfig.addCollection("tags", async function(collection) {
		collection = await dataFetcher.siteTags();
		const posts = await dataFetcher.sitePosts();
		collection.map(tag => {
			const taggedPosts = posts.filter(post => {
				return post.tags.includes(tag.title);
			});

			if (taggedPosts.length) {
				tag.posts = taggedPosts;
			}

			return tag;
		});
		return collection;
	});

	// Add plugins.
	eleventyConfig.addPlugin(errorOverlay);

	// Add filters.
	eleventyConfig.addFilter("dateFilter", dateFilter);
	eleventyConfig.addFilter("markdownFilter", markdownFilter);
	eleventyConfig.addFilter("w3DateFilter", w3DateFilter);

	// Add transforms.
	eleventyConfig.addTransform("htmlmin", htmlMinifyTransform);
	eleventyConfig.addTransform("parse", parseTransform);

	// Configure passthrough file copy.
	eleventyConfig.addPassthroughCopy({"src/_includes/static/css": "css"});
	eleventyConfig.addPassthroughCopy({"src/_includes/static/fonts": "fonts"});
	eleventyConfig.addPassthroughCopy({"src/_includes/static/images": "images"});
	eleventyConfig.addPassthroughCopy({"src/_includes/static/js": "js"});

	// Configure BrowserSync.
	eleventyConfig.setBrowserSyncConfig({
		callbacks: {
			ready: (error, browserSync) => {
				// TODO: Add custom 404 page.
				const content404 = fs.readFileSync("dist/404.html");

				// Provides the 404 content without redirect.
				browserSync.addMiddleware("*", (request, response) => {
					response.write(content404);
					response.writeHead(404);
					response.end();
				});
			}
		}
	});

	return {
		dir: {
			input: "src",
			output: "dist"
		},
		passthroughFileCopy: true
	};
};
