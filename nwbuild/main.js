$(document).ready(function() {

//Defining styles for our Opentips
Opentip.styles.word = {
	delay:0,
	showOn: 'click',
	tipJoint: 'bottom',
	fixed: true,
	hideTrigger: "closeButton",
	closeButtonRadius: 10,
	offset: [0, -10],
	closeButtonCrossSize: 10,
	closeButtonLinkOverscan: 12
};

//INITIALIZATION
var chapterNumber = 1;
var numOfChapters;
var book;
var lexicon = {};

getScripture('Ephesians.json');

//go forward a chapter when clicked
$("#nextChapter").click(function(){
	if(chapterNumber < numOfChapters){
		chapterNumber++;
		displayScripture(book, chapterNumber);
	}else{
		chapterNumber = 1;
		displayScripture(book, chapterNumber);
	}
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
})

//Goes foward a chapter when clicked
$("#goToChapter").click(function(){
	var desiredChapter = parseInt($("#chapterBox").val());
	if(desiredChapter <= 6 && desiredChapter >= 1){
		chapterNumber = desiredChapter
		displayScripture(book, chapterNumber);
	}
	console.log(chapterNumber);
})

// Checks for new selection whenever the mouse is released
$("#scripture").mouseup(function(ev) {
	var selection = window.getSelection().toString();
	// return if no selection made
	if (selection == "") return;
	// regex to test for multiple words
	var reg = /.+ .+/g;
	// multi word selection
	if (reg.test(selection) == true) {
		//we have yet to handle this!
	}
	else { // single word selection
		if ($(ev.target).data('opentips') != undefined) return;
		var word = selection.replace(/ /g, "");
		var strong = $(ev.target).attr('strong');
		var lex = lexicon[strong];
		//If the definition is not in our lexicon
		if (lex == undefined) {
			$(ev.target).opentip('definition unavailable', {style: "word"});
			return;
		}
		//If the definition is in our lexicon
		var shortDef = lex.brief;
		var morph = lex.morphology;
		//Formatting the text in our tooltip to be displayed
		$(ev.target).opentip("<b>" + word + "</b>" + " - "
			+ shortDef
			+ "<br></br><i>(" + morph + ")</i>" ,
			{style: "word"});
	}
});

//Goes back a chapter when clicked
$("#previousChapter").click(function(){
	if(chapterNumber >= 2){
	chapterNumber--;
	displayScripture(book, chapterNumber);
	}
});

//Goes to specified section when clicked
$("#searchForm").submit(function(ev){
	ev.preventDefault();
	var searchText = $("#chapterBox").val();
	if (searchText == "") return;
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
	console.log(searchData);
	displayScripture(book, searchData.startChap, searchData.startVerse, searchData.endChap, searchData.endVerse);
});

//AJAX CALLS FOR BOOK AND LEXICON
//First call gets and parses our JSON as well as adds metadata
function getScripture(url){
	$.ajax({
	url: url,
	dataType: 'json',
	type: 'get',
	cache: false,
	success: function(data){

		//This regex finds our strong numbers
		var reg = /[^A-Za-z0-9 -]+ G[0-9]{2,6}/g;
		var result = [];

		//Iteration goes through chapters then verses
		$.each(data.Ephesians, function(chap, verses) {
	      $.each(verses, function(verse, text) {

	      	//We remove all the text in {} and remove the []
	      	text = text.replace(/{.*}|[\[\]]/g, "");

	      	//Placing the verse number in our span so that we can add it to the users clip board later
	      	var newVerse = "<span verse='" + verse + "'>";

	      	//Adds the strong number to a strong container on the span and adds places the word in the wrapper
	      	while(result = reg.exec(text)){
	      		var a = result[0].split(" ");
	      		newVerse += "<span strong ='" + a[1].substring(1) + "'>" + a[0] + " </span>";
	      	}

	      	//Closing our span tag for the verse
	      	newVerse += "</span>"
	        data.Ephesians[chap][verse] = newVerse;
	      });
	    });

		//Update the view with data we got from our AJAX call
		book = data;
		numOfChapters = Object.keys(book.Ephesians).length;
		displayScripture(data, chapterNumber);
	},
	error: function(err) {
		alert("Could not get Epheisans JSON data");
	}
});


//This call gets and structures the lexicon
$.ajax({
	url: 'lexicon-eph-english.json',
	dataType: 'json',
	type: 'get',
	cache: false,

	//Here we read in our lexicon and place it into a new structure
	//TODO: EVAN could you maybe explain this better?
	success: function(data) {
		for (var i = 0; i < data.length; i++) {
			lexicon[data[i].strongs] = data[i];
		}
	},
	error: function(err) {
		alert("Could not get lexicon!");
	}
});
}

//Displays scripture to the screen given data and a chapter
function displayScripture(data, startChap, startVerse, endChap, endVerse){
	var chapterString = "";
	if (endChap == undefined) endChap = startChap;
	if (endChap < startChap) { // swap if need b
		var temp = endChap;
		endChap = startChap;
		startChap = temp;
		temp = endVerse;
		endVerse = startVerse;
		startVerse = temp;
	}
	for (var chap = startChap; chap <= endChap; chap++) {
		chapterString += '<span chapter="' + chap + '" verse="1" class="chapNum">' + chap + '</span> ';
		for(verse in data["Ephesians"][chap]){
			chapterString += '<span verse="' + verse + '" class="verseNum">' + verse + '</span> ';
			chapterString += data["Ephesians"][chap][verse];
		}
	}

	$("#chapter").html("Chapter " + startChap + ((startChap == endChap) ? "" : ("-" + endChap)));
	$("#scripture").html(chapterString);
}

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

document.addEventListener('copy', appendSelection);

});
