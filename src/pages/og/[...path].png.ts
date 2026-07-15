/**
 * Dynamic OG image endpoint — generates a 1200×630 PNG for each blog post
 * and project at build time using Satori (SVG → rsvg → PNG).
 *
 * Generated URLs:
 *   /og/blog/<post-id>.png    (linked from Post.astro og:image)
 *   /og/project/<slug>.png   (linked from [slug].astro og:image)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { site } from '@config/site';
import { Resvg } from '@resvg/resvg-js';
import type { APIContext, GetStaticPathsResult } from 'astro';
import { getCollection } from 'astro:content';
import React from 'react';
import satori from 'satori';

// Load fonts once at module level (build-time only — never runs in the browser)
const fontRoot = resolve('node_modules/@fontsource/roboto/files');
const fontRegular = readFileSync(resolve(fontRoot, 'roboto-latin-400-normal.woff'));
const fontBold = readFileSync(resolve(fontRoot, 'roboto-latin-700-normal.woff'));

const FONTS = [
  {
    name: 'Roboto',
    data: fontRegular,
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Roboto',
    data: fontBold,
    weight: 700 as const,
    style: 'normal' as const,
  },
];

const W = 1200;
const H = 630;
const ACCENT = '#4e76a0'; // default accent; overridden below if theme.color is set

function accentColor(): string {
  const c = site.theme?.color?.light;
  return c && c !== 'auto' ? c : ACCENT;
}

/** Build a satori element tree for the OG card */
function ogCard(title: string, description: string | undefined, type: string) {
  const accent = accentColor();
  const authorLine = `${site.author.name}${type === 'post' ? ' · Blog' : type === 'project' ? ' · Projects' : ''}`;
  const desc = description
    ? description.length > 140
      ? description.slice(0, 137) + '…'
      : description
    : '';
  const hostname = site.url.replace(/^https?:\/\//, '');

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: W,
        height: H,
        backgroundColor: '#ffffff',
        fontFamily: 'Roboto',
        position: 'relative',
        padding: '0',
      },
    },
    // Left accent bar
    React.createElement('div', {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 12,
        backgroundColor: accent,
      },
    }),
    // Top stripe
    React.createElement('div', {
      style: {
        width: W,
        height: 8,
        backgroundColor: accent,
        flexShrink: 0,
      },
    }),
    // Main content
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '52px 72px 44px 84px',
          justifyContent: 'space-between',
        },
      },
      // Author / section label
      React.createElement(
        'div',
        {
          style: {
            fontSize: 22,
            color: '#888888',
            fontWeight: 400,
            letterSpacing: '0.01em',
          },
        },
        authorLine,
      ),
      // Title block
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
        React.createElement(
          'div',
          {
            style: {
              fontSize: title.length > 60 ? 46 : title.length > 40 ? 52 : 60,
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.15,
            },
          },
          title,
        ),
        desc &&
          React.createElement(
            'div',
            {
              style: {
                fontSize: 26,
                color: '#555555',
                fontWeight: 400,
                lineHeight: 1.45,
              },
            },
            desc,
          ),
      ),
      // Footer
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        React.createElement(
          'div',
          { style: { fontSize: 20, color: '#aaaaaa', fontWeight: 400 } },
          hostname,
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: 16,
              color: accent,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            },
          },
          'as-folio',
        ),
      ),
    ),
  );
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const posts = await getCollection('posts', (p) => !p.data.hidden && !p.data.draft);
  const projects = await getCollection('projects');

  return [
    ...posts.map((post) => ({
      params: { path: `blog/${post.id}` },
      props: {
        title: post.data.title,
        description: post.data.description,
        type: 'post',
      },
    })),
    ...projects.map((project) => ({
      params: { path: `project/${project.id}` },
      props: {
        title: project.data.title,
        description: project.data.description,
        type: 'project',
      },
    })),
  ];
}

export async function GET({ props }: APIContext) {
  const { title, description, type } = props as {
    title: string;
    description?: string;
    type: string;
  };

  const svg = await satori(ogCard(title, description, type), {
    width: W,
    height: H,
    fonts: FONTS,
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: W } });
  const pngData = resvg.render().asPng();

  return new Response(new Uint8Array(pngData), {
    headers: { 'Content-Type': 'image/png' },
  });
}
