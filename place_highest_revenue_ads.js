/* ----------------------------------------------------
                  CONSTANTS
------------------------------------------------------*/
// If more ad types need to be added in the future, they can be changed here
const types = ["PRE", "MID", "POST"];

/* ----------------------------------------------------
                  HELPER FUNCTIONS
------------------------------------------------------*/

/* ---------------------------------------------------
  Find all combinations of relevant ads
------------------------------------------------------*/
function recursiveCombinations(ads, k) {
  var combos, head, tailCombos;
  
  if (k > ads.length || k <= 0) {
    return [];
  }
  
  if (k == ads.length) {
    return [ads];
  }
  
  if (k == 1) {
    combos = [];
    for (i = 0; i < ads.length; i++) {
      combos.push([ads[i]]);
    }
    return combos;
  }
  
  combos = [];
  for (var i = 0; i < ads.length - k + 1; i++) {
    head = ads.slice(i, i + 1);
    tailCombos = recursiveCombinations(ads.slice(i + 1), k - 1);
    for (var j = 0; j < tailCombos.length; j++) {
      combos.push(head.concat(tailCombos[j]));
    }
  }
  return combos;
}


function getAllCombinations(id, ads) {
  const possibleAds = filterCampaignsById(id, ads);
  var combos = [];
  for (var k = 1; k <= possibleAds.length; k++) {
    var k_combos = recursiveCombinations(possibleAds, k);
    for (var i = 0; i < k_combos.length; i++) {
      combos.push(k_combos[i]);
    }
  }
  return combos;
}

/* ---------------------------------------------------
  Find amounts of ad types in an episode
------------------------------------------------------*/
// find individual counts for types (PRE, MID, POST)
function findCount(type, audio) {
  const matches = audio.match(new RegExp(type, "g"));
  return matches ? matches.length : 0;
}

// find all counts for episode returned as key value pair e.g. { PRE: 0, MID: 2, POST: 1}
function findEpisodeCounts(audio) {
  const counts = {};
  types.forEach((type) => {counts[type] = findCount(type, audio) });
  return counts;
}

/* ---------------------------------------------------
  Find amounts of ad types in a campaign
------------------------------------------------------*/
// initialize campaign count based on types array e.g. result: { PRE: 0, MID: 0, POST: 0 }
function initializeCampaignCount(types) {
  return types.reduce((count, type) => {
    count[type] = 0;
    return count;
  }, {});
}

// find all ad counts for campaign returned as key value pair e.g. { PRE: 0, MID: 2, POST: 1}
function findCampaignCount(campaign){
  const counts = initializeCampaignCount(types);
  campaign.forEach((spot) => { counts[spot.type]++ });
  return counts;
}

/* ---------------------------------------------------
  Comparison Functions
------------------------------------------------------*/
// calculate revenue for campaign
function findRevenue(campaign) {
  return campaign.reduce((total, spot) => { return total + spot.revenue}, 0);
}

// find if campaign can be placed because the number/types of ads for the campaign are less than that of the episode
function campaignCanBePlaced(episode, campaign) {
  return campaign.PRE <= episode.PRE && campaign.MID <= episode.MID && campaign.POST <= episode.POST;
}

//remove extra ads from audio
function stripCampaigns(audio) {
  return audio.replace(/\[|\]|pre|mid|post/gi, '');
}

/* ---------------------------------------------------
  Filter campaigns
------------------------------------------------------*/
// find all possible campaigns to be used based on episode Id, returns array of filtered campaigns 
function filterCampaignsById(episodeId, campaigns) {
  return campaigns.filter(ad => ad[0].targets.indexOf(episodeId) > -1);
}

// Accepts an episode and list of campaigns and returns an array of campaigns with the highest revenue
function findHighestRevenueAds(episode, campaigns) {
  const { audio, id } = episode;
  const allCombinations = getAllCombinations(id, campaigns);
  let maxRevenue = 0;
  let maxPlacedCampaigns = [];
  
  allCombinations.forEach(campaigns => {
    let episodeCounts = findEpisodeCounts(audio);
    let revenue = 0;
    let placedAds = []
    campaigns.forEach((campaign) => {
      let campaignCounts = findCampaignCount(campaign);
      if(campaignCanBePlaced(episodeCounts, campaignCounts)) {
        revenue = revenue + findRevenue(campaign);
        placedAds.push(campaign);
        types.forEach((type) => {
          episodeCounts[type] = episodeCounts[type] - campaignCounts[type];
        });
      }
      if(revenue > maxRevenue) {
        maxRevenue = revenue;
        maxPlacedCampaigns = placedAds;
      }
    });
  });

  return maxPlacedCampaigns
};

/* ----------------------------------------------------
             MAIN UTIL FUNCTION
------------------------------------------------------*/
function placeCampaigns(episode, campaigns) {
  const campaignsToPlace = findHighestRevenueAds(episode, campaigns);
  let audio = episode.audio;
  
  campaignsToPlace.forEach((campaign) => {
    campaign.forEach((spot) => {
      const replacedType = '['+spot.type+']';
      audio = audio.replace('['+spot.type+']', spot.audio);
    });
  })
  
  return stripCampaigns(audio);
}
