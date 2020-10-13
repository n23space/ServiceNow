function runScheduleJob(jobId) {
	var autoScriptGr = new GlideRecord('sysauto_script');
	if (!autoScriptGr.get(jobId)) {
		throw new Error('Unable to find scheduled job');
	}
	gs.executeNow(autoScriptGr);
}
runScheduleJob('4f54eb681bac9c10780843f28d4bcb38');
