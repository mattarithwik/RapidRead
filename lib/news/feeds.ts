import type { CountryCode, Topic } from "@/lib/types";

export interface NewsFeedSource {
  sourceId: string;
  sourceName: string;
  sourceCountry: CountryCode;
  topicHint: Topic;
  url: string;
}

export const RSS_FEEDS: NewsFeedSource[] = [
  {
    sourceId: "nyt-technology",
    sourceName: "NYTimes Technology",
    sourceCountry: "US",
    topicHint: "Technology",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"
  },
  {
    sourceId: "bbc-world",
    sourceName: "BBC World",
    sourceCountry: "GB",
    topicHint: "Politics",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml"
  },
  {
    sourceId: "cbc-top",
    sourceName: "CBC News",
    sourceCountry: "CA",
    topicHint: "Politics",
    url: "https://www.cbc.ca/cmlink/rss-topstories"
  },
  {
    sourceId: "abc-au",
    sourceName: "ABC Australia",
    sourceCountry: "AU",
    topicHint: "Climate",
    url: "https://www.abc.net.au/news/feed/51120/rss.xml"
  },
  {
    sourceId: "hindu-business",
    sourceName: "The Hindu Business",
    sourceCountry: "IN",
    topicHint: "Business",
    url: "https://www.thehindu.com/business/feeder/default.rss"
  }
];
