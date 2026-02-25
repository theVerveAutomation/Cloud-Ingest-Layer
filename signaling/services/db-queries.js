const { supabase } = require('../config');

async function fetchCamerasForAOrganization(organizationId) {
    const { data, error } = await supabase
        .from('cameras')
        .select('id, name, url, organizations!inner(displayid)')
        .eq('organizations.displayid', organizationId)
    if (error) {
        console.error('Error fetching cameras:', error);
        return null;
    }
    return data;
}

async function deleteSnapshots(cameras) {
    console.log('Deleting old snapshots from Supabase storage...');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Set cutoff to 30 days ago

    const { data: snapData, error: fetchError } = await supabase
        .from("camera_snaps")
        .select("id, url")
        .in("camera_id", cameras.map(cam => cam.id))
        .lt('created_at', cutoffDate.toISOString()) // Delete snapshots older than 30 days

    if (fetchError) {
        console.error('Error fetching snapshots:', fetchError);
        return null;
    }

    console.log(`Found ${snapData}`);
    if (!snapData || snapData.length === 0) {
        console.log('No old snapshots to delete.');
        return null;
    }

    const storagePaths = (snapData || []).map((row) => {
        if (row.url) {
            const match = row.url.match(/storage\/v1\/object\/public\/snapshots\/(.+)$/);
            if (match) {
                return match[1];
            }
        }
        return null;
    }).filter(Boolean);

    console.log(`Extracted ${storagePaths}`);

    // Delete from table
    const { error } = await supabase
        .from("camera_snaps")
        .delete()
        .in("id", snapData.map(row => row.id));

    if (error) {
        console.error("Bulk delete error:", error.message);
        return null;
    }

    // Remove from Supabase storage bucket
    if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
            .from("snapshots")
            .remove(storagePaths);
        if (storageError) {
            // Log but don't fail the request
            console.error("Bulk storage deletion error:", storageError.message);
        }
        console.log(`Successfully deleted ${storagePaths.length} old snapshots.`);
    } else {
        console.warn("No storage paths extracted for bulk delete.");
    }

    return null;
}

module.exports = {
    fetchCamerasForAOrganization,
    deleteSnapshots
};