function scheduleImportJob() {
  var jobId = '4f54eb681bac9c10780843f28d4bcb38';
  var gr = new GlideRecord('sysauto_script');
  if (!gr.get(jobId)) {
    throw new Error('Unable to find import job');
  }
  gs.executeNow(gr);
}
scheduleImportJob();
