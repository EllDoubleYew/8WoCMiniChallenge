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
var curBook;
var book;
var bookLookup = {};
var lexicon = {};
getBookList();
//getScripture('Ephesians.json');

//Handles mutable chapter bar up top
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

//AJAX CALLS FOR BOOK AND LEXICON
//First call gets and parses our JSON as well as adds metadata

function switchBook(bookName) {
	var newBook = bookList[bookName];
	// double ajax call!
	return $.when($.getJSON('data/' + newBook.Text), $.getJSON('data/' + newBook.Lex)).then(function(bookData, lexData) {
		// update book data
		var reg = /[^A-Za-z0-9 -]+ G[0-9]{2,6}/g;
		var result = [];
		// yeah im not proud of this but fingers crossed it works
		var dat = bookData[0];
		dat = dat[function() { for (var a in dat) {return a;}}()];
		//Iteration goes through chapters then verses
		$.each(dat, function(chap, verses) {
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
					dat[chap][verse] = newVerse;

				});
			});
			// wipe book and replace it
		book = {};
		book = dat;
		curBook = bookName;
		numOfChapters = Object.keys(dat).length;
		// update lexicon
		lexicon = {};
			for (var i = 0; i < lexData[0].length; i++) {
				lexicon[lexData[0][i].strongs] = lexData[0][i];
			}
			$("#bookTitle").text(bookName + " in Greek");

			displayScripture(book, 1, 1, 1, 1);

	}, function(err) { // if either json file doesn't exist
		console.log("Could not get book data for " + bookName);
	});
}

function getBookList() {
	$.ajax({
		url: 'data/books.json',
		dataType: 'json',
		type: 'get',
		cache: false,
		success: function(data) {
				bookList = data;
				var options = "";
				for (book in data) {
					options += "<option value='1'>" + book + "</option>";
				}
				if (options != "") {
					$("#bookSelect").html(options);
					switchBook($("#bookSelect option")[0].innerHTML).then(function() {
						$("#chapterBox").val(localStorage.getItem("lastSpot"));
						$("#searchForm").trigger("submit")
					});
				}
				else {
					console.log("Error: Could not load books");
				}

		},
		error: function(err) {
			alert("Error: Could not fetch book list");
		}
	});
}

//Displays scripture to the screen given data and a chapter
function displayScripture(data, startChap, startVerse, endChap, endVerse){
	var chapterString = "";
	if (startChap > numOfChapters) return;
	if (endChap == undefined) endChap = startChap;
	if (endChap < startChap) { // swap if need b
		var temp = endChap;
		endChap = startChap;
		startChap = temp;
		temp = endVerse;
		endVerse = startVerse;
		startVerse = temp;
	}
	for (var chap = startChap; chap <= endChap && chap <= numOfChapters; chap++) {
		chapterString += '<span chapter="' + chap + '" verse="1" class="chapNum">' + chap + '</span> ';
		for(verse in data[chap]){
			chapterString += '<span verse="' + verse + '" class="verseNum">' + verse + '</span> ';
			chapterString += data[chap][verse];
		}
	}

	$("#chapter").html("Chapter " + startChap + (startChap == endChap ? "" : ("-" + (endChap > numOfChapters ? numOfChapters : endChap))));
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
