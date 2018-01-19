/* ----------------------------------------------------
                  CONSTANTS
------------------------------------------------------*/
// If more ad types need to be added in the future, they can be changed here
const types = ["PRE", "MID", "POST"];

/* ----------------------------------------------------
                  HELPER FUNCTIONS
------------------------------------------------------*/

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
function findCampaignsToPlace(episode, campaigns) {
  const { audio, id } = episode;
  const episodeCounts = findEpisodeCounts(audio);
  const possibleCampaigns = filterCampaignsById(id, campaigns);

  const placedCampaigns = [];
  possibleCampaigns.forEach((campaign) => {
    const campaignCounts = findCampaignCount(campaign);
    if(campaignCanBePlaced(episodeCounts, campaignCounts)) {
      placedCampaigns.push(campaign);
      types.forEach((type) => {
        episodeCounts[type] = episodeCounts[type] - campaignCounts[type];
      });
    }
  });
  
  return placedCampaigns;
}

/* ----------------------------------------------------
             MAIN UTIL FUNCTION
------------------------------------------------------*/
function placeCampaigns(episode, campaigns) {
  const campaignsToPlace = findCampaignsToPlace(episode, campaigns);
  let audio = episode.audio;
  
  campaignsToPlace.forEach((campaign) => {
    campaign.forEach((spot) => {
      const replacedType = '['+spot.type+']';
      audio = audio.replace('['+spot.type+']', spot.audio);
    });
  })
  
  return stripCampaigns(audio);
}
