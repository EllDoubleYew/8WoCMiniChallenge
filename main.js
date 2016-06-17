//INITIALIZATION
var chapterNumber = 1;
var numOfChapters;
var curBook;
var book;
var bookLookup = {};
var lexicon = {};

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
		chapterString += '<span chapter="' + chap + '" verse="1" class="chapNum">Chapter ' + chap + '</span> ';
		for(verse in data[chap]){
			chapterString += '<span verse="' + verse + '" class="verseNum">' + verse + '</span> ';
			chapterString += data[chap][verse];
		}
	}

	$("#chapter").html("Chapter " + startChap + (startChap == endChap ? "" : ("-" + (endChap > numOfChapters ? numOfChapters : endChap))));
	$("#scripture").html(chapterString);
}

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
getBookList();
//getScripture('Ephesians.json');

//Handles mutable chapter bar up top


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

});
