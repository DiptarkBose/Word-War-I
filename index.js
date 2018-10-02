"use strict";

var Alexa = require('alexa-sdk');
var unirest = require('unirest');
var request = require('request');

var badges = ["Noob", "Master", "Grandmaster", "Legendary Grandmaster"];


function questionQuery(_this, stringMessage) {

  var url="https://twinword-word-association-quiz.p.mashape.com/type1/?area=gre&level=" + _this.attributes.stats['apiLevel'];

  request({
    headers: {
      "X-Mashape-Key": "YQfmpcMYUemshkP7Hbtdd4VRWAXmp10LJ99jsnDAxk3RFYbhYZ",
      "Accept": "application/json"
    },
    url: url,
    json: true
    }, function (error, response, body) {

    //Extracting questions and answers, storing them in an array
    var qArr=[];
    var aArr=[];
    for(var i=0; i<10; i++)
    {
      var responseString = "The three words are \n";
      responseString += body['quizlist'][i]['quiz'][0]+", \n"+body['quizlist'][i]['quiz'][1]+", and \n"+body['quizlist'][i]['quiz'][2]+".\n"
      responseString += " The first option is " + body['quizlist'][i]['option'][0] + " and the second option is " + body['quizlist'][i]['option'][1] + ". Which of the two options is the closest to the three words?";
      qArr.push(responseString);
      aArr.push(body['quizlist'][i]['correct']);
    }

    _this.attributes.quiz['questionArray']=qArr.slice(0);
    _this.attributes.quiz['answerArray']=aArr.slice(0);

    _this.response.speak(stringMessage + qArr[0]).listen("Just answer with the option number!");
    _this.emit(':responseReady'); 

  });
}

var handlers={

  'LaunchRequest' : function(){

    //New User
    if(Object.keys(this.attributes).length===0)
    {
      this.response.speak("Hi there! Welcome to Word War One, the fun way to master words for competitive exams. Ask for help to know the instructions!").listen();
      this.attributes.stats = {
        'totalQuestionsAnswered' : 0,
        'badgeLevel' : 0,
        'apiLevel' : 7
      };

    }
    //Returning User
    else
    {
      this.response.speak("Welcome back! You are currently at the " + badges[this.attributes.stats['badgeLevel']] + " badge. Ready to continue?").listen();
    }

    this.attributes.quiz = {
      'questionArray' : [],
      'answerArray' : []   
    };

    this.attributes['qCount'] = 0;
    this.emit(':responseReady');
  },

  'AskQuestionIntent': function(){

    //Asking question at the beginning of a session
    questionQuery(this, "");

    var qNo = this.attributes['qCount'];
    var responseString = this.attributes.quiz['questionArray'][qNo];
    this.attributes['qCount']++;
    //this.response.speak(responseString).listen("Just answer with the option number!");
    //this.emit(':responseReady');
    
  },

  'AnswerQuestionIntent': function(){

    var responseString="";
    var chosenOption = parseInt(this.event.request.intent.slots.AnswerOption.value, 10);
    var qNo = this.attributes['qCount'];
    var flag=0;

    //this.response.speak(chosenOption+" "+this.attributes.quiz['answerArray'][qNo-1]);
    //this.emit(':responseReady');
    
    //Checking User Answer
    if(chosenOption == this.attributes.quiz['answerArray'][qNo-1])
    {
      responseString="Booyah! Correct Answer! "

      this.attributes.stats['totalQuestionsAnswered']++;

      //Checking Badge Increment
      if(this.attributes.stats['totalQuestionsAnswered']==50)
      {
        responseString += "Congratulations! You have earned the Master badge! Play on to acquire more badges! ";
        this.attributes.stats['badgeLevel']++;
        this.attributes.stats['apiLevel']++;
        flag=1;
      }
      else if(this.attributes.stats['totalQuestionsAnswered']==75)
      {
        responseString += "Guess who just earned the Grandmaster badge! Keep it up, and keep on playing for more badges! ";
        this.attributes.stats['badgeLevel']++;
        this.attributes.stats['apiLevel']++;
        flag=1;
      }
      else if(this.attributes.stats['totalQuestionsAnswered']==100)
      {
        responseString += "Congratulations on completing the game! All hail the Legendary Grandmaster! You can still continue playing! ";
        this.attributes.stats['badgeLevel']++;
        this.attributes.stats['apiLevel']++;
        flag=1;
      }
    }
    else
      responseString ="Bummer! Wrong Answer! The correct answer is option number " + this.attributes.quiz['answerArray'][qNo-1]+ ". ";
    

    //Crafting the next set of question if quiz content exhausted or badge increment
    if(qNo>=10 || flag==1)
    {
      questionQuery(this, responseString); 
      this.attributes['qCount']=0;
      flag=0;
    }

    else
    {
      var qNo = this.attributes['qCount'];
      responseString += this.attributes.quiz['questionArray'][qNo];
      this.attributes['qCount']++;

      this.response.speak(responseString).listen("Just answer with the option number!");
      this.emit(':responseReady');
    }
    
  },

  'SessionEndedRequest': function(){
    this.emit(':saveState', true);
  },

  'StatsIntent' : function(){
    var responseString = "You have answered " + this.attributes.stats['totalQuestionsAnswered'] +" questions and are currently at the " + badges[this.attributes.stats['badgeLevel']] + " badge level!";
    this.response.speak(responseString).listen();
    this.emit(':responseReady');
  },

  'AMAZON.FallbackIntent' : function()
  {
    this.response.speak("Lets play soon!");
    this.emit(':responseReady');
  },

  'AMAZON.StopIntent' : function()
  {
    this.response.speak("Lets play soon!");
    this.emit(':responseReady');
  },

  'AMAZON.CancelIntent' : function()
  {
    this.response.speak("Lets play soon!");
    this.emit(':responseReady');
  },

  'AMAZON.HelpIntent' : function()
  {
    this.response.speak("Lets play soon!");
    this.emit(':responseReady');
  }
}

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
  alexa.appId = "amzn1.ask.skill.6fc61557-fc3c-4a2d-97fa-611f1b472987";
  alexa.registerHandlers(handlers);
  alexa.dynamoDBTableName = 'Stats';
  alexa.execute();
};