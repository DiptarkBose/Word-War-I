
//Checking how the API works
/*
const unirest = require('unirest');

var url="https://twinword-word-association-quiz.p.mashape.com/type1/?area=gre&level=7";
var str="";
unirest.get(url)
	.header("X-Mashape-Key", "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
  	.header("Accept", "application/json")
  	.end(function (result) {
  	str="HAHAHA";
}); 
console.log(str); 
//console.log(quiz['quizlist'][0]['quiz'][0]);
*/
var request= require('request');
var url="https://twinword-word-association-quiz.p.mashape.com/type1/?area=gre&level=7"
request({
    headers: {
      "X-Mashape-Key": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "Accept": "application/json"
    },
    url: url,
    json: true
  }, function (error, response, body) {
    console.log(body);
});
