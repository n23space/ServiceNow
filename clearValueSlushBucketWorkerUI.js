function clearSelections(varName){
	var leftBucket = gel(varName + '_select_0');
	var rightBucket = gel(varName + '_select_1');
	var selectedOptions = rightBucket.options;

	//Move any options with IDs greater than maxOptions back to left bucket
	var selectedIDs = [];
	for(var i = 0; i < selectedOptions.length; i++){
		selectedIDs[i] = i;
	}
	//Move options and sort the left bucket
	moveSelectedOptions(selectedIDs, rightBucket, leftBucket, '--None--');
	sortSelect(leftBucket);
}
