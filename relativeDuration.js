// Perform relative duration calculation using the 'calculator' variable (which is a DurationCalculator object)
//var rd =  new RelativeDuration();
var seconds= 0;
try {
	if(current && current.due_date !== undefined) {
		var dc = new DurationCalculator();
		seconds = dc.calcScheduleDuration('',current.due_date);
	}
} catch (e) {
}
//calculator.setSchedule('3889c18d68eb41000de96c834a93360c', 'Europe/Amsterdam');
//calculator.calcRelativeDueDate(calculator.startDateTime, days, "16:00:00");
calculator.calcDuration(seconds);
