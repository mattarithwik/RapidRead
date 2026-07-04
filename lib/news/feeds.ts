import type { CountryCode, Topic } from "@/lib/types";

export interface NewsFeedSource {
  sourceId: string;
  sourceName: string;
  sourceCountry: CountryCode;
  topicHint: Topic;
  url: string;
}

export const RSS_FEEDS: NewsFeedSource[] = [
  // Global — politics & world
  {
    sourceId: "guardian-intl",
    sourceName: "The Guardian International",
    sourceCountry: "GLOBAL",
    topicHint: "Politics",
    url: "https://www.theguardian.com/international/rss"
  },
  {
    sourceId: "bbc-top",
    sourceName: "BBC Top Stories",
    sourceCountry: "GLOBAL",
    topicHint: "Politics",
    url: "https://feeds.bbci.co.uk/news/rss.xml"
  },
  {
    sourceId: "guardian-world",
    sourceName: "The Guardian World",
    sourceCountry: "GLOBAL",
    topicHint: "Politics",
    url: "https://www.theguardian.com/world/rss"
  },
  {
    sourceId: "aljazeera",
    sourceName: "Al Jazeera",
    sourceCountry: "GLOBAL",
    topicHint: "Politics",
    url: "https://www.aljazeera.com/xml/rss/all.xml"
  },

  // Global — topic feeds
  {
    sourceId: "guardian-climate",
    sourceName: "The Guardian Climate",
    sourceCountry: "GLOBAL",
    topicHint: "Climate",
    url: "https://www.theguardian.com/environment/climate-crisis/rss"
  },
  {
    sourceId: "guardian-environment",
    sourceName: "The Guardian Environment",
    sourceCountry: "GLOBAL",
    topicHint: "Environment",
    url: "https://www.theguardian.com/environment/rss"
  },
  {
    sourceId: "guardian-science",
    sourceName: "The Guardian Science",
    sourceCountry: "GLOBAL",
    topicHint: "Science",
    url: "https://www.theguardian.com/science/rss"
  },
  {
    sourceId: "guardian-business",
    sourceName: "The Guardian Business",
    sourceCountry: "GLOBAL",
    topicHint: "Business",
    url: "https://www.theguardian.com/business/rss"
  },
  {
    sourceId: "guardian-tech",
    sourceName: "The Guardian Technology",
    sourceCountry: "GLOBAL",
    topicHint: "Technology",
    url: "https://www.theguardian.com/technology/rss"
  },
  {
    sourceId: "guardian-sport",
    sourceName: "The Guardian Sport",
    sourceCountry: "GLOBAL",
    topicHint: "Sports",
    url: "https://www.theguardian.com/sport/rss"
  },
  {
    sourceId: "guardian-culture",
    sourceName: "The Guardian Culture",
    sourceCountry: "GLOBAL",
    topicHint: "Entertainment",
    url: "https://www.theguardian.com/culture/rss"
  },
  {
    sourceId: "guardian-education",
    sourceName: "The Guardian Education",
    sourceCountry: "GLOBAL",
    topicHint: "Education",
    url: "https://www.theguardian.com/education/rss"
  },

  // United States
  {
    sourceId: "nyt-technology",
    sourceName: "NYTimes Technology",
    sourceCountry: "US",
    topicHint: "Technology",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"
  },
  {
    sourceId: "nyt-business",
    sourceName: "NYTimes Business",
    sourceCountry: "US",
    topicHint: "Finance",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"
  },
  {
    sourceId: "nyt-science",
    sourceName: "NYTimes Science",
    sourceCountry: "US",
    topicHint: "Science",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml"
  },
  {
    sourceId: "nyt-health",
    sourceName: "NYTimes Health",
    sourceCountry: "US",
    topicHint: "Health",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml"
  },
  {
    sourceId: "nyt-sports",
    sourceName: "NYTimes Sports",
    sourceCountry: "US",
    topicHint: "Sports",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml"
  },
  {
    sourceId: "npr-news",
    sourceName: "NPR News",
    sourceCountry: "US",
    topicHint: "Politics",
    url: "https://feeds.npr.org/1001/rss.xml"
  },
  {
    sourceId: "npr-business",
    sourceName: "NPR Business",
    sourceCountry: "US",
    topicHint: "Business",
    url: "https://feeds.npr.org/1006/rss.xml"
  },
  {
    sourceId: "npr-science",
    sourceName: "NPR Science",
    sourceCountry: "US",
    topicHint: "Science",
    url: "https://feeds.npr.org/1007/rss.xml"
  },
  {
    sourceId: "npr-health",
    sourceName: "NPR Health",
    sourceCountry: "US",
    topicHint: "Health",
    url: "https://feeds.npr.org/1128/rss.xml"
  },
  {
    sourceId: "npr-tech",
    sourceName: "NPR Technology",
    sourceCountry: "US",
    topicHint: "Technology",
    url: "https://feeds.npr.org/1019/rss.xml"
  },
  {
    sourceId: "cnn-top",
    sourceName: "CNN Top Stories",
    sourceCountry: "US",
    topicHint: "Politics",
    url: "http://rss.cnn.com/rss/cnn_topstories.rss"
  },
  {
    sourceId: "techcrunch",
    sourceName: "TechCrunch",
    sourceCountry: "US",
    topicHint: "AI",
    url: "https://techcrunch.com/feed/"
  },

  // United Kingdom
  {
    sourceId: "bbc-world",
    sourceName: "BBC World",
    sourceCountry: "GB",
    topicHint: "Politics",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml"
  },
  {
    sourceId: "bbc-tech",
    sourceName: "BBC Technology",
    sourceCountry: "GB",
    topicHint: "Technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml"
  },
  {
    sourceId: "bbc-business",
    sourceName: "BBC Business",
    sourceCountry: "GB",
    topicHint: "Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml"
  },
  {
    sourceId: "bbc-science",
    sourceName: "BBC Science & Environment",
    sourceCountry: "GB",
    topicHint: "Science",
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"
  },
  {
    sourceId: "bbc-health",
    sourceName: "BBC Health",
    sourceCountry: "GB",
    topicHint: "Health",
    url: "https://feeds.bbci.co.uk/news/health/rss.xml"
  },
  {
    sourceId: "bbc-sport",
    sourceName: "BBC Sport",
    sourceCountry: "GB",
    topicHint: "Sports",
    url: "https://feeds.bbci.co.uk/sport/rss.xml"
  },
  {
    sourceId: "guardian-uk-tech",
    sourceName: "The Guardian UK Technology",
    sourceCountry: "GB",
    topicHint: "Cybersecurity",
    url: "https://www.theguardian.com/uk/technology/rss"
  },
  {
    sourceId: "sky-news",
    sourceName: "Sky News",
    sourceCountry: "GB",
    topicHint: "Politics",
    url: "https://feeds.skynews.com/feeds/rss/home.xml"
  },

  // Canada
  {
    sourceId: "cbc-top",
    sourceName: "CBC Top Stories",
    sourceCountry: "CA",
    topicHint: "Politics",
    url: "https://www.cbc.ca/cmlink/rss-topstories"
  },
  {
    sourceId: "cbc-tech",
    sourceName: "CBC Technology",
    sourceCountry: "CA",
    topicHint: "Technology",
    url: "https://www.cbc.ca/cmlink/rss-technology"
  },
  {
    sourceId: "globe-mail",
    sourceName: "The Globe and Mail",
    sourceCountry: "CA",
    topicHint: "Finance",
    url: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/"
  },

  // Australia
  {
    sourceId: "abc-au-top",
    sourceName: "ABC Australia Top",
    sourceCountry: "AU",
    topicHint: "Politics",
    url: "https://www.abc.net.au/news/feed/51120/rss.xml"
  },
  {
    sourceId: "abc-au-health",
    sourceName: "ABC Australia Health",
    sourceCountry: "AU",
    topicHint: "Health",
    url: "https://www.abc.net.au/news/feed/46182/rss.xml"
  },
  {
    sourceId: "guardian-au",
    sourceName: "Guardian Australia",
    sourceCountry: "AU",
    topicHint: "Climate",
    url: "https://www.theguardian.com/australia-news/rss"
  },

  // India
  {
    sourceId: "hindu-business",
    sourceName: "The Hindu Business",
    sourceCountry: "IN",
    topicHint: "Business",
    url: "https://www.thehindu.com/business/feeder/default.rss"
  },
  {
    sourceId: "toi-top",
    sourceName: "Times of India",
    sourceCountry: "IN",
    topicHint: "Politics",
    url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"
  },
  {
    sourceId: "indian-express",
    sourceName: "Indian Express",
    sourceCountry: "IN",
    topicHint: "Politics",
    url: "https://indianexpress.com/feed/"
  },

  // Germany
  {
    sourceId: "dw-world",
    sourceName: "Deutsche Welle World",
    sourceCountry: "DE",
    topicHint: "Politics",
    url: "https://rss.dw.com/rdf/rss-en-world"
  },
  {
    sourceId: "spiegel-intl",
    sourceName: "Der Spiegel International",
    sourceCountry: "DE",
    topicHint: "Politics",
    url: "https://www.spiegel.de/international/index.rss"
  },

  // France
  {
    sourceId: "france24",
    sourceName: "France 24",
    sourceCountry: "FR",
    topicHint: "Politics",
    url: "https://www.france24.com/en/rss"
  },
  {
    sourceId: "lemonde-en",
    sourceName: "Le Monde English",
    sourceCountry: "FR",
    topicHint: "Politics",
    url: "https://www.lemonde.fr/en/rss/une.xml"
  },

  // Japan
  {
    sourceId: "japan-times",
    sourceName: "Japan Times",
    sourceCountry: "JP",
    topicHint: "Politics",
    url: "https://www.japantimes.co.jp/feed/topstories/"
  },
  {
    sourceId: "nikkei-asia",
    sourceName: "Nikkei Asia",
    sourceCountry: "JP",
    topicHint: "Finance",
    url: "https://asia.nikkei.com/rss/feed/nar"
  },

  // South Korea
  {
    sourceId: "bbc-asia-kr",
    sourceName: "BBC Asia",
    sourceCountry: "KR",
    topicHint: "Politics",
    url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml"
  },

  // China / Hong Kong
  {
    sourceId: "scmp",
    sourceName: "South China Morning Post",
    sourceCountry: "HK",
    topicHint: "Politics",
    url: "https://www.scmp.com/rss/91/feed"
  },
  {
    sourceId: "scmp-tech-cn",
    sourceName: "SCMP Technology",
    sourceCountry: "CN",
    topicHint: "Technology",
    url: "https://www.scmp.com/rss/32/feed"
  },

  // Singapore
  {
    sourceId: "strait-times",
    sourceName: "Straits Times",
    sourceCountry: "SG",
    topicHint: "Politics",
    url: "https://www.straitstimes.com/news/world/rss.xml"
  },

  // Brazil
  {
    sourceId: "agencia-brasil",
    sourceName: "Agência Brasil",
    sourceCountry: "BR",
    topicHint: "Politics",
    url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml"
  },

  // Mexico
  {
    sourceId: "mexico-news-daily",
    sourceName: "Mexico News Daily",
    sourceCountry: "MX",
    topicHint: "Politics",
    url: "https://mexiconewsdaily.com/feed/"
  },
  {
    sourceId: "bbc-latin-america",
    sourceName: "BBC Latin America",
    sourceCountry: "MX",
    topicHint: "Politics",
    url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml"
  },

  // Italy
  {
    sourceId: "the-local-it",
    sourceName: "The Local Italy",
    sourceCountry: "IT",
    topicHint: "Politics",
    url: "https://www.thelocal.it/feeds/rss.php"
  },

  // Spain
  {
    sourceId: "el-pais",
    sourceName: "El País",
    sourceCountry: "ES",
    topicHint: "Politics",
    url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada"
  },

  // Netherlands
  {
    sourceId: "nos-intl",
    sourceName: "NOS International",
    sourceCountry: "NL",
    topicHint: "Politics",
    url: "https://feeds.nos.nl/nosnieuwsbuitenland"
  },

  // Sweden
  {
    sourceId: "the-local-se",
    sourceName: "The Local Sweden",
    sourceCountry: "SE",
    topicHint: "Politics",
    url: "https://www.thelocal.se/feeds/rss.php"
  },

  // Ireland
  {
    sourceId: "breaking-news-ie",
    sourceName: "BreakingNews.ie",
    sourceCountry: "IE",
    topicHint: "Politics",
    url: "https://feeds.breakingnews.ie/bntopstories"
  },

  // Israel
  {
    sourceId: "times-of-israel",
    sourceName: "Times of Israel",
    sourceCountry: "IL",
    topicHint: "Politics",
    url: "https://www.timesofisrael.com/feed/"
  },

  // Saudi Arabia
  {
    sourceId: "arab-news",
    sourceName: "Arab News",
    sourceCountry: "SA",
    topicHint: "Business",
    url: "https://www.arabnews.com/rss.xml"
  },

  // UAE
  {
    sourceId: "bbc-middle-east-ae",
    sourceName: "BBC Middle East",
    sourceCountry: "AE",
    topicHint: "Politics",
    url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml"
  },

  // Turkey
  {
    sourceId: "hurriyet",
    sourceName: "Hürriyet Daily News",
    sourceCountry: "TR",
    topicHint: "Politics",
    url: "https://www.hurriyetdailynews.com/rss"
  },

  // Nigeria
  {
    sourceId: "premium-times",
    sourceName: "Premium Times Nigeria",
    sourceCountry: "NG",
    topicHint: "Politics",
    url: "https://www.premiumtimesng.com/feed"
  },

  // South Africa
  {
    sourceId: "iol-za",
    sourceName: "IOL News",
    sourceCountry: "ZA",
    topicHint: "Politics",
    url: "https://www.iol.co.za/rss/"
  },

  // Kenya
  {
    sourceId: "capital-fm-ke",
    sourceName: "Capital FM Kenya",
    sourceCountry: "KE",
    topicHint: "Politics",
    url: "https://www.capitalfm.co.ke/news/feed/"
  },

  // Egypt
  {
    sourceId: "all-africa-eg",
    sourceName: "AllAfrica Egypt",
    sourceCountry: "EG",
    topicHint: "Politics",
    url: "https://allafrica.com/tools/headlines/rdf/egypt/headlines.rdf"
  },

  // New Zealand
  {
    sourceId: "rnz",
    sourceName: "RNZ News",
    sourceCountry: "NZ",
    topicHint: "Politics",
    url: "https://www.rnz.co.nz/rss/news"
  },

  // Indonesia
  {
    sourceId: "cna-asean",
    sourceName: "Channel NewsAsia",
    sourceCountry: "ID",
    topicHint: "Politics",
    url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml"
  },

  // Thailand
  {
    sourceId: "bangkok-post",
    sourceName: "Bangkok Post",
    sourceCountry: "TH",
    topicHint: "Business",
    url: "https://www.bangkokpost.com/rss/data/topstories.xml"
  },

  // Philippines
  {
    sourceId: "inquirer-ph",
    sourceName: "Philippine Daily Inquirer",
    sourceCountry: "PH",
    topicHint: "Politics",
    url: "https://newsinfo.inquirer.net/feed"
  },

  // Pakistan
  {
    sourceId: "dawn-pk",
    sourceName: "Dawn",
    sourceCountry: "PK",
    topicHint: "Politics",
    url: "https://www.dawn.com/feeds/home"
  },

  // Poland
  {
    sourceId: "notes-poland",
    sourceName: "Notes from Poland",
    sourceCountry: "PL",
    topicHint: "Politics",
    url: "https://notesfrompoland.com/feed/"
  },

  // Ukraine
  {
    sourceId: "pravda-ua",
    sourceName: "Ukrainska Pravda",
    sourceCountry: "UA",
    topicHint: "Politics",
    url: "https://www.pravda.com.ua/rss/"
  },

  // Argentina
  {
    sourceId: "buenos-aires-times",
    sourceName: "Buenos Aires Times",
    sourceCountry: "AR",
    topicHint: "Politics",
    url: "https://www.batimes.com.ar/feed"
  }
];
