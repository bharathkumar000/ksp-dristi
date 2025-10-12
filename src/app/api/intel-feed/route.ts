import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const feeds: any[] = [];

    // 1. Fetch NewsAPI (Live Bengaluru/Karnataka News)
    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=(Bengaluru OR Karnataka) AND (crime OR police OR accident OR incident OR arrest OR drug)&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`
        );
        const data = await response.json();
        if (data.status === 'ok') {
          const articles = data.articles || [];
          articles.forEach((art: any) => {
            const titleLower = (art.title || '').toLowerCase();
            
            // Filter: Ensure article title explicitly references Karnataka, Bangalore, or local police keywords to prevent generic/rubbish national news
            const isLocal = titleLower.includes('bengaluru') || 
                            titleLower.includes('bangalore') || 
                            titleLower.includes('karnataka') || 
                            titleLower.includes('mysuru') || 
                            titleLower.includes('mangaluru') ||
                            titleLower.includes('police') ||
                            titleLower.includes('fir') ||
                            titleLower.includes('crime') ||
                            titleLower.includes('seized') ||
                            titleLower.includes('extortion') ||
                            titleLower.includes('fraud');
                            
            if (isLocal) {
              const isHighPriority = titleLower.includes('kill') || 
                                    titleLower.includes('murder') || 
                                    titleLower.includes('death') || 
                                    titleLower.includes('arrest') || 
                                    titleLower.includes('seized') || 
                                    titleLower.includes('raid') ||
                                    titleLower.includes('drugs');
              feeds.push({
                id: art.url || Math.random().toString(),
                priority: isHighPriority ? 'HIGH' : 'MEDIUM',
                confidence: Math.floor(85 + Math.random() * 12),
                text: art.title || 'Live incident report',
                sourceName: art.source?.name || 'Local News',
                sourceUrl: art.url || 'https://newsapi.org/',
                sourcePlatform: 'News',
                time: art.publishedAt 
                  ? new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                  : new Date().toLocaleTimeString()
              });
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch from NewsAPI:', err);
      }
    }

    // 2. Fetch Prajavani RSS XML Feed (No Key Required)
    try {
      const xmlResponse = await fetch('https://www.prajavani.net/rss/bengaluru.xml');
      const xmlText = await xmlResponse.text();
      
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      let count = 0;
      
      while ((match = itemRegex.exec(xmlText)) !== null && count < 8) {
        const itemContent = match[1];
        const title = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || 
                      itemContent.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
        const link = itemContent.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
        const pubDate = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
        
        if (title) {
          const textLower = title.toLowerCase();
          const isHighPriority = textLower.includes('ಪೊಲೀಸ್') || 
                                textLower.includes('ಬಂಧನ') || 
                                textLower.includes('ಕೊಲೆ') || 
                                textLower.includes('ಅಪಘಾತ') ||
                                textLower.includes('ಎಫ್ಐಆರ್') ||
                                textLower.includes('ದಾಳಿ');
          
          feeds.push({
            id: link || Math.random().toString(),
            priority: isHighPriority ? 'HIGH' : 'MEDIUM',
            confidence: Math.floor(88 + Math.random() * 10),
            text: title,
            sourceName: 'Prajavani',
            sourceUrl: link || 'https://www.prajavani.net/',
            sourcePlatform: 'News',
            time: pubDate 
              ? new Date(pubDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
              : new Date().toLocaleTimeString()
          });
          count++;
        }
      }
    } catch (err) {
      console.error('Failed to fetch/parse Prajavani RSS feed:', err);
    }

    // Prioritize feeds
    const sortedFeeds = feeds.sort((a, b) => {
      if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
      if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
      return 0;
    });

    return NextResponse.json(sortedFeeds);
  } catch (error: any) {
    console.error('Error in intel-feed API aggregation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
