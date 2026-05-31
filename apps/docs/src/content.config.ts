import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

/**
 * Starlight content collection, uses the upstream loader + schema so we
 * get all of Starlight's frontmatter (title, description, sidebar order,
 * etc.) without re-declaring them.
 */
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() })
};
