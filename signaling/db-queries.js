const { supabase } = require('./config');

async function fetchCamerasForAOrganization(organizationId) {
    const { data, error } = await supabase
        .from('cameras')
        .select('name, url, organizations!inner(displayid)')
        .eq('organizations.displayid', organizationId)
    if (error) {
        console.error('Error fetching cameras:', error);
        return null;
    }
    return data;
}


module.exports = {
    fetchCamerasForAOrganization
};