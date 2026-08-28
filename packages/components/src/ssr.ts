/**
 * Server-side rendering helpers for Fluid components.
 *
 * Import component definition modules before rendering so the Lit SSR
 * registry can associate each custom-element tag with its implementation.
 */
import { render, type RenderInfo, type RenderResult } from "@lit-labs/ssr";
import { LitElementRenderer } from "@lit-labs/ssr/lib/lit-element-renderer.js";
import { parse, type DefaultTreeAdapterMap } from "parse5";
import { setServerLocalizationContext } from "./internal/localization.js";

export type { RenderInfo, RenderResult } from "@lit-labs/ssr";

type ParsedNode = DefaultTreeAdapterMap["node"];
type ParsedElement = DefaultTreeAdapterMap["element"];
type ParsedParent = DefaultTreeAdapterMap["parentNode"];
type LocaleContext = { lang?: string; dir?: string };
const markerAttribute = "data-fluid-ssr-context-marker";

function attributes(element: ParsedElement): LocaleContext {
  const context: LocaleContext = {};
  for (const attribute of element.attrs) {
    if (attribute.name === "lang") context.lang = attribute.value;
    if (attribute.name === "dir") context.dir = attribute.value;
  }
  return context;
}

/** Resolve the HTML parser's actual insertion ancestry, including implied closes and foster parenting. */
function localizationContextFromPrefix(prefix: string): LocaleContext {
  const document = parse(`${prefix}<fluid-ssr-context-marker ${markerAttribute}></fluid-ssr-context-marker>`);
  let result: LocaleContext = {};
  const visit = (node: ParsedNode, inherited: LocaleContext): void => {
    const element = "attrs" in node ? node as ParsedElement : undefined;
    const own = element ? attributes(element) : {};
    const context = { ...inherited, ...own };
    if (element?.attrs.some(({ name }) => name === markerAttribute)) result = context;
    for (const child of (node as ParsedParent).childNodes ?? []) visit(child, context);
    if (element?.tagName === "template" && "content" in element) {
      const template = element as ParsedElement & { content: ParsedParent };
      for (const child of template.content.childNodes) visit(child, context);
    }
  };
  visit(document, {});
  return result;
}

function observeRender(result: RenderResult, context: { prefix: string }): RenderResult {
  function* observe(current: RenderResult): Generator<string | Promise<RenderResult>> {
    for (const chunk of current) {
      if (typeof chunk === "string") {
        context.prefix += chunk;
        yield chunk;
      } else {
        yield chunk.then((nested) => observeRender(
          typeof nested === "string" ? [nested] as RenderResult : nested,
          context
        ));
      }
    }
  }
  return observe(result) as RenderResult;
}

/**
 * Render a Lit value as an incremental SSR result.
 *
 * Consume chunks in order and await promise chunks before continuing. Use
 * `renderFluidToString` when a complete HTML string is more convenient.
 */
export function renderFluid(
  value: unknown,
  renderInfo: Partial<RenderInfo> = {}
): RenderResult {
  const request = { prefix: "" };
  class ContextualFluidRenderer extends LitElementRenderer {
    static override matchesClass(ctor: typeof HTMLElement, tagName = ""): boolean {
      return tagName.startsWith("fluid-") && LitElementRenderer.matchesClass(ctor);
    }

    override connectedCallback(): void {
      setServerLocalizationContext(this.element, localizationContextFromPrefix(request.prefix));
      super.connectedCallback();
    }
  }
  const callerRenderers = renderInfo.elementRenderers ?? [];
  const elementRenderers = [...callerRenderers, ContextualFluidRenderer, LitElementRenderer];
  return observeRender(render(value, { ...renderInfo, elementRenderers }), request);
}

async function collectRenderResult(result: RenderResult): Promise<string> {
  let output = "";

  for (const chunk of result) {
    output += typeof chunk === "string" ? chunk : await collectRenderResult(await chunk);
  }

  return output;
}

/** Render a Lit value, including declarative shadow roots, to an HTML string. */
export async function renderFluidToString(
  value: unknown,
  renderInfo: Partial<RenderInfo> = {}
): Promise<string> {
  return collectRenderResult(renderFluid(value, renderInfo));
}
