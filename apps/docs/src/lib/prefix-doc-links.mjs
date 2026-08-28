const defaultRootSurfaces = ["/demos", "/playground", "/storybook", "/wizard"];

/**
 * Prefix root-relative links authored inside documentation content when the
 * docs are mounted below the origin root. Links to separately built website
 * surfaces deliberately stay at the root.
 */
export function prefixDocLinks({ base = "/", rootSurfaces = defaultRootSurfaces } = {}) {
  if (!base.startsWith("/") || !base.endsWith("/")) {
    throw new Error("Documentation base must start and end with /");
  }
  const prefix = base.slice(0, -1);

  function rewrite(href) {
    if (
      typeof href !== "string" ||
      !href.startsWith("/") ||
      href.startsWith("//") ||
      href === "/" ||
      href === prefix ||
      href.startsWith(`${prefix}/`) ||
      rootSurfaces.some((surface) => href === surface || href.startsWith(`${surface}/`))
    ) {
      return href;
    }
    return `${prefix}${href}`;
  }

  return function transformer(tree) {
    if (!prefix) return;

    function visit(node) {
      if (typeof node?.url === "string") node.url = rewrite(node.url);
      if (typeof node?.properties?.href === "string") {
        node.properties.href = rewrite(node.properties.href);
      }
      for (const attribute of Array.isArray(node?.attributes) ? node.attributes : []) {
        if (attribute?.name === "href" && typeof attribute.value === "string") {
          attribute.value = rewrite(attribute.value);
        }
      }
      for (const child of Array.isArray(node?.children) ? node.children : []) visit(child);
    }

    visit(tree);
  };
}
