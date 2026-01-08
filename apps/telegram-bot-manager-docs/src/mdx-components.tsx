import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Steps } from 'fumadocs-ui/components/steps';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    Steps,
    Tabs,
    Tab,
    ...defaultMdxComponents,
    ...components,
  };
}
