/**
 * AI Story Classifier, Priority Scorer, and What/Why/Takeaway Summarizer.
 * Also handles live feed synchronization with Hacker News API.
 */
export function classifyAndSummarizeStory(title, body, regionHint, sourceName, sourceUrl) {
  const text = `${title} ${body}`.toLowerCase();
  let region = regionHint;

  if (!region || region === 'auto') {
    if (/(chennai|tamil nadu|coimbatore|madurai|omr|tidel|guidance tn|sriperumbudur|hosur)/.test(text)) {
      region = 'tn';
    } else if (/(india|rbi|rupee|upi|bengaluru|mumbai|delhi|sebi|isro|iit|union cabinet|nhai)/.test(text)) {
      region = 'india';
    } else {
      region = 'global';
    }
  }

  const isTech = /(ai|llm|chip|semiconductor|gpu|cloud|data centre|data center|software|saas|quantum|cyber|open-source|openai|anthropic|nvidia|google|meta|apple|developer|robotics|space)/.test(text);
  const priority = isTech ? 'p1' : 'p2';
  const category = isTech
    ? (region === 'tn' ? 'TN Tech & Semiconductors' : region === 'india' ? 'India AI & Deep-Tech' : 'Global AI & Compute')
    : (region === 'tn' ? 'TN Infra & State Policy' : region === 'india' ? 'National Economy & Infra' : 'Global Macro & Policy');

  const baseScore = isTech ? 9.1 : 8.5;
  const cleanBody = (body || '').trim();
  const firstSentence = cleanBody.split(/(?<=[.!?])\s+/)[0] || title;

  const what = cleanBody.length > 25 ? firstSentence : `${title} was reported by ${sourceName || 'trusted feed'}.`;
  const why = isTech
    ? `Directly impacts ${region === 'tn' ? 'Tamil Nadu’s deep-tech and data infrastructure ecosystem' : region === 'india' ? 'India’s sovereign AI and technology competitiveness' : 'global AI compute and developer toolchains'}.`
    : `Shapes ${region === 'tn' ? 'industrial connectivity and policy execution in Tamil Nadu' : region === 'india' ? 'macroeconomic capital costs and infrastructure rollout across India' : 'global regulatory and financial market stability'}.`;
  const takeaway = isTech
    ? 'Evaluate technical documentation, ecosystem partnerships, or API benchmarks relevant to your stack.'
    : 'Monitor policy notifications, implementation timelines, and downstream business impact.';

  return {
    id: 'story-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    region,
    priority,
    category,
    score: baseScore,
    date: 'Oct 16, 2026',
    title: title.trim(),
    what,
    why,
    takeaway,
    sourceName: sourceName || 'Trusted Feed',
    sourceUrl: sourceUrl || 'https://news.ycombinator.com'
  };
}

export async function fetchLiveHackerNewsStories(existingStories) {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  if (!res.ok) {
    throw new Error('Network unavailable');
  }
  const ids = await res.json();
  const topSlice = ids.slice(0, 6);
  const fetchedItems = await Promise.all(
    topSlice.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
  );

  const newCards = [];
  for (const raw of fetchedItems) {
    if (!raw || !raw.title) continue;
    const exists = existingStories.some(s => s.title.toLowerCase() === raw.title.toLowerCase());
    if (exists) continue;
    const card = classifyAndSummarizeStory(
      raw.title,
      '',
      'global',
      'Hacker News (Live API)',
      raw.url || `https://news.ycombinator.com/item?id=${raw.id}`
    );
    newCards.push(card);
    if (newCards.length >= 3) break;
  }
  return newCards;
}
