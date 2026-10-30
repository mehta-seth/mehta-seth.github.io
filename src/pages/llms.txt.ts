// src/pages/llms.txt.ts — /llms.txt
//
// A plain-text guide to the site for AI assistants and answer engines,
// in the llms.txt format: a title, a one-line summary, then links with a
// line each. Built from the essay and note collections, so it never falls
// out of date; the standalone pages under /learn/ that are not notes, and
// the map on its own subdomain, are listed by hand below.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).toString();
  const essays = (await getCollection('essays', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const notes = (await getCollection('notes', ({ data }) => !data.draft))
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  const lines = [
    '# Adit Mehta',
    '',
    '> Personal website of Adit Mehta. Essays and photographs. The site also carries help me learn: single-page explainers and projects on things he is learning, from probability to London’s rock ’n’ roll history.',
    '',
    '## Essays',
    ...essays.map((e) => `- [${e.data.title}](${abs(`/essays/${e.id}/`)})${e.data.subtitle ? `: ${e.data.subtitle}` : ''}`),
    '',
    '## help me learn',
    ...notes.map((n) => `- [${n.data.title}](${abs(`/learn/${n.id}/`)})${n.data.summary ? `: ${n.data.summary}` : ''}`),
    `- [Classic Cocktails: The Gold Room](${abs('/learn/classic-cocktails/')}): A 3D bar in which bottles pour eighteen classic cocktails to IBA specifications.`,
    `- [Types of Clouds](${abs('/learn/clouds/')}): The ten cloud genera, each forming in turn in a live sky over a field.`,
    '',
    '## Projects on their own addresses',
    '- [Electric London](https://rock.mehta-seth.com/): An interactive map of over 100 London places where rock ’n’ roll happened, each with its story and sources. Every place is also listed with its story at https://rock.mehta-seth.com/places/.',
    '',
    '## More',
    `- [Cities](${abs('/cities/')}): Photographs, by city.`,
    `- [RSS feed](${abs('/rss.xml')}): New essays.`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
