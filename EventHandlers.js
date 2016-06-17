$(document).ready(function(){

$(window).scroll(function () {
	console.log($(window).scrollTop());
	if ($(window).scrollTop() > 120) {
		$('#chapter').addClass('chapter-fixed');
	}
    if ($(window).scrollTop() < 120) {
		$('#chapter').removeClass('chapter-fixed');
	}
});


//go forward a chapter when clicked
$("#nextChapter").click(function(){
	if(chapterNumber < numOfChapters){
		chapterNumber++;
		displayScripture(book, chapterNumber);
	}else{
		chapterNumber = 1;
		displayScripture(book, chapterNumber);
	}
	localStorage.setItem("lastSpot", chapterNumber);
});

//Goes back a chapter when clicked
$("#previousChapter").click(function(){
	if(chapterNumber >= 2){
		chapterNumber--;
		displayScripture(book, chapterNumber);
	}else{
		chapterNumber = numOfChapters;
		displayScripture(book, chapterNumber);
	}
	localStorage.setItem("lastSpot", chapterNumber);
})

//Goes foward a chapter when clicked
$("#goToChapter").click(function(){
	var desiredChapter = parseInt($("#chapterBox").val());
	if(desiredChapter <= 6 && desiredChapter >= 1){
		chapterNumber = desiredChapter
		displayScripture(book, chapterNumber);
	}
	console.log(chapterNumber);
});

$("#bookSelect").change(function(ev) {
	var newBook = $("#bookSelect option:selected").text();
	if (curBook != newBook)
		switchBook(newBook);
});

// Checks for new selection whenever the mouse is released
$("#scripture").mouseup(function(ev) {
	var selection = window.getSelection().toString();
	console.log(window.getSelection());
	// return if no selection made
	if (selection == "") return;
	// regex to test for multiple words
	var reg = /.+ .+/g;
	// multi word selection
	if (reg.test(selection) == true) {
		// TODO: Do we need to do anything else here?
	}
	else { // single word selection
		var target = $(ev.target);
		if (target.data('opentips') != undefined || target.hasClass('verseNum') || target.hasClass('chapNum')) return;
		var word = selection.replace(/ /g, "");
		var strong = target.attr('strong');
		var lex = lexicon[strong];
		//If the definition is not in our lexicon
		if (lex == undefined) {
			target.opentip('definition unavailable', {style: "word"});
			return;
		}
		//If the definition is in our lexicon
		var shortDef = lex.brief;
		var morph = lex.morphology;
		//Formatting the text in our tooltip to be displayed
		target.opentip("<b>" + word + "</b>" + " - "
			+ shortDef
			+ "<br></br><a target='_blank' href='http://studybible.info/mac/" + morph + "'><i>(" + morph + ")</i></a>" ,
			{style: "word"});
	}
});

//Goes to specified section when clicked
$("#searchForm").submit(function(ev){
	ev.preventDefault();
	var searchText = $("#chapterBox").val();
	var matchReg = /^[1-9]+(?::[1-9]+)?(-[1-9]+(?::[1-9]+)?)?$/g;
	if (searchText == "" || matchReg.test(searchText) == false) return;
	localStorage.setItem("lastSpot", searchText);
	var searchData = {};
	// parse the search input into searchData
	if (searchText.search("-") != -1) { // range
		var ends = searchText.split("-");
		var start = ends[0].split(":");
		searchData.startChap = start[0];
		if (start.length > 1) searchData.startVerse = start[1];
		var end = ends[1].split(":");
		searchData.endChap = end[0];
		if (end.length > 1) searchData.endVerse = end[1];
		}
	else { // no range
		var target = searchText.split(":");
		searchData.startChap = target[0];
		if (target.length > 1) searchData.startVerse = target[1];
	}
	displayScripture(book, searchData.startChap, searchData.startVerse, searchData.endChap, searchData.endVerse);
});

//Displays scripture to the screen given data and a chapter
document.addEventListener('copy', appendSelection);
function appendSelection(){
	var selObj = window.getSelection();
	var verseStart = $(selObj.anchorNode.parentElement.parentElement).attr('verse');
	var verseEnd = $(selObj.focusNode.parentElement.parentElement).attr('verse');
	if(verseStart == verseEnd){
		var selectionInfo = "Chapter: " + chapterNumber + " Verse: " + verseStart;
	}else if(parseInt(verseStart) > parseInt(verseEnd)){
		var temp = verseStart;
		verseStart = verseEnd;
		verseEnd = temp;
		var selectionInfo = "Chapter: " + chapterNumber + " Verses: " + verseStart + "-" + verseEnd;
	}else{
		var selectionInfo = "Chapter: " + chapterNumber + " Verses: " + verseStart + "-" + verseEnd;
	}
	var copytext = selObj.toString() + " (" + selectionInfo + ")";
	console.log(copytext);
	var newdiv = document.createElement('div');
		newdiv.style.position = 'absolute';
		newdiv.style.left = '-99999px';

	document.body.appendChild(newdiv);
	newdiv.innerHTML = copytext;
	selObj.selectAllChildren(newdiv);

	window.setTimeout(function(){document.body.removeChild(newdiv);}, 100);
}

});
