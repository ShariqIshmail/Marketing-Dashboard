// Registry of ad platform connectors, keyed by the platform value stored in the DB.
module.exports = {
  google_ads: require('./googleAds'),
  meta_ads: require('./metaAds'),
  linkedin_ads: require('./linkedinAds'),
};
